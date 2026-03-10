'use client'

import {
  useState,
  useEffect,
  useRef,
  type KeyboardEvent,
  type FormEvent,
} from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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

  const [activeModule, setActiveModule] = useState<ModuleId>(moduleParam as ModuleId)
  const mod = getModule(activeModule)
  const suggestions = SUGGESTIONS[activeModule] ?? SUGGESTIONS['research']

  const [ventureName, setVentureName] = useState<string>('...')
  const [conversations, setConversations] = useState<ConversationEntry[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const [prompt, setPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations])

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault()
    const text = prompt.trim()
    if (!text || isSubmitting) return

    setPrompt('')
    setIsSubmitting(true)

    const entryId = crypto.randomUUID()

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
      const runRes = await fetch(`/api/ventures/${ventureId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: activeModule, prompt: text }),
      })
      if (!runRes.ok) throw new Error('Failed to start run')
      const { conversationId: serverConversationId } = await runRes.json()

      function updateEntry(patch: Partial<ConversationEntry> | ((e: ConversationEntry) => Partial<ConversationEntry>)) {
        setConversations(prev => prev.map(c => {
          if (c.conversationId !== serverConversationId && c.conversationId !== entryId) return c
          const delta = typeof patch === 'function' ? patch(c) : patch
          return { ...c, ...delta }
        }))
      }

      setConversations(prev => prev.map(c =>
        c.conversationId === entryId ? { ...c, conversationId: serverConversationId } : c
      ))

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

  const [pickerOpen, setPickerOpen] = useState(false)
  const hasMessages = conversations.length > 0 && historyLoaded

  const canSubmit = !!prompt.trim() && !isSubmitting

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', position: 'relative' }}>

      {/* Ambient background orb */}
      <div style={{
        position: 'fixed',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${mod.accent}18 0%, transparent 70%)`,
        filter: 'blur(80px)',
        top: -100,
        right: -80,
        pointerEvents: 'none',
        zIndex: 0,
        animation: 'blob-float 18s ease-in-out infinite',
      }} />

      {/* ── Header ── */}
      <motion.header
        style={headerStyle}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Accent top line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: `linear-gradient(90deg, ${mod.accent}40, ${mod.accent}80, ${mod.accent}40)` }} />

        <div className="flex items-center gap-3">
          <motion.div
            style={{ ...headerIconStyle, background: `${mod.accent}18`, color: mod.accent }}
            whileHover={{ scale: 1.05 }}
          >
            <ModuleIconSvg id={activeModule} size={18} />
          </motion.div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
              {mod.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, letterSpacing: '0.01em' }}>
              {ventureName}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.span
            style={agentBadgeStyle(mod.accent)}
            whileHover={{ scale: 1.04 }}
          >
            {mod.agentName}
          </motion.span>
        </div>
      </motion.header>

      {/* ── Chat area ── */}
      <div
        ref={chatAreaRef}
        className="flex-1 overflow-y-auto w-full"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div style={chatInnerStyle}>

          {/* Empty state */}
          <AnimatePresence>
            {!hasMessages && historyLoaded && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={emptyStateStyle}
              >
                {/* Icon with glow ring */}
                <div style={{ position: 'relative', marginBottom: 20 }}>
                  <div style={{
                    position: 'absolute', inset: -16,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${mod.accent}20 0%, transparent 70%)`,
                    filter: 'blur(12px)',
                    animation: 'glow-pulse 3s ease-in-out infinite',
                  }} />
                  <motion.div
                    style={{
                      width: 64, height: 64, borderRadius: 18,
                      background: `${mod.accent}14`,
                      border: `1px solid ${mod.accent}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: mod.accent,
                      position: 'relative', zIndex: 1,
                      boxShadow: `0 8px 24px ${mod.accent}20`,
                    }}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ModuleIconSvg id={activeModule} size={28} />
                  </motion.div>
                </div>

                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  {mod.label}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 28px', textAlign: 'center', maxWidth: 360, lineHeight: 1.7 }}>
                  {mod.description}
                </p>

                {/* Suggestion chips */}
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
                        hidden: { opacity: 0, y: 12, scale: 0.95 },
                        show: { opacity: 1, y: 0, scale: 1 }
                      }}
                      whileHover={{ scale: 1.04, y: -1, boxShadow: `0 4px 16px ${mod.accent}20` }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => { setPrompt(s); textareaRef.current?.focus() }}
                      style={chipStyle(mod.accent)}
                    >
                      {s}
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conversations */}
          {conversations.map((entry, i) => (
            <motion.div
              key={entry.conversationId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: i === conversations.length - 1 ? 0 : 0 }}
              style={{ marginBottom: 36 }}
            >
              {/* User message */}
              <div className="flex justify-end" style={{ marginBottom: 18 }}>
                <motion.div
                  initial={{ opacity: 0, x: 16, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={userBubbleStyle}
                >
                  {entry.prompt}
                </motion.div>
              </div>

              {/* Agent response */}
              <div className="flex flex-col gap-4">
                {/* Avatar + agent name */}
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.12 }}
                >
                  <div style={{
                    ...avatarStyle,
                    background: `${mod.accent}18`,
                    color: mod.accent,
                    border: `1px solid ${mod.accent}30`,
                    boxShadow: `0 0 8px ${mod.accent}20`,
                  }}>
                    <ModuleIconSvg id={activeModule} size={14} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                    {mod.agentName}
                  </span>
                  {entry.isRunning && (
                    <div className="flex gap-1 items-center" style={{ marginLeft: 4 }}>
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  )}
                </motion.div>

                {/* Full Launch: status rows + stream */}
                {activeModule === 'full-launch' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {FULL_LAUNCH_AGENTS.map(agent => {
                      const s = entry.agentStatuses[agent.key] ?? { status: 'pending', detail: agent.detail }
                      const agentIdMap: Record<string, 'genesis' | 'identity' | 'pipeline' | 'feasibility'> = {
                        research: 'genesis',
                        branding: 'identity',
                        landing: 'pipeline',
                        feasibility: 'feasibility'
                      }
                      return (
                        <AgentStatusRow
                          key={agent.key}
                          agentId={agentIdMap[agent.key]}
                          status={s.status === 'pending' ? 'waiting' : s.status as 'waiting' | 'running' | 'complete' | 'failed'}
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
                  <motion.div
                    style={{ marginTop: 4 }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <ResultCard
                      moduleId={activeModule}
                      result={entry.result}
                      deploymentUrl={entry.result.deploymentUrl as string}
                    />
                  </motion.div>
                )}

                {/* Error state */}
                {entry.isError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={errorBoxStyle}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e05252" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span style={{ fontSize: 13, color: '#e05252', fontWeight: 500 }}>Something went wrong.</span>
                    </div>
                    <motion.button
                      onClick={() => retryEntry(entry)}
                      style={retryBtnStyle}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      Try Again
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* ── Input area ── */}
      <motion.div
        style={inputAreaStyle}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div style={inputInnerStyle}>
          <form onSubmit={handleSubmit}>
            <motion.div
              style={{
                ...inputWrapStyle,
                borderColor: inputFocused ? mod.accent : 'var(--glass-border)',
                boxShadow: inputFocused
                  ? `var(--shadow-lg), 0 0 0 3px ${mod.accent}18`
                  : 'var(--shadow-md)',
              }}
              transition={{ duration: 0.2 }}
            >
              {/* Module picker pill */}
              <div style={{ position: 'relative' }}>
                <motion.button
                  type="button"
                  onClick={() => setPickerOpen(p => !p)}
                  style={modulePickerPillStyle(mod.accent)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span style={{ color: mod.accent, display: 'flex', alignItems: 'center' }}>
                    <ModuleIconSvg id={activeModule} size={13} />
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: mod.accent }}>{mod.label}</span>
                  <motion.svg
                    width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={mod.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    animate={{ rotate: pickerOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </motion.svg>
                </motion.button>

                {/* Dropdown */}
                <AnimatePresence>
                  {pickerOpen && (
                    <motion.div
                      style={pickerDropdownStyle}
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                      {MODULES.map(m => (
                        <motion.button
                          key={m.id}
                          type="button"
                          onClick={() => { setActiveModule(m.id as ModuleId); setPickerOpen(false) }}
                          style={{
                            ...pickerOptionStyle,
                            background: m.id === activeModule ? `${m.accent}12` : 'transparent',
                          }}
                          whileHover={{ backgroundColor: `${m.accent}10`, x: 2 }}
                        >
                          <span style={{ color: m.accent, display: 'flex', alignItems: 'center' }}>
                            <ModuleIconSvg id={m.id} size={13} />
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: m.id === activeModule ? 600 : 400 }}>{m.label}</span>
                          {m.id === activeModule && (
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: m.accent, marginLeft: 'auto' }} />
                          )}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={`Ask ${mod.label} anything about your venture…`}
                rows={1}
                style={textareaStyle}
              />

              {/* Send button */}
              <motion.button
                type="submit"
                whileHover={canSubmit ? { scale: 1.08 } : {}}
                whileTap={canSubmit ? { scale: 0.92 } : {}}
                disabled={!canSubmit}
                style={{
                  ...sendBtnStyle,
                  background: canSubmit
                    ? `linear-gradient(135deg, ${mod.accent}, ${mod.accent}cc)`
                    : 'var(--border)',
                  boxShadow: canSubmit ? `0 4px 12px ${mod.accent}40` : 'none',
                }}
              >
                {isSubmitting ? (
                  <motion.div
                    style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
                  </svg>
                )}
              </motion.button>
            </motion.div>

            <p style={hintStyle}>⌘↵ to run · Shift↵ for new line</p>
          </form>
        </div>
      </motion.div>

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
  height: 54,
  padding: '0 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid var(--border)',
  background: 'var(--glass-bg-strong)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  flexShrink: 0,
  position: 'relative',
  zIndex: 10,
}

const headerIconStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

function agentBadgeStyle(accent: string): React.CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 700,
    color: accent,
    background: `${accent}12`,
    border: `1px solid ${accent}28`,
    borderRadius: 20,
    padding: '4px 12px',
    letterSpacing: '0.02em',
    boxShadow: `0 2px 8px ${accent}18`,
  }
}

const chatInnerStyle: React.CSSProperties = {
  maxWidth: 780,
  margin: '0 auto',
  padding: '32px 24px 32px',
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
    background: `${accent}0d`,
    border: `1px solid ${accent}22`,
    borderRadius: 20,
    padding: '7px 16px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 150ms, box-shadow 150ms',
    fontWeight: 500,
  }
}

const userBubbleStyle: React.CSSProperties = {
  maxWidth: '78%',
  fontSize: 14,
  color: 'var(--text)',
  background: 'var(--glass-bg-strong)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--shadow-sm)',
  borderRadius: '20px 20px 4px 20px',
  padding: '12px 18px',
  lineHeight: 1.6,
  letterSpacing: '0.01em',
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
  justifyContent: 'space-between',
  gap: 12,
  padding: '12px 16px',
  background: 'rgba(220, 38, 38, 0.06)',
  border: '1px solid rgba(220, 38, 38, 0.18)',
  borderRadius: 12,
}

const retryBtnStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#e05252',
  background: 'transparent',
  border: '1px solid rgba(220, 38, 38, 0.25)',
  borderRadius: 8,
  padding: '5px 12px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  flexShrink: 0,
}

const inputAreaStyle: React.CSSProperties = {
  background: 'var(--glass-bg-strong)',
  backdropFilter: 'blur(28px)',
  WebkitBackdropFilter: 'blur(28px)',
  borderTop: '1px solid var(--border)',
  padding: '14px 24px 22px',
  flexShrink: 0,
  zIndex: 10,
  position: 'relative',
}

const inputInnerStyle: React.CSSProperties = {
  maxWidth: 780,
  margin: '0 auto',
}

const inputWrapStyle: React.CSSProperties = {
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid var(--glass-border)',
  borderRadius: 18,
  padding: '12px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  position: 'relative',
  transition: 'border-color 250ms ease, box-shadow 250ms ease',
}

function modulePickerPillStyle(accent: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 10px',
    borderRadius: 20,
    border: `1px solid ${accent}28`,
    background: `${accent}0d`,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 150ms',
  }
}

const pickerDropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  left: 0,
  background: 'var(--glass-bg-strong)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  border: '1px solid var(--glass-border)',
  borderRadius: 14,
  padding: 6,
  zIndex: 20,
  minWidth: 190,
  boxShadow: 'var(--shadow-xl)',
}

const pickerOptionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
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
  lineHeight: 1.55,
  padding: 0,
}

const sendBtnStyle: React.CSSProperties = {
  alignSelf: 'flex-end',
  width: 34,
  height: 34,
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'background 200ms, box-shadow 200ms',
}

const hintStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--muted)',
  fontFamily: "'JetBrains Mono', monospace",
  margin: '7px 0 0',
  textAlign: 'center',
  opacity: 0.6,
  letterSpacing: '0.01em',
}
