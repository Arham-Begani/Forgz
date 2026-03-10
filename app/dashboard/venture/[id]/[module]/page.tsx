'use client'

import {
  useState,
  useEffect,
  useRef,
  type KeyboardEvent,
  type FormEvent,
} from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { AgentStatusRow } from '@/components/ui/AgentStatusRow'
import { MessageStream } from '@/components/ui/MessageStream'
import { ResultCard } from '@/components/ui/ResultCard'

// ─── Module metadata (mirrors ModulePicker) ──────────────────────────────────

const MODULES = [
  { id: 'full-launch', label: 'Full Launch', accent: '#C4975A', description: 'Run all agents together — research, brand, landing, feasibility', agentName: 'Genesis Engine' },
  { id: 'research', label: 'Research', accent: '#5A8C6E', description: 'Market data, TAM/SAM/SOM, competitors, 10 ranked concepts', agentName: 'Genesis' },
  { id: 'branding', label: 'Branding', accent: '#5A6E8C', description: 'Brand name, voice, colors, typography, full Brand Bible', agentName: 'Identity' },
  { id: 'marketing', label: 'Marketing', accent: '#8C5A7A', description: '30-day GTM, 90 social posts, SEO outlines, email sequence', agentName: 'Content Factory' },
  { id: 'landing', label: 'Landing Page', accent: '#8C7A5A', description: 'Sitemap, copy, Next.js component, live deployment', agentName: 'Pipeline' },
  { id: 'feasibility', label: 'Feasibility', accent: '#7A5A8C', description: 'Financial model, risk matrix, GO/NO-GO verdict', agentName: 'Feasibility' },
] as const

type ModuleId = typeof MODULES[number]['id']

function getModule(id: string) {
  return MODULES.find(m => m.id === id) ?? MODULES[0]
}

// ─── Suggestions ─────────────────────────────────────────────────────────────

const SUGGESTIONS: Record<string, [string, string]> = {
  'full-launch': ['Launch an async client portal for freelance developers', 'Build a B2B expense tracking tool for remote teams'],
  'research': ['Validate an AI writing assistant for solo lawyers', 'Research the market for async video feedback tools'],
  'branding': ['Create a brand for a B2B invoice automation startup', 'Build the identity for a wellness app for remote workers'],
  'marketing': ['Build a 30-day GTM for a Notion template marketplace', 'Create a social strategy for a SaaS HR onboarding tool'],
  'landing': ['Build a landing page for a code review automation tool', 'Deploy a page for an AI meeting notes product'],
  'feasibility': ['Validate financial model for a subscription recipe app', 'Assess feasibility of a niche job board for designers'],
}

// ─── Full Launch agent rows ───────────────────────────────────────────────────

