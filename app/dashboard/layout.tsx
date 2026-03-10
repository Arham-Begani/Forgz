'use client'

import { useEffect, useState, useRef, type ReactNode, type KeyboardEvent } from 'react'
import { usePathname, useRouter } from 'next/navigation'

// ─── Types ──────────────────────────────────────────────────────────────────────

interface SessionData {
  userId: string
  email: string
  name: string
  plan: string
}

interface VentureItem {
  id: string
  name: string
  created_at: string
}

const MODULES = [
  { id: 'full-launch',  label: 'Full Launch',  icon: '\u2B21', accent: '#C4975A' },
  { id: 'research',     label: 'Research',     icon: '\u25CE', accent: '#5A8C6E' },
  { id: 'branding',     label: 'Branding',     icon: '\u25C7', accent: '#5A6E8C' },
  { id: 'marketing',    label: 'Marketing',    icon: '\u25B2', accent: '#8C5A7A' },
  { id: 'landing',      label: 'Landing Page', icon: '\u25A3', accent: '#8C7A5A' },
  { id: 'feasibility',  label: 'Feasibility',  icon: '\u25C8', accent: '#7A5A8C' },
] as const

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// ─── Layout ─────────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  // Session
  const [session, setSession] = useState<SessionData | null>(null)

  // Ventures
  const [ventures, setVentures] = useState<VentureItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // New venture inline input
  const [showNewInput, setShowNewInput] = useState(false)
  const [newName, setNewName] = useState('')
  const newInputRef = useRef<HTMLInputElement>(null)

  // Dark mode
  const [dark, setDark] = useState(false)

  // ── Init dark mode from localStorage ──────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('forge-dark-mode')
    if (stored === 'true') {
      setDark(true)
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  function toggleDark() {
    const next = !dark
    setDark(next)
    localStorage.setItem('forge-dark-mode', String(next))
    if (next) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // ── Fetch session + ventures ──────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [sessRes, ventRes] = await Promise.all([
          fetch('/api/auth/session'),
          fetch('/api/ventures'),
        ])
        if (sessRes.ok) {
          const s = await sessRes.json()
          setSession(s)
        }
        if (ventRes.ok) {
          const v = await ventRes.json()
          setVentures(v)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── New venture ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (showNewInput && newInputRef.current) {
      newInputRef.current.focus()
    }
  }, [showNewInput])

  async function submitNewVenture() {
    const trimmed = newName.trim()
    if (!trimmed) {
      setShowNewInput(false)
      setNewName('')
      return
    }
    try {
      const res = await fetch('/api/ventures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (res.ok) {
        const venture: VentureItem = await res.json()
        setVentures(prev => [venture, ...prev])
        setExpanded(prev => new Set(prev).add(venture.id))
      }
    } finally {
      setShowNewInput(false)
      setNewName('')
    }
  }

  function handleNewKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submitNewVenture()
    } else if (e.key === 'Escape') {
      setShowNewInput(false)
      setNewName('')
    }
  }

  // ── Toggle expand ─────────────────────────────────────────────────────────
  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Active module check ───────────────────────────────────────────────────
  function isModuleActive(ventureId: string, moduleId: string): boolean {
    return pathname === `/dashboard/venture/${ventureId}/${moduleId}`
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        {/* Header: Logo + Dark toggle */}
        <div style={headerStyle}>
          <div className="flex items-center gap-2">
            {/* Hexagon via clip-path */}
            <div style={hexStyle} />
            <span style={wordmarkStyle}>Forge</span>
          </div>
          <button onClick={toggleDark} style={toggleBtnStyle} aria-label="Toggle dark mode">
            {dark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '16px 12px' }}>
          {/* New Venture button / input */}
          {showNewInput ? (
            <input
              ref={newInputRef}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={handleNewKeyDown}
              onBlur={() => submitNewVenture()}
              placeholder="Venture name..."
              style={newInputStyle}
            />
          ) : (
            <button onClick={() => setShowNewInput(true)} style={newBtnStyle}>
              <span style={{ fontSize: 15, lineHeight: 1 }}>+</span>
              <span>New Venture</span>
            </button>
          )}

          {/* VENTURES label */}
          <p style={sectionLabelStyle}>VENTURES</p>

          {/* Skeleton loading */}
          {loading && (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} style={skeletonRowStyle}>
                  <div style={{ ...skeletonBarStyle, width: i === 1 ? '60%' : '75%' }} />
                </div>
              ))}
            </div>
          )}

          {/* Ventures list */}
          {!loading && (
            <div className="flex flex-col gap-0.5">
              {ventures.map(v => {
                const isOpen = expanded.has(v.id)
                return (
                  <div key={v.id} className="flex flex-col">
                    {/* Venture row */}
                    <button
                      onClick={() => toggleExpand(v.id)}
                      style={{
                        ...ventureRowStyle,
                        opacity: isOpen ? 1 : 0.7,
                      }}
                    >
                      {/* Chevron */}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--muted)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 200ms ease',
                          flexShrink: 0,
                        }}
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <span style={ventureNameStyle}>{v.name}</span>
                      <span style={ventureDateStyle}>{formatDate(v.created_at)}</span>
                    </button>

                    {/* Module sub-rows */}
                    {isOpen && (
                      <div style={moduleContainerStyle}>
                        {MODULES.map(m => {
                          const active = isModuleActive(v.id, m.id)
                          return (
                            <button
                              key={m.id}
                              onClick={() => router.push(`/dashboard/venture/${v.id}/${m.id}`)}
                              style={{
                                ...moduleRowStyle,
                                background: active ? 'var(--nav-active)' : 'transparent',
                                borderLeft: active ? `3px solid ${m.accent}` : '3px solid transparent',
                              }}
                            >
                              <span style={{ color: m.accent, fontSize: 14, lineHeight: 1, width: 16, textAlign: 'center' }}>
                                {m.icon}
                              </span>
                              <span style={moduleLabelStyle}>{m.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer: User info */}
        <div style={footerStyle}>
          <div className="flex items-center gap-3" style={{ padding: '8px' }}>
            {/* Avatar circle with initials */}
            <div style={avatarStyle}>
              {session ? getInitials(session.name || session.email) : '??'}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span style={userNameStyle}>{session?.name || session?.email || '...'}</span>
              <span style={planBadgeStyle}>
                {session?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
              </span>
            </div>
            {/* Settings gear */}
            <button
              onClick={() => router.push('/dashboard/settings')}
              aria-label="Settings"
              style={gearBtnStyle}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const sidebarStyle: React.CSSProperties = {
  width: 252,
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--sidebar)',
  borderRight: '1px solid var(--border)',
  flexShrink: 0,
}

const headerStyle: React.CSSProperties = {
  height: 56,
  padding: '0 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid var(--border)',
  flexShrink: 0,
}

const hexStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  background: 'var(--accent)',
  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
  flexShrink: 0,
}

const wordmarkStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--text)',
  letterSpacing: '-0.02em',
}

const toggleBtnStyle: React.CSSProperties = {
  padding: 6,
  borderRadius: 6,
  border: 'none',
  background: 'transparent',
  color: 'var(--muted)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
}

const newBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  width: '100%',
  height: 32,
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  fontSize: 12,
  fontWeight: 500,
  fontFamily: 'inherit',
  cursor: 'pointer',
  marginBottom: 0,
}

const newInputStyle: React.CSSProperties = {
  width: '100%',
  height: 32,
  borderRadius: 8,
  border: '1px solid var(--accent)',
  background: 'var(--input-bg)',
  color: 'var(--text)',
  fontSize: 12,
  fontFamily: 'inherit',
  padding: '0 10px',
  outline: 'none',
}

const sectionLabelStyle: React.CSSProperties = {
  padding: '16px 8px 6px',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: 'var(--muted)',
  opacity: 0.6,
}

const skeletonRowStyle: React.CSSProperties = {
  height: 28,
  padding: '0 8px',
  display: 'flex',
  alignItems: 'center',
}

const skeletonBarStyle: React.CSSProperties = {
  height: 10,
  borderRadius: 4,
  background: 'var(--border)',
  animation: 'pulse 1.5s ease-in-out infinite',
}

const ventureRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 8px',
  borderRadius: 6,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  width: '100%',
  textAlign: 'left',
  fontFamily: 'inherit',
  transition: 'opacity 150ms ease',
}

const ventureNameStyle: React.CSSProperties = {
  flex: 1,
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--text)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const ventureDateStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--muted)',
  flexShrink: 0,
}

const moduleContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  marginLeft: 18,
  marginTop: 2,
  paddingLeft: 10,
  borderLeft: '1px solid var(--border)',
}

const moduleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '5px 8px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  width: '100%',
  textAlign: 'left',
  fontFamily: 'inherit',
  transition: 'background 150ms ease',
}

const moduleLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--text-soft)',
}

const footerStyle: React.CSSProperties = {
  padding: 12,
  borderTop: '1px solid var(--border)',
  flexShrink: 0,
}

const avatarStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: 'var(--accent-soft)',
  color: 'var(--accent)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 11,
  fontWeight: 700,
  flexShrink: 0,
  border: '1px solid var(--border)',
}

const userNameStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const planBadgeStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  color: 'var(--accent)',
}

const gearBtnStyle: React.CSSProperties = {
  padding: 4,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
}
