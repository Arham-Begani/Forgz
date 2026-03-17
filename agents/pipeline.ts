import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
    streamPrompt,
    extractJSON,
    withTimeout,
    withRetry,
    getFlashModel,
    Content,
} from '@/lib/gemini'

// ── PipelineOutput Zod Schema ────────────────────────────────────────────────

const PipelineOutputSchema = z.object({
    sitemap: z.array(
        z.object({
            page: z.string().default('Untitled Page'),
            path: z.string().default('/'),
            purpose: z.string().default('Page purpose pending.'),
        })
    ).default([]),
    landingPageCopy: z.object({
        hero: z.object({
            headline: z.string().default('Idea to launch in minutes.'),
            subheadline: z.string().default('The fastest way to validate your next big thing.'),
            ctaPrimary: z.string().default('Get Started'),
            ctaSecondary: z.string().default('Learn More'),
        }).default({
            headline: 'Idea to launch in minutes.',
            subheadline: 'The fastest way to validate your next big thing.',
            ctaPrimary: 'Get Started',
            ctaSecondary: 'Learn More'
        }),
        features: z.array(
            z.object({
                title: z.string().default('Feature'),
                description: z.string().default('Feature description pending.'),
                icon: z.string().default('🚀'),
            })
        ).default([]),
        socialProof: z.array(z.string()).default([]),
        pricing: z.array(
            z.object({
                tier: z.string().default('Pro'),
                price: z.string().default('$0'),
                features: z.array(z.string()).default([]),
                cta: z.string().default('Start Now'),
            })
        ).default([]),
        faq: z.array(
            z.object({
                question: z.string().default('Question?'),
                answer: z.string().default('Answer pending.'),
            })
        ).default([]),
    }).default({
        hero: { headline: 'Idea to launch in minutes.', subheadline: '...', ctaPrimary: '...', ctaSecondary: '...' },
        features: [],
        socialProof: [],
        pricing: [],
        faq: []
    }),
    fullComponent: z.string().default('export default function LandingPage() { return <div>Landing Page Pending</div> }'),
    deploymentUrl: z.string().default(''),
    leadCaptureActive: z.boolean().default(false),
    analyticsActive: z.boolean().default(false),
    seoMetadata: z.object({
        title: z.string().default('Forge Startup'),
        description: z.string().default('Built with Forge AI.'),
        keywords: z.array(z.string()).default([]),
    }).default({
        title: 'Forge Startup',
        description: 'Built with Forge AI.',
        keywords: []
    }),
})

export type PipelineOutput = z.infer<typeof PipelineOutputSchema>

// ── Deployment Stub ──────────────────────────────────────────────────────────

async function deployLandingPage(ventureId: string, result: PipelineOutput): Promise<string> {
    // Return a local preview URL
    return `/v/${ventureId}`
}

// ── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
# Production Pipeline — Deployment Specialist

You are Forge's elite build-and-ship agent. You transform venture context into a stunning, fully-functional landing page that is ready to capture leads from day one.

## Context Required

Before writing any code or copy:
1. Read venture.context.research — positioning, pain points, competitor gaps, TAM, target audience
2. Read venture.context.branding — brand name, voice, tone, colors, typography, tagline, archetype
3. Read venture.context.marketing (if available) — messaging angles, GTM strategy, content pillars
4. Synthesize ALL available context into a coherent, high-conversion landing page

## What You Build

### 1. Sitemap (5 pages minimum)
For each page provide: page name, path, and a detailed purpose description (2-3 sentences explaining what the page does and why it exists).

Pages:
- Home (/) — Primary conversion page with hero, features, social proof, pricing, FAQ, and lead capture
- Features (/features) — Deep dive into product capabilities with use cases
- Pricing (/pricing) — Transparent pricing with comparison table and FAQ
- About (/about) — Team story, mission, values, and trust signals
- FAQ (/faq) — Comprehensive objection handling and support

### 2. Landing Page Copy (DETAILED — this is the core deliverable)

**Hero Section** — The most critical 5 seconds of the page
- Headline: benefit-led, specific, emotionally compelling, under 12 words. Must reference the #1 pain point from research.
- Subheadline: expands the headline, quantifies the benefit, addresses the "how", under 30 words
- Primary CTA: action verb + clear benefit + urgency (e.g. "Start Building Free — No Credit Card Required")
- Secondary CTA: lower commitment (e.g. "Watch 2-Min Demo", "See How It Works")

**Features Section (6 features minimum)**
Each feature must include:
- Title: concise, benefit-oriented name
- Description: 2-3 sentences in brand voice explaining what it does AND why it matters to the target user. Include specific benefits, not vague claims.
- Icon: a descriptive emoji or icon name that visually represents the feature