const FULL_LAUNCH_AGENTS = [
  { key: 'research', label: 'Market Research', detail: 'Competitor analysis & TAM calc' },
  { key: 'branding', label: 'Brand Identity', detail: 'Generating logos & color palettes' },
  { key: 'landing', label: 'Landing Page', detail: 'Wireframing & Copywriting' },
  { key: 'feasibility', label: 'Feasibility Check', detail: 'Legal & Technical risk assessment' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentStatus = 'pending' | 'running' | 'complete' | 'failed'

interface AgentState {
  status: AgentStatus
  detail: string
  durationMs?: number
}

interface ConversationEntry {
  conversationId: string
  prompt: string
  lines: string[]
  agentStatuses: Record<string, AgentState>
  result: Record<string, unknown> | null
  isRunning: boolean
  isError: boolean
}

// ─── Module icon SVG ──────────────────────────────────────────────────────────

function ModuleIconSvg({ id, size = 20 }: { id: string; size?: number }) {
  const s = size
  switch (id) {
    case 'full-launch': return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </svg>
    )
    case 'research': return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    )
    case 'branding': return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
      </svg>
    )
    case 'marketing': return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l19-9-9 19-2-8-8-2z" />
      </svg>
    )
    case 'landing': return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" />
      </svg>
    )
    case 'feasibility': return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    )
    default: return null
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ModulePage() {
  const params = useParams()
  const ventureId = params.id as string
  const moduleParam = params.module as string

  // Active module (picker can change it without navigation)
  const [activeModule, setActiveModule] = useState<ModuleId>(moduleParam as ModuleId)
  const mod = getModule(activeModule)
  const suggestions = SUGGESTIONS[activeModule] ?? SUGGESTIONS['research']

  // Venture name
  const [ventureName, setVentureName] = useState<string>('...')

  // Conversation history
  const [conversations, setConversations] = useState<ConversationEntry[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)

  // Input
  const [prompt, setPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatAreaRef = useRef<HTMLDivElement>(null)

  // ── Load venture + conversation history on mount ────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/ventures/${ventureId}`)
        if (!res.ok) return
        const data = await res.json()
        setVentureName(data.name ?? 'Venture')

        // Build history entries for this module
        const moduleConvos: ConversationEntry[] = (
          data.conversations?.[activeModule] ?? []
        ).map((c: {
          id: string
          prompt: string
          stream_output?: string[]
          result?: Record<string, unknown>
          status?: string
        }) => ({
          conversationId: c.id,
          prompt: c.prompt,
          lines: c.stream_output ?? [],
          agentStatuses: buildCompletedStatuses(mod.accent),
          result: c.result && Object.keys(c.result).length > 0 ? c.result : null,
          isRunning: false,
          isError: c.status === 'failed',
        }))
        setConversations(moduleConvos.reverse())
      } finally {
        setHistoryLoaded(true)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventureId, activeModule])

  // ── Scroll to bottom when conversations change ──────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations])

  // ── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault()
    const text = prompt.trim()
    if (!text || isSubmitting) return

    setPrompt('')
    setIsSubmitting(true)

    const entryId = crypto.randomUUID()

    // Append user message + empty agent entry immediately
    const newEntry: ConversationEntry = {
      conversationId: entryId,
      prompt: text,
      lines: [],
      agentStatuses: buildInitialStatuses(),
      result: null,
      isRunning: true,
      isError: false,
    }
    setConversations(prev => [...prev, newEntry])

    try {
      // 1. POST to start run
      const runRes = await fetch(`/api/ventures/${ventureId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: activeModule, prompt: text }),
      })
      if (!runRes.ok) throw new Error('Failed to start run')
      const { conversationId: serverConversationId } = await runRes.json()

      // Define updateEntry *after* we get the final conversationId so its closure captures it
      function updateEntry(patch: Partial<ConversationEntry> | ((e: ConversationEntry) => Partial<ConversationEntry>)) {
        setConversations(prev => prev.map(c => {
          if (c.conversationId !== serverConversationId && c.conversationId !== entryId) return c
          const delta = typeof patch === 'function' ? patch(c) : patch
          return { ...c, ...delta }
        }))
      }

      // Update with real conversationId
      setConversations(prev => prev.map(c =>
        c.conversationId === entryId ? { ...c, conversationId: serverConversationId } : c
      ))

      // 2. Open SSE stream
      const es = new EventSource(`/api/ventures/${ventureId}/stream/${serverConversationId}`)

      es.addEventListener('message', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'line') {
            updateEntry(prev => ({ lines: [...prev.lines, data.content] }))
          } else if (data.type === 'agent-status') {
            const { agentId, status, detail, durationMs } = data
            updateEntry(prev => ({
              agentStatuses: {
                ...prev.agentStatuses,
                [agentId]: { status, detail: detail ?? prev.agentStatuses[agentId]?.detail ?? '', durationMs },
              },
            }))
          } else if (data.type === 'complete') {
            updateEntry({ isRunning: false, result: data.result, agentStatuses: buildCompletedStatuses(mod.accent) })
            es.close()
            setIsSubmitting(false)
          } else if (data.type === 'error') {
            updateEntry({ isRunning: false, isError: true })
            es.close()
            setIsSubmitting(false)
          }
        } catch (err) {
          console.error("Error parsing SSE message:", err)
        }
      })

      es.addEventListener('error', () => {
        updateEntry({ isRunning: false, isError: true })
        es.close()
        setIsSubmitting(false)
      })

    } catch {
       setConversations(prev => prev.map(c => {
          if (c.conversationId !== entryId) return c
          return { ...c, isRunning: false, isError: true }
       }))
      setIsSubmitting(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  function retryEntry(entry: ConversationEntry) {
    setPrompt(entry.prompt)
    setConversations(prev => prev.filter(c => c.conversationId !== entry.conversationId))
    textareaRef.current?.focus()
  }

  // ── Module picker inline selector ────────────────────────────────────────
  const [pickerOpen, setPickerOpen] = useState(false)

  const hasMessages = conversations.length > 0 && historyLoaded

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <header style={headerStyle}>
        <div className="flex items-center gap-3">
          <div style={{ ...headerIconStyle, background: `${mod.accent}18`, color: mod.accent }}>
            <ModuleIconSvg id={activeModule} size={18} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>
              {mod.label}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>
              {ventureName}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span style={agentBadgeStyle(mod.accent)}>{mod.agentName}</span>
        </div>
      </header>

      {/* ── Chat area ── */}
      <div
        ref={chatAreaRef}
        className="flex-1 overflow-y-auto w-full"
      >
        <div style={chatInnerStyle}>

          {/* Empty state */}
          {!hasMessages && historyLoaded && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={emptyStateStyle}
            >
              <div style={{ color: mod.accent, marginBottom: 16 }}>
                <ModuleIconSvg id={activeModule} size={32} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: '0 0 8px' }}>
                {mod.label}
              </h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 24px', textAlign: 'center', maxWidth: 360 }}>
                {mod.description}
              </p>
              <motion.div 
                className="flex gap-2 flex-wrap justify-center"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                }}
              >
                {suggestions.map(s => (
                  <motion.button
                    key={s}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      show: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setPrompt(s); textareaRef.current?.focus() }}
                    style={chipStyle(mod.accent)}
                  >
                    {s}
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Conversations */}
          {conversations.map(entry => (
            <motion.div 
              key={entry.conversationId} 
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ marginBottom: 32 }}
            >

              {/* User message */}
              <div className="flex justify-end" style={{ marginBottom: 16 }}>
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  style={userBubbleStyle}
                >
                  {entry.prompt}
                </motion.div>
              </div>

              {/* Agent response */}
              <div className="flex flex-col gap-3">
                {/* Avatar + agent name */}
                <div className="flex items-center gap-2">
                  <div style={{ ...avatarStyle, background: `${mod.accent}18`, color: mod.accent }}>
                    <ModuleIconSvg id={activeModule} size={14} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                    {mod.agentName}
                  </span>
                </div>

                {/* Full Launch: status rows + stream */}
                {activeModule === 'full-launch' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {FULL_LAUNCH_AGENTS.map(agent => {
                      const s = entry.agentStatuses[agent.key] ?? { status: 'pending', detail: agent.detail }
                      const agentIdMap: Record<string, any> = {
                        research: 'genesis',
                        branding: 'identity',
                        landing: 'pipeline',
                        feasibility: 'feasibility'
                      }
                      return (
                        <AgentStatusRow
                          key={agent.key}
                          agentId={agentIdMap[agent.key]}
                          status={s.status === 'pending' ? 'waiting' : s.status as any}
                        />
                      )
                    })}
                  </div>
                )}

                {/* Stream */}
                {(entry.lines.length > 0 || entry.isRunning) && (
                  <MessageStream
                    lines={entry.lines}
                    isComplete={!entry.isRunning}
                    moduleAccent={mod.accent}
                  />
                )}

                {/* Result */}
                {entry.result && !entry.isRunning && (
                  <div style={{ marginTop: 4 }}>
                    <ResultCard
                      moduleId={activeModule}
                      result={entry.result}
                      deploymentUrl={entry.result.deploymentUrl as string}
                    />
                  </div>
                )}

                {/* Error state */}
                {entry.isError && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={errorBoxStyle}
                  >
                    <span style={{ fontSize: 13, color: '#dc2626' }}>Something went wrong.</span>
                    <button
                      onClick={() => retryEntry(entry)}
                      style={retryBtnStyle}
                    >
                      Try Again
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* ── Input area ── */}
      <div style={inputAreaStyle}>
        <div style={inputInnerStyle}>
          <form onSubmit={handleSubmit}>
            <div style={inputWrapStyle}>

              {/* Module picker pill (top-left inside input) */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setPickerOpen(p => !p)}
                  style={modulePickerPillStyle(mod.accent)}
                >
                  <span style={{ color: mod.accent, display: 'flex', alignItems: 'center' }}>
                    <ModuleIconSvg id={activeModule} size={13} />
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: mod.accent }}>{mod.label}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={mod.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Dropdown */}
                {pickerOpen && (
                  <div style={pickerDropdownStyle}>
                    {MODULES.map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => { setActiveModule(m.id as ModuleId); setPickerOpen(false) }}
                        style={{
                          ...pickerOptionStyle,
                          background: m.id === activeModule ? `${m.accent}12` : 'transparent',
                        }}
                      >
                        <span style={{ color: m.accent, display: 'flex', alignItems: 'center' }}>
                          <ModuleIconSvg id={m.id} size={13} />
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text)' }}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${mod.label} anything about your venture...`}
                rows={1}
                style={textareaStyle}
              />

              {/* Send button (bottom-right) */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!prompt.trim() || isSubmitting}
                style={{
                  ...sendBtnStyle,
                  background: !prompt.trim() || isSubmitting ? 'var(--border)' : mod.accent,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
                </svg>
              </motion.button>
            </div>

            <p style={hintStyle}>⌘↵ to run · Shift↵ for new line</p>
          </form>
        </div>
      </div>

      {/* Click-away for picker */}
      {pickerOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9 }}
          onClick={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildInitialStatuses(): Record<string, AgentState> {
  return Object.fromEntries(
    FULL_LAUNCH_AGENTS.map(a => [a.key, { status: 'pending' as AgentStatus, detail: a.detail }])
  )
}

function buildCompletedStatuses(_accent: string): Record<string, AgentState> {
  return Object.fromEntries(
    FULL_LAUNCH_AGENTS.map(a => [a.key, { status: 'complete' as AgentStatus, detail: a.detail }])
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const headerStyle: React.CSSProperties = {
  height: 56,
  padding: '0 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid var(--border)',
  background: 'var(--sidebar)',
  flexShrink: 0,
}

const headerIconStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

function agentBadgeStyle(accent: string): React.CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 600,
    color: accent,
    background: `${accent}14`,
    border: `1px solid ${accent}30`,
    borderRadius: 20,
    padding: '3px 10px',
    letterSpacing: '0.02em',
  }
}

const chatInnerStyle: React.CSSProperties = {
  maxWidth: 660,
  margin: '0 auto',
  padding: '32px 24px 24px',
  width: '100%',
}

const emptyStateStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'calc(100vh - 240px)',
  padding: '0 24px',
}

function chipStyle(accent: string): React.CSSProperties {
  return {
    fontSize: 12,
    color: accent,
    background: `${accent}10`,
    border: `1px solid ${accent}25`,
    borderRadius: 20,
    padding: '6px 14px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 150ms',
  }
}

const userBubbleStyle: React.CSSProperties = {
  maxWidth: '80%',
  fontSize: 14,
  color: 'var(--text)',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-subtle)',
  borderRadius: '20px 20px 4px 20px',
  padding: '12px 18px',
  lineHeight: 1.5,
}

const avatarStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const errorBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 14px',
  background: '#dc262608',
  border: '1px solid #dc262620',
  borderRadius: 8,
}

const retryBtnStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: '#dc2626',
  background: 'transparent',
  border: '1px solid #dc262630',
  borderRadius: 6,
  padding: '4px 10px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const inputAreaStyle: React.CSSProperties = {
  background: 'transparent',
  padding: '16px 24px 24px',
  flexShrink: 0,
  zIndex: 10,
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
}

const inputInnerStyle: React.CSSProperties = {
  maxWidth: 660,
  margin: '0 auto',
}

const inputWrapStyle: React.CSSProperties = {
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--shadow-premium)',
  borderRadius: 20,
  padding: '12px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  position: 'relative',
}

function modulePickerPillStyle(accent: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 8px',
    borderRadius: 20,
    border: `1px solid ${accent}30`,
    background: `${accent}10`,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}

const pickerDropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  left: 0,
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: 4,
  zIndex: 20,
  minWidth: 180,
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
}

const pickerOptionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '7px 10px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
  transition: 'background 100ms',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: 14,
  color: 'var(--text)',
  fontFamily: 'inherit',
  resize: 'none',
  lineHeight: 1.5,
  padding: 0,
}

const sendBtnStyle: React.CSSProperties = {
  alignSelf: 'flex-end',
  width: 32,
  height: 32,
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'background 150ms',
}

const hintStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--muted)',
  fontFamily: "'JetBrains Mono', monospace",
  margin: '6px 0 0',
  textAlign: 'center',
  opacity: 0.7,
}
