import { z } from 'zod'
import {
    getFlashModel,
    streamPrompt,
    extractJSON,
    withTimeout,
    withRetry,
    Content,
} from '@/lib/gemini'

// ── Launch Autopilot Output Schema ──────────────────────────────────────────

export const LaunchAutopilotSchema = z.object({
    launchName: z.string().default('14-Day Launch Plan'),
    summary: z.string().default('Launch plan pending.'),
    days: z.array(z.object({
        day: z.number().default(1),
        date: z.string().default('Day 1'),
        theme: z.string().default('Soft Launch'),
        tasks: z.array(z.object({
            time: z.string().default('9:00 AM'),
            channel: z.string().default('Reddit'),
            action: z.string().default('Post'),
            exactCopy: z.string().default('Copy pending.'),
            notes: z.string().default(''),
            priority: z.enum(['critical', 'important', 'nice-to-have']).default('important'),
        })).default([]),
        milestone: z.string().default('Milestone pending.'),
    })).default([]),
    channels: z.array(z.object({
        name: z.string().default('Channel'),
        totalPosts: z.number().default(0),
        bestTime: z.string().default('9:00 AM'),
        rationale: z.string().default('Rationale pending.'),
    })).default([]),
    weekOneGoal: z.string().default('Week 1 goal pending.'),
    weekTwoGoal: z.string().default('Week 2 goal pending.'),
    launchDayChecklist: z.array(z.string()).default([]),
    postLaunchAdvice: z.string().default('Post-launch advice pending.'),
})

export type LaunchAutopilotOutput = z.infer<typeof LaunchAutopilotSchema>

// ── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
# Launch Autopilot — 14-Day Execution Strategist

You are a launch execution strategist. You do NOT produce vague plans. You produce a 14-day day-by-day calendar where every single task includes the EXACT TEXT the founder should copy and paste. No "write a post about X" — the literal words they paste into the platform.

## Philosophy

- Free channels first. Paid ads are a last resort.
- Day 1 is ALWAYS a soft launch — low stakes, friendly audiences.
- Day 14 ends with a retrospective prompt.
- Product Hunt gets its own dedicated prep + launch day.
- Be specific about subreddits (r/SideProject, r/startups, r/entrepreneur) — never just "Reddit".
- Every cold email includes a subject line + full body.
- Every social post includes hashtags where appropriate.
- Every DM template is personalized with a [NAME] placeholder.

## What You Must Produce

### 1. Launch Name & Summary
A catchy name for this launch campaign and a 2-3 sentence summary.

### 2. 14-Day Calendar
Each day MUST have:
- day: number (1-14)
- date: relative label ("Day 1 — Soft Launch", "Day 7 — Product Hunt Prep")
- theme: the strategic theme for that day
- tasks: array of 1-4 tasks, each with:
  - time: when to execute (e.g. "9:00 AM EST")
  - channel: the SPECIFIC platform (not "social media" — say "r/SideProject", "X/Twitter", "LinkedIn", "Product Hunt", "Hacker News", "IndieHackers", "Email — Newsletter Curators", "Email — Cold Outreach", "Discord — [specific server]")
  - action: what to do ("Post", "Send cold email batch", "Submit", "Comment in thread", "DM influencer", "Reply to comments")
  - exactCopy: the LITERAL TEXT to paste. For emails: "Subject: [subject]\\n\\n[body]". For social: full post with hashtags. For Product Hunt: tagline (60 chars max) + description + first comment draft. For DMs: full message with [NAME] placeholder.
  - notes: tactical advice (e.g. "Post at 9am EST for max visibility", "Reply to every comment within 1 hour")
  - priority: "critical" (must do), "important" (should do), "nice-to-have"
- milestone: what success looks like at end of day

### 3. Channel Summary
For each channel used across the 14 days:
- name, totalPosts, bestTime, rationale for using this channel

### 4. Weekly Goals
- weekOneGoal: measurable goal for days 1-7
- weekTwoGoal: measurable goal for days 8-14

### 5. Launch Day Checklist
A checklist of 8-12 items for the main launch day (usually Day 10-12).