**Social Proof Section (3 detailed testimonials)**
Each testimonial must be:
- 2-3 sentences long, specific about the result achieved
- Include a fictional but realistic person name, job title, and company name that matches the target market
- Reference specific metrics or outcomes (e.g. "reduced onboarding time by 60%")
Format as: "Quote text" — Name, Title at Company

**Pricing Section (3 tiers with full detail)**
Each tier must include:
- Tier name that matches brand personality
- Price (monthly) appropriate to the market research findings
- 5-7 specific features per tier (not vague — "10GB storage" not "Storage")
- CTA text specific to that tier
- Mark the recommended tier

**FAQ Section (6-8 questions)**
- Address the top objections and concerns identified in research
- Each answer should be 2-4 sentences, written in brand voice
- Include questions about: pricing, getting started, data/security, integrations, support, and competitive advantage

### 3. Full React Component (THE LIVE SITE)

Generate a COMPLETE, production-quality landing page as a single React functional component. This is rendered live — it must be beautiful and fully working.

**Technical Requirements:**
- Single functional component exported as default
- Use Tailwind CSS for ALL styling (the page loads Tailwind CDN)
- Use React hooks (useState, useEffect) for interactivity — these are available globally
- Do NOT use import statements (they will be stripped for preview rendering)
- Mobile-responsive design with proper breakpoints (sm:, md:, lg:)
- Smooth scroll navigation between sections
- Accessible (proper heading hierarchy, aria-labels on interactive elements, contrast ratios)

**Design Requirements:**
- Use the EXACT brand colors from the Identity output (primary, secondary, accent)
- Use the brand typography feel (if the brand is modern, use clean sans-serif; if premium, use serif accents)
- Include a sticky navigation bar with logo text and section links
- Hero section with gradient background using brand colors, animated elements
- Features grid with icon cards, hover effects, and staggered layout
- Social proof section with testimonial cards
- Pricing table with highlighted recommended tier
- FAQ section with expandable accordion items (use useState)
- Footer with links, social icons, and copyright
- Lead capture form in the hero AND as a standalone section before footer
- Subtle animations: fade-in on scroll effects using IntersectionObserver
- Professional spacing, consistent border-radius, shadow hierarchy

**Lead Capture Form:**
- Email input with field validation (basic regex)
- Submit button with loading state
- Success state with checkmark animation and confirmation message
- Form submits to "#" with preventDefault (demo mode)
- Store submissions in component state with success feedback

**The fullComponent string must be the COMPLETE component code, starting with "function LandingPage()" or "const LandingPage = () =>" and ending with the closing brace. Include ALL sections: nav, hero, features, social proof, pricing, FAQ, CTA, and footer.**

### 4. Tech Stack & Infrastructure Detail
The landing page is built with:
- Framework: Next.js 15 (App Router)
- Styling: Tailwind CSS
- Language: TypeScript / React
- Hosting: Vercel (Edge)
- Analytics: Ready for Google Analytics / Mixpanel integration
- Forms: Client-side validation + API-ready POST handler
- SEO: Full meta tags, Open Graph ready

### 5. SEO Metadata
- Title: brand name + primary value prop (under 60 chars)
- Description: compelling meta description with keywords (under 160 chars)
- Keywords: 8-12 relevant keywords based on research findings

## Output Rules

- Output strict JSON matching PipelineOutputSchema
- ALL copy must use brand voice from Identity output — NO generic marketing language
- Hero headline MUST reference the primary pain point from research
- Features MUST align with the competitive advantages identified in research
- Pricing MUST be appropriate for the target market identified in research
- The fullComponent MUST be a complete, self-contained, working React component
- Social proof names/companies must feel authentic to the target industry

## Output Schema

{
  "sitemap": [
    { "page": "string", "path": "string", "purpose": "string (2-3 detailed sentences)" }
  ],
  "landingPageCopy": {
    "hero": {
      "headline": "string",
      "subheadline": "string",
      "ctaPrimary": "string",
      "ctaSecondary": "string"
    },
    "features": [
      { "title": "string", "description": "string (2-3 sentences)", "icon": "string" }
    ],
    "socialProof": ["string (full testimonial with attribution)"],
    "pricing": [
      { "tier": "string", "price": "string", "features": ["string"], "cta": "string" }
    ],
    "faq": [
      { "question": "string", "answer": "string (2-4 sentences)" }
    ]
  },
  "fullComponent": "string (COMPLETE React component code — 200+ lines minimum, all sections included)",
  "deploymentUrl": "",
  "leadCaptureActive": true,
  "analyticsActive": false,
  "seoMetadata": {
    "title": "string (under 60 chars)",
    "description": "string (under 160 chars)",
    "keywords": ["string (8-12 keywords)"]
  }
}

