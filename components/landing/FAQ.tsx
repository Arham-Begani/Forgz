'use client'

import { useEffect, useRef, useState } from 'react'

const FAQS = [
  {
    q: 'How is Forze different from ChatGPT?',
    a: 'ChatGPT is a single generalist model. Forze is a coordinated swarm of 9 specialized agents that share context with each other. Your branding agent knows what the research agent found. Your landing page uses the brand voice the identity agent defined. ChatGPT gives you fragments. Forze gives you a coherent venture package.',
  },
  {
    q: 'Do I need technical skills to use Forze?',
    a: 'None. You describe your idea in plain English. Forze handles everything else — market research, brand naming, landing page generation, financial modeling. If you can send an email, you can use Forze.',
  },
  {
    q: 'How long does a Full Launch actually take?',
    a: 'Typically 3–7 minutes depending on the complexity of your idea and current model latency. Research, branding, landing page generation, and feasibility analysis all run in parallel as a coordinated agent team.',
  },
  {
    q: 'Can I edit the outputs?',
    a: 'Yes. Every agent supports edit mode — describe what you want changed, and only the relevant fields are regenerated. A headline tweak uses ~200 tokens instead of regenerating the entire landing page. Your data is preserved between runs.',
  },
  {
    q: 'What does the Shadow Board actually do?',
    a: 'Three AI personas — a Silicon Skeptic, UX Evangelist, and Growth Alchemist — simulate a high-stakes board review of your venture. They\'ll question your CAC assumptions, flag onboarding risks, and challenge your moat. You get a Venture Survival Score (0–100), 3 strategic pivot recommendations, and 5 synthetic user interviews.',
  },
  {
    q: 'How accurate is the feasibility analysis?',
    a: 'The Genesis Engine pulls real-time market data, competitor information, and industry benchmarks. The Feasibility agent uses extended thinking to stress-test financial assumptions across 12 risk vectors. Results are directionally accurate — treat them as informed analysis, not audited accounts.',
  },
  {
    q: 'What are credits and how do they work?',
    a: 'Credits are consumed per agent run. Simple agents like Co-pilot cost 1 credit. Complex agents like Full Launch cost 30 credits. Your plan includes a monthly credit allowance. Credits roll over within your billing cycle, and top-ups are available if you need more.',
  },
  {
    q: 'What happens to my venture data?',
    a: 'Your data is stored securely in your account and never shared with other users or used to train models. You own your outputs. Delete your account at any time to remove all data.',
  },
]

export function FAQ() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={sectionRef} style={{
      padding: 'clamp(64px, 8vw, 112px) 24px',
      maxWidth: '760px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '56px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}>
        <p style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--accent)', textTransform: 'uppercase', margin: '0 0 12px' }}>
          FAQ
        </p>
        <h2 style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Questions answered
        </h2>
      </div>

      {/* Accordion */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {FAQS.map((faq, i) => {
          const isOpen = openIdx === i
          return (
            <div
              key={i}
              style={{
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                background: isOpen ? 'var(--glass-bg)' : 'transparent',
                backdropFilter: isOpen ? 'blur(var(--glass-blur))' : 'none',
                WebkitBackdropFilter: isOpen ? 'blur(var(--glass-blur))' : 'none',
                overflow: 'hidden',
                transition: 'background var(--transition-smooth), border-color var(--transition-smooth), transform var(--transition-fast), box-shadow var(--transition-fast)',
                borderColor: isOpen ? 'hsla(28,62%,42%,0.25)' : 'var(--border)',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                transitionDelay: visible ? `${i * 0.05}s` : '0s',
                boxShadow: isOpen ? '0 8px 24px -4px hsla(28,62%,42%,0.12)' : 'none',
              }}
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                style={{
                  width: '100%',
                  padding: '18px 20px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  textAlign: 'left',
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: isOpen ? 'var(--accent)' : 'var(--text)',
                  transition: 'color var(--transition-fast)',
                  lineHeight: 1.4,
                }}>
                  {faq.q}
                </span>
                <span style={{
                  fontSize: '18px',
                  color: isOpen ? 'var(--accent)' : 'var(--muted)',
                  flexShrink: 0,
                  transition: 'transform var(--transition-smooth), color var(--transition-fast)',
                  transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                  display: 'inline-block',
                  lineHeight: 1,
                }}>
                  +
                </span>
              </button>

              {isOpen && (
                <div style={{
                  padding: '0 20px 20px',
                  animation: 'slide-down 0.25s ease both',
                }}>
                  <p style={{
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    fontSize: '14px',
                    color: 'var(--text-soft)',
                    margin: 0,
                    lineHeight: 1.7,
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border)',
                  }}>
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