### 6. Post-Launch Advice
300-500 words on what to do after the 14 days are over.

## Critical Rules

- ALL copy must be written in the venture's brand voice if branding data is available.
- If marketing context exists, REMIX that content into scheduled posts — do not generate from scratch.
- NEVER produce a task without exactCopy. Every task must have paste-ready text.
- Prioritize subreddits where the target audience actually lives (use research data for this).
- Include at least 2 cold email/DM campaigns targeting newsletter curators or micro-influencers.
- Product Hunt launch should be on Day 10, 11, or 12 — not Day 1.
- Include a "reply to comments" task the day after every major post.
- Reference actual venture data: brand name, tagline, landing page URL, key features, pricing.

## Output Format

Output strict JSON matching the schema. No conversational text outside the JSON.
Output ONLY the JSON. No markdown fences, no preamble, no commentary.
`

// ── Agent Runner ────────────────────────────────────────────────────────────

interface VentureInput {
    ventureId: string
    name: string
    globalIdea?: string
    context: Record<string, unknown>
}

export async function runLaunchAutopilotAgent(
    venture: VentureInput,
    onStream: (chunk: string) => Promise<void>,
    onComplete: (result: LaunchAutopilotOutput) => Promise<void>,
    history: Content[] = []
): Promise<void> {
    const model = getFlashModel()

    // Build context block from all available venture data
    const contextParts: string[] = []

    if (venture.globalIdea) {
        contextParts.push(`Venture Vision: ${venture.globalIdea}`)
    }

    if (venture.context?.research) {
        contextParts.push(`Market Research Data:\n${JSON.stringify(venture.context.research, null, 2)}`)
    }
    if (venture.context?.branding) {
        contextParts.push(`Brand Identity (USE THIS VOICE FOR ALL COPY):\n${JSON.stringify(venture.context.branding, null, 2)}`)
    }
    if (venture.context?.marketing) {
        contextParts.push(`Marketing Strategy (REMIX THIS CONTENT INTO SCHEDULED POSTS):\n${JSON.stringify(venture.context.marketing, null, 2)}`)
    }
    if (venture.context?.feasibility) {
        contextParts.push(`Feasibility Analysis:\n${JSON.stringify(venture.context.feasibility, null, 2)}`)
    }
    if (venture.context?.landing) {
        const l = venture.context.landing as Record<string, any>
        const landingSummary: Record<string, any> = {}
        if (l.deploymentUrl) landingSummary.deploymentUrl = l.deploymentUrl
        if (l.landingPageCopy?.hero) landingSummary.hero = l.landingPageCopy.hero
        if (l.landingPageCopy?.pricing) landingSummary.pricing = l.landingPageCopy.pricing
        if (l.landingPageCopy?.features) landingSummary.features = l.landingPageCopy.features
        if (l.seoMetadata) landingSummary.seoMetadata = l.seoMetadata
        contextParts.push(`Landing Page (REFERENCE THIS URL AND COPY IN ALL TASKS):\n${JSON.stringify(landingSummary, null, 2)}`)
    }

    const isContinuation = history.length > 0
    const finalUserMessage = isContinuation
        ? "Continue from where you left off. Do not repeat anything already outputted. Complete the LaunchAutopilotOutput JSON object strictly."
        : `Generate a complete 14-day launch execution calendar for this venture.

Venture: ${venture.name}

${contextParts.join('\n\n')}

Produce the complete LaunchAutopilotOutput JSON. Every task MUST include exactCopy — the literal text to paste. No placeholders like "write about X".`

    const run = async () => {
        const responseText = await streamPrompt(
            model,
            SYSTEM_PROMPT,
            finalUserMessage,
            onStream,
            history
        )

        const partialOutput = (history.find(h => h.role === 'model')?.parts[0] as any)?.text || ''
        const combinedText = isContinuation ? partialOutput + responseText : responseText

        const raw = extractJSON(combinedText)
        const validated = LaunchAutopilotSchema.parse(raw)
        await onComplete(validated)
    }

    await withTimeout(withRetry(run), 180_000)
}
