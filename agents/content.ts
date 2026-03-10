// WARNING: This agent is NEVER called from the Full Launch orchestrator.
// It only runs when the user explicitly selects the Marketing module.

import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
    streamPrompt,
    extractJSON,
    withTimeout,
    withRetry,
} from '@/lib/gemini'

// ── ContentOutput Zod Schema ─────────────────────────────────────────────────

const ContentOutputSchema = z.object({
    gtmStrategy: z.object({
        overview: z.string(),
        weeks: z.array(
            z.object({
                week: z.number(),
                theme: z.string(),
                actions: z.array(z.string()),
                kpis: z.array(z.string()),
            })
        ),
    }),
    socialCalendar: z.array(
        z.object({
            day: z.number(),
            platform: z.enum(['x', 'linkedin', 'instagram']),
            caption: z.string(),
            hashtags: z.array(z.string()),
            postType: z.string(),
        })
    ),
    seoOutlines: z.array(
        z.object({
            title: z.string(),
            targetKeyword: z.string(),
            searchIntent: z.string(),
            outline: z.array(z.string()),
            estimatedTraffic: z.string(),
        })
    ),
    emailSequence: z.array(
        z.object({
            day: z.number(),
            subject: z.string(),
            preview: z.string(),
            bodyOutline: z.array(z.string()),
        })
    ),
    hashtagStrategy: z.object({
        x: z.array(z.string()),
        linkedin: z.array(z.string()),
        instagram: z.array(z.string()),
    }),
})

export type ContentOutput = z.infer<typeof ContentOutputSchema>

// ── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
# Content Factory — Marketing Specialist

You are Forge's marketing agent. You build go-to-market systems that compound.

## Critical Rule

**You are NEVER part of Full Launch. You always run as a standalone Marketing module.**

## Context Required

Before writing a single word:
1. Read venture.context.research (Genesis output) — this is your strategic foundation
2. Read venture.context.branding (Identity output) — this defines your voice
3. Every piece of content must use the brand voice Identity Architect defined
4. Every strategic insight must be grounded in Genesis's market data
5. If either context is missing, ask the user to run Research and Branding first

## What You Build

### 1. 30-Day GTM Strategy
Week-by-week breakdown with:
- Weekly theme and strategic focus
- 3–5 specific actions per week
- KPIs to track per week
- Channel priorities per phase

Week 1: Awareness (launch day)
Week 2: Engagement (community building)
Week 3: Conversion (first customers)
Week 4: Retention (early user success)

### 2. Social Media Calendar (90 posts)
30 posts per platform: X (Twitter), LinkedIn, Instagram

For each post:
- Day number (1–30)
- Platform
- Post type (Educational, Launch, Social proof, Behind-the-scenes, Question, CTA)
- Caption in brand voice — specific, not generic
- Hashtags (platform-appropriate, researched)

Post types should vary — no two consecutive posts of the same type.
Captions must reference real pain points from Genesis research.

### 3. SEO Blog Outlines (5 articles)
Each outline targets a keyword the user's audience actually searches for.
Structure:
- Target keyword + search volume estimate
- Search intent (informational/commercial/navigational)
- H1 title
- Meta description
- Section-by-section outline (H2s and H3s)
- Internal link opportunities
- Estimated time to rank

Target keywords that the venture can realistically rank for from Day 1 — not "best CRM software".

### 4. Launch Email Sequence (7 emails)
Day 0 through Day 14:
- Subject line
- Preview text
- Body outline (3–5 bullet points)
- Primary CTA

### 5. Hashtag Strategy
Platform-specific sets:
- X: 2–4 hashtags per post (trending + niche)
- LinkedIn: 3–5 hashtags (professional + industry)
- Instagram: 10–15 hashtags (broad + niche + brand)

## Output Rules

- Output strict JSON matching ContentOutputSchema from VENTURE_OBJECT.md
- Validate output structure before returning
- No generic content — every caption must be specific to this venture
- Brand voice must be consistent across all 90 posts
- Pain points from Genesis must appear naturally in marketing copy

## Output Schema

Output your full marketing package as a single JSON object matching this exact structure:

{
  "gtmStrategy": {
    "overview": "string",
    "weeks": [
      { "week": 1, "theme": "string", "actions": ["string"], "kpis": ["string"] }
    ]
  },
  "socialCalendar": [
    { "day": 1, "platform": "x|linkedin|instagram", "caption": "string", "hashtags": ["string"], "postType": "string" }
  ],
  "seoOutlines": [
    { "title": "string", "targetKeyword": "string", "searchIntent": "string", "outline": ["string"], "estimatedTraffic": "string" }
  ],
  "emailSequence": [
    { "day": 0, "subject": "string", "preview": "string", "bodyOutline": ["string"] }
  ],
  "hashtagStrategy": {
    "x": ["string"],
    "linkedin": ["string"],
    "instagram": ["string"]
  }
}

CRITICAL OUTPUT INSTRUCTION:
After your full marketing analysis, output the complete marketing package as a single
valid JSON object matching the structure above. The JSON must be the last
thing you output. Do not include any text after the closing brace.
Output ONLY the JSON — no markdown fences, no explanation after.
`

// ── Agent Runner ──────────────────────────────────────────────────────────────

export async function runContentAgent(
    venture: { ventureId: string; name: string; context: Record<string, unknown> },
    onStream: (line: string) => Promise<void>,
    onComplete: (result: ContentOutput) => Promise<void>
): Promise<void> {
    if (!venture.context.research) {
        throw new Error('Run Research first.')
    }
    if (!venture.context.branding) {
        throw new Error('Run Branding first.')
    }

    const userMessage = `Build a complete marketing package for this venture.

Venture: ${venture.name}

Market research:
${JSON.stringify(venture.context.research, null, 2)}

Brand identity:
${JSON.stringify(venture.context.branding, null, 2)}

All content must use the brand voice from the identity document.
Social captions must reference real pain points from the research.
Output the full ContentOutput JSON at the end.`

    const run = async () => {
        // Custom model config: higher temperature for creative copy, larger output for 90 posts
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
        const model = genAI.getGenerativeModel({
            model: 'gemini-3-flash-preview',
            generationConfig: {
                temperature: 0.8,
                topP: 0.95,
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

        const raw = extractJSON(fullText)
        const validated = ContentOutputSchema.parse(raw)
        await onComplete(validated)
    }

    await withTimeout(
        withRetry(run),
        Number(process.env.AGENT_TIMEOUT_MS ?? 60000)
    )
}