CRITICAL OUTPUT INSTRUCTION:
After your planning, output the complete package as a single valid JSON object.
The JSON must be the LAST thing you output. No text after the closing brace.
Output ONLY the JSON — no markdown fences, no explanation after.

IMPORTANT: Any step-by-step reasoning MUST be wrapped inside <think> and </think> tags. Only the final valid JSON should be outside the tags.
`

// ── Agent Runner ──────────────────────────────────────────────────────────────

export async function runPipelineAgent(
    venture: { ventureId: string; name: string; globalIdea?: string; context: Record<string, unknown> },
    onStream: (line: string) => Promise<void>,
    onComplete: (result: PipelineOutput) => Promise<void>,
    history: Content[] = []
): Promise<void> {
    const hasResearch = !!venture.context.research
    const hasBranding = !!venture.context.branding

    const contextParts: string[] = []
    if (venture.context?.architectPlan) contextParts.push(`## Architect's Plan\n${venture.context.architectPlan}`)
    if (venture.globalIdea) contextParts.push(`## Global Startup Vision\n${venture.globalIdea}`)
    if (hasResearch) contextParts.push(`## Research Findings (use these for positioning, pain points, pricing, and FAQ)\n${JSON.stringify(venture.context.research, null, 2)}`)
    if (hasBranding) contextParts.push(`## Brand Identity (use these EXACT colors, voice, and tone in all copy and design)\n${JSON.stringify(venture.context.branding, null, 2)}`)
    if (venture.context.marketing) contextParts.push(`## Marketing Strategy (use these messaging angles)\n${JSON.stringify(venture.context.marketing, null, 2)}`)

    const isContinuation = history.length > 0
    const userMessage = isContinuation
        ? "Continue from where you left off. Do not repeat anything already outputted. Complete the PipelineOutput JSON object strictly. The fullComponent MUST be completed fully."
        : `Generate a COMPLETE, production-quality landing page for this venture. This will be rendered as a live website — make it stunning.

${contextParts.join('\n\n')}

## Venture Focus
${venture.name}

${!hasResearch && !hasBranding ? '## Note\nNo prior research or branding data is available. Use your best judgment to create a compelling, modern landing page based on the venture concept. Choose appropriate colors, voice, and positioning.\n' : ''}

## Your Deliverables

1. **Sitemap** — 5 pages with detailed purpose descriptions
2. **Landing Page Copy** — Hero (headline referencing #1 pain point), 6+ features with 2-3 sentence descriptions, 3 detailed testimonials with names/titles/companies, 3 pricing tiers with 5-7 features each, 6-8 FAQ entries with full answers
3. **Full React Component** — A COMPLETE, beautiful, working React component (200+ lines) with:
   - Sticky navbar with smooth scroll links
   - Gradient hero section using brand colors
   - Feature cards with hover effects
   - Testimonial carousel or grid
   - Pricing comparison table with highlighted recommended tier
   - FAQ accordion with useState toggle
   - Lead capture form (email input, validation, success state)
   - Professional footer
   - Mobile responsive (Tailwind breakpoints)
   - Scroll animations using IntersectionObserver
   - Use ONLY Tailwind CSS classes, React hooks (useState, useEffect, useRef) — no imports
4. **SEO Metadata** — Title (under 60 chars), description (under 160 chars), 8-12 keywords

CRITICAL: The fullComponent must be a COMPLETE working React component. Start with "function LandingPage()" and include ALL sections. This renders as a real live page.

Output the complete PipelineOutput JSON.`

    const run = async () => {
        // Custom model config: lower temp for code gen accuracy, larger output for full page component
        const model = getFlashModel()
        let fullText = (history.find(h => h.role === 'model')?.parts[0] as any)?.text || ''

        await streamPrompt(
            model,
            SYSTEM_PROMPT,
            userMessage,
            async (chunk) => {
                fullText += chunk
                await onStream(chunk)
            },
            history
        )

        const raw = extractJSON(fullText) as PipelineOutput
        const validated = PipelineOutputSchema.parse(raw)

        // Post-process: wire deployment and flags
        validated.deploymentUrl = await deployLandingPage(venture.ventureId, validated)
        validated.leadCaptureActive = true
        validated.analyticsActive = false // wire later

        await onComplete(validated)
    }

    await withTimeout(
        withRetry(run),
        Number(process.env.PIPELINE_TIMEOUT_MS ?? process.env.AGENT_TIMEOUT_MS ?? 120000)
    )
}
