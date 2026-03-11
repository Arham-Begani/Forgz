import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
    streamPrompt,
    extractJSON,
    withTimeout,
    withRetry,
} from '@/lib/gemini'

// ── PipelineOutput Zod Schema ────────────────────────────────────────────────

const PipelineOutputSchema = z.object({
    sitemap: z.array(
        z.object({
            page: z.string(),
            path: z.string(),
            purpose: z.string(),
        })
    ),
    landingPageCopy: z.object({
        hero: z.object({
            headline: z.string(),
            subheadline: z.string(),
            ctaPrimary: z.string(),
            ctaSecondary: z.string(),
        }),
        features: z.array(
            z.object({
                title: z.string(),
                description: z.string(),
                icon: z.string(),
            })
        ),
        socialProof: z.array(z.string()),
        pricing: z.array(
            z.object({
                tier: z.string(),
                price: z.string(),
                features: z.array(z.string()),
                cta: z.string(),
            })
        ),
        faq: z.array(
            z.object({
                question: z.string(),
                answer: z.string(),
            })
        ),
    }),
    fullComponent: z.string(),
    deploymentUrl: z.string(),
    leadCaptureActive: z.boolean(),
    analyticsActive: z.boolean(),
    seoMetadata: z.object({
        title: z.string(),
        description: z.string(),
        keywords: z.array(z.string()),
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

You are Forge's build and ship agent. You turn venture context into a live product.

## Context Required

Before writing any code or copy:
1. Read venture.context.research — positioning, pain points, competitor gap
2. Read venture.context.branding — brand name, voice, colors, typography
3. Read venture.context.marketing (if available) — messaging angles
4. Synthesize all available context into coherent landing page assets

## What You Build

### 1. Sitemap (5 pages)
- Home (/)
- Features (/features)
- Pricing (/pricing)
- FAQ (/faq)
- Thank You / Post-signup (/welcome)

For each page: path, purpose, primary CTA, key sections.

### 2. Landing Page Copy

**Hero Section**
- Headline: benefit-led, specific, under 10 words
- Subheadline: expands on the headline, addresses primary pain point, under 25 words
- Primary CTA: action verb + benefit (e.g. "Start Free — No Credit Card")
- Secondary CTA: lower commitment option

**Features Section (4–6 features)**
- Feature name
- One-sentence description in brand voice
- Benefit (not just what it does — why it matters)
- Icon suggestion

**Social Proof Section**
- 3 fictional but realistic testimonials in brand voice
- Company names and roles that match the target market

**Pricing Section (3 tiers)**
- Tier names that match brand personality
- Price points appropriate to the market
- 5 features per tier
- Recommended tier highlighted

**FAQ Section (6 questions)**
- Address the top objections from Genesis's research
- Answers in brand voice

### 3. Next.js Component (The Live Site)

Generate a complete, production-ready landing page as a single functional Next.js page component.
- Use the provided brand context for colors and typography.
- Use Tailwind CSS for all styling.
- Include the Hero, Features, Social Proof, Pricing, and FAQ sections.
- Ensure it is mobile-responsive and accessible.
- Include a working Lead Capture form.
- The component must be exported as default.
- Wrap it in a single large string for the "fullComponent" field.

### 4. Lead Capture Integration
- Email capture form with field validation
- Submit handler (POST to /api/waitlist or /api/signup)
- Success state with confirmation message
- Error state with retry

### 5. Analytics Hooks
- Page view tracking setup
- CTA click tracking
- Form submission tracking
- Comments showing where to add provider-specific code

### 6. Deployment
- Return the local preview URL: /v/[ventureId]
- Confirm lead capture is active
- Confirm analytics is wired

## Output Rules

- Output strict JSON matching PipelineOutputSchema from VENTURE_OBJECT.md
- Copy must use brand voice from Identity output — no generic marketing language
- Hero headline must reference the primary pain point from Genesis output
- The fullComponent field must contain the complete, valid React/Next.js code.

## Output Schema

Output your landing page package as a single JSON object matching this exact structure:

{
  "sitemap": [
    { "page": "string", "path": "string", "purpose": "string" }
  ],
  "landingPageCopy": {
    "hero": {
      "headline": "string",
      "subheadline": "string",
      "ctaPrimary": "string",
      "ctaSecondary": "string"
    },
    "features": [
      { "title": "string", "description": "string", "icon": "string" }
    ],
    "socialProof": ["string"],
    "pricing": [
      { "tier": "string", "price": "string", "features": ["string"], "cta": "string" }
    ],
    "faq": [
      { "question": "string", "answer": "string" }
    ]
  },
  "fullComponent": "string (The complete Next.js page component code)",
  "deploymentUrl": "",
  "leadCaptureActive": true,
  "analyticsActive": false,
  "seoMetadata": {
    "title": "string",
    "description": "string",
    "keywords": ["string"]
  }
}

CRITICAL OUTPUT INSTRUCTION:
After your full landing page generation, output the complete package as a single
valid JSON object matching the structure above. The JSON must be the last
thing you output. Do not include any text after the closing brace.
Output ONLY the JSON — no markdown fences, no explanation after.

IMPORTANT: Do not output any conversational text or "Thought Process" headers. Any step-by-step reasoning or thought process MUST be strictly wrapped inside <think> and </think> tags. Only the final valid JSON should be outside the <think> tags.
`

// ── Agent Runner ──────────────────────────────────────────────────────────────

export async function runPipelineAgent(
    venture: { ventureId: string; name: string; globalIdea?: string; context: Record<string, unknown> },
    onStream: (line: string) => Promise<void>,
    onComplete: (result: PipelineOutput) => Promise<void>
): Promise<void> {
    if (!venture.context.research) {
        throw new Error('Run Research first.')
    }
    if (!venture.context.branding) {
        throw new Error('Run Branding first.')
    }

    const userMessage = `Generate a complete landing page for this venture.

${venture.context?.architectPlan ? `Architect's Plan:\n${venture.context.architectPlan}\n\n` : ''}${venture.globalIdea ? `Global Startup Vision: ${venture.globalIdea}\n` : ''}Specific Venture Focus: ${venture.name}

Research findings:
${JSON.stringify(venture.context.research, null, 2)}

Brand identity:
${JSON.stringify(venture.context.branding, null, 2)}

${venture.context.marketing
            ? 'Marketing strategy:\n' + JSON.stringify(venture.context.marketing, null, 2)
            : ''}

Generate:
1. Full sitemap
2. Hero, features, pricing, FAQ copy — all in brand voice
3. Complete Next.js page component using brand colors and fonts
4. Lead capture form with email field
5. SEO metadata

The hero headline MUST reference the primary pain point from the research.
Output the full PipelineOutput JSON at the end.`

    const run = async () => {
        // Custom model config: lower temp for code gen accuracy, larger output for full page component
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.5,
                topP: 0.9,
                maxOutputTokens: 16000,
            },
        })

        let fullText = ''

        await streamPrompt(
            model,
            SYSTEM_PROMPT,
            userMessage,
            async (chunk) => {
                fullText += chunk
                await onStream(chunk)
            }
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
        Number(process.env.AGENT_TIMEOUT_MS ?? 60000)
    )
}
