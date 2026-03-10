'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Venture {
  id: string
  name: string
  created_at: string
}

// ─── Module definitions ───────────────────────────────────────────────────────

const MODULES = [
  {
    id: 'full-launch',
    label: 'Full Launch',
    accent: '#C4975A',
    description: 'Run all agents together — research, brand, landing, feasibility',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
      </svg>
    ),
  },
  {
    id: 'research',
    label: 'Research',
    accent: '#5A8C6E',
    description: 'Market data, TAM/SAM/SOM, competitors, 10 ranked concepts',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    id: 'branding',
    label: 'Branding',
    accent: '#5A6E8C',
    description: 'Brand name, voice, colors, typography, full Brand Bible',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
      </svg>
    ),
  },
  {
    id: 'marketing',
    label: 'Marketing',
    accent: '#8C5A7A',
    description: '30-day GTM, 90 social posts, SEO outlines, email sequence',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l19-9-9 19-2-8-8-2z"/>
      </svg>
    ),
  },
  {
    id: 'landing',
    label: 'Landing Page',
    accent: '#8C7A5A',
    description: 'Sitemap, copy, Next.js component, live deployment',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>
      </svg>
    ),
  },
  {
    id: 'feasibility',
    label: 'Feasibility',
    accent: '#7A5A8C',
    description: 'Financial model, risk matrix, GO/NO-GO verdict',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
] as const

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()

  const [ventures, setVentures] = useState<Venture[]>([])
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/ventures')
      .then(r => r.ok ? r.json() : [])
      .then((data: Venture[]) => setVentures(data))
      .finally(() => setLoading(false))
  }, [])

  // Resolve selected venture: first venture
  const selectedId = ventures[0]?.id ?? null
  const selectedVenture = ventures.find(v => v.id === selectedId) ?? ventures[0] ?? null

  if (loading) {
    return (
      <div style={centerStyle}>
        <div style={skeletonHexStyle} />
        <div style={{ width: 180, height: 16, borderRadius: 6, background: 'var(--border)', marginTop: 24 }} />
        <div style={{ width: 240, height: 12, borderRadius: 6, background: 'var(--border)', marginTop: 10, opacity: 0.6 }} />
      </div>
    )
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!ventures.length) {
    return (
      <motion.div 
        style={centerStyle}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div 
          style={emptyHexStyle} 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.h1 
          style={emptyHeadingStyle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Your ventures live here
        </motion.h1>
        <motion.p 
          style={emptySubStyle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Create your first venture to get started
        </motion.p>
        <motion.button
          style={createBtnStyle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => {
            // Dispatch a custom event the sidebar listens to
            window.dispatchEvent(new CustomEvent('forge:new-venture'))
          }}
        >
          Create Venture
        </motion.button>
      </motion.div>
    )
  }

  // ── Venture selected, show module grid ──────────────────────────────────────
  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        {/* Hero */}
        <motion.div 
          style={heroStyle}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Dual-layer ambient glow */}
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <motion.div 
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: 160, height: 160,
                background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
                filter: 'blur(30px)',
                opacity: 0.18,
                transform: 'translate(-50%, -50%)',
                zIndex: 0,
                borderRadius: '50%',
              }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.18, 0.28, 0.18] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: 70, height: 70,
                background: 'var(--accent)',
                filter: 'blur(20px)',
                opacity: 0.3,
                transform: 'translate(-50%, -50%)',
                zIndex: 0,
                borderRadius: '50%',
              }}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
            <motion.div 
              style={{...heroHexStyle, position: 'relative', zIndex: 1}} 
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <h1 style={heroHeadingStyle}>{selectedVenture?.name ?? 'Select a venture'}</h1>
          <p style={heroSubStyle}>
            Your venture is ready for orchestration. Select a module below to activate the Genesis Engine.
          </p>
        </motion.div>

        {/* Module grid */}
        <motion.div 
          style={gridStyle}
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.08 }
            }
          }}
        >
          {MODULES.map(m => {
            const isHovered = hovered === m.id
            return (
              <motion.button
                key={m.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectedVenture && router.push(`/dashboard/venture/${selectedVenture.id}/${m.id}`)}
                onMouseEnter={() => setHovered(m.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  ...cardStyle,
                  borderColor: isHovered ? m.accent : 'var(--border)',
                  boxShadow: isHovered
                    ? 'var(--shadow-premium)'
                    : 'var(--shadow-subtle)',
                  background: isHovered 
                    ? `linear-gradient(to bottom right, var(--card), ${m.accent}0a)` 
                    : 'var(--card)',
                }}
              >
                {/* Left accent bar */}
                <div style={{
                  ...cardAccentBar,
                  background: m.accent,
                  opacity: isHovered ? 1 : 0,
                }} />

                {/* Icon */}
                <div style={{
                  ...iconWrapStyle,
                  background: isHovered ? m.accent : `${m.accent}1a`,
                  color: isHovered ? '#fff' : m.accent,
                  transition: 'background 200ms, color 200ms',
                }}>
                  {m.icon}
                </div>

                {/* Text */}
                <div style={cardTextStyle}>
                  <span style={{
                    ...cardNameStyle,
                    color: isHovered ? m.accent : 'var(--text)',
                    transition: 'color 200ms',
                  }}>
                    {m.label}
                  </span>
                  <span style={cardDescStyle}>{m.description}</span>
                </div>
              </motion.button>
            )
          })}
        </motion.div>

        {/* Footer */}
        <p style={footerStyle}>Forge Autonomous Orchestrator · v1.0.0</p>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const centerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  minHeight: '100vh',
  gap: 0,
  padding: 32,
}

const skeletonHexStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  background: 'var(--border)',
  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
  animation: 'pulse 1.5s ease-in-out infinite',
}

const emptyHexStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  background: 'var(--accent)',
  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
  marginBottom: 24,
}

const emptyHeadingStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  color: 'var(--text)',
  margin: '0 0 8px',
  letterSpacing: '-0.02em',
}

const emptySubStyle: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--muted)',
  margin: '0 0 24px',
}

const createBtnStyle: React.CSSProperties = {
  padding: '9px 20px',
  borderRadius: 8,
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontSize: 14,
  fontWeight: 500,
  fontFamily: 'inherit',
  cursor: 'pointer',
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  padding: '48px 32px',
  display: 'flex',
  justifyContent: 'center',
}

const contentStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 700,
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
}

const heroStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  marginBottom: 40,
}

const heroHexStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  background: 'var(--accent)',
  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
  marginBottom: 20,
  opacity: 0.9,
  boxShadow: '0 0 20px var(--accent-soft)',
}

const heroHeadingStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: 'var(--text)',
  margin: '0 0 10px',
  letterSpacing: '-0.025em',
}

const heroSubStyle: React.CSSProperties = {
  fontSize: 15,
  color: 'var(--muted)',
  maxWidth: 420,
  lineHeight: 1.6,
  margin: 0,
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 16,
}

const cardStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  height: 158,
  padding: 20,
  borderRadius: 16,
  border: '1px solid var(--border)',
  background: 'var(--card)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
  overflow: 'hidden',
  transition: 'border-color 250ms ease, transform 250ms ease, box-shadow 300ms ease, background 300ms ease',
}

const cardAccentBar: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: 3,
  bottom: 0,
  borderRadius: '16px 0 0 16px',
  transition: 'opacity 250ms ease',
}

const iconWrapStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 'auto',
  flexShrink: 0,
  transition: 'background 250ms ease, color 250ms ease, box-shadow 250ms ease',
}

const cardTextStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  marginTop: 14,
}

const cardNameStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: '-0.01em',
  transition: 'color 250ms ease',
}

const cardDescStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--muted)',
  lineHeight: 1.5,
}

const footerStyle: React.CSSProperties = {
  marginTop: 48,
  textAlign: 'center',
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  opacity: 0.4,
}
