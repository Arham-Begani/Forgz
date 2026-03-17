import { z } from 'zod'
import {
    getFlashModel,
    streamPrompt,
    extractJSON,
    withTimeout,
    Content,
} from '@/lib/gemini'

// ── MVP Scalpel Output Schema ───────────────────────────────────────────────

export const MVPScalpelSchema = z.object({
    killList: z.array(z.object({
        feature: z.string().default('Feature name'),
        whyItFeelsEssential: z.string().default('Seems important because...'),
        whyItKills: z.string().default('Wastes time because...'),
        whenToBuild: z.string().default('After first 50 paying customers'),
        effort: z.enum(['days', 'weeks', 'months']).default('weeks'),
    })).default([]),

    skeletonMVP: z.object({
        oneLiner: z.string().default('A minimal product that tests one core assumption.'),
        coreHypothesis: z.string().default('Users will pay for X because Y.'),
        features: z.array(z.object({
            name: z.string().default('Core Feature'),
            description: z.string().default('Description pending.'),
            whyIncluded: z.string().default('Directly tests the core hypothesis.'),
        })).default([]),
        explicitlyExcluded: z.array(z.string()).default([]),
        successCriteria: z.string().default('10 paying customers in 14 days.'),
    }).default({
        oneLiner: 'A minimal product that tests one core assumption.',
        coreHypothesis: 'Users will pay for X because Y.',
        features: [],
        explicitlyExcluded: [],
        successCriteria: '10 paying customers in 14 days.',
    }),

    weekendSpec: z.object({
        totalHours: z.number().default(16),
        techStack: z.array(z.string()).default([]),
        pages: z.array(z.object({
            name: z.string().default('Page'),
            purpose: z.string().default('Purpose pending.'),
            components: z.array(z.string()).default([]),
        })).default([]),
        endpoints: z.array(z.object({
            method: z.string().default('GET'),
            path: z.string().default('/api/endpoint'),
            purpose: z.string().default('Purpose pending.'),
        })).default([]),
        thirdPartyServices: z.array(z.object({
            name: z.string().default('Service'),
            purpose: z.string().default('Purpose pending.'),
            cost: z.string().default('Free tier'),
        })).default([]),
        hourByHourPlan: z.array(z.object({
            hour: z.string().default('Hour 1'),
            task: z.string().default('Task pending.'),
            deliverable: z.string().default('Deliverable pending.'),
        })).default([]),
        deployTarget: z.string().default('Vercel'),
        launchReady: z.string().default('Live URL with working core flow.'),
    }).default({
        totalHours: 16,
        techStack: [],
        pages: [],
        endpoints: [],
        thirdPartyServices: [],
        hourByHourPlan: [],
        deployTarget: 'Vercel',
        launchReady: 'Live URL with working core flow.',
    }),

    timeToFirstDollar: z.object({
        estimatedDays: z.number().default(14),
        breakdown: z.array(z.object({
            phase: z.string().default('Phase'),
            days: z.number().default(1),
            description: z.string().default('Description pending.'),
        })).default([]),
        assumptions: z.array(z.string()).default([]),
        fastestPath: z.string().default('Pre-sell via Gumroad before building anything.'),
    }).default({
        estimatedDays: 14,
        breakdown: [],
        assumptions: [],
        fastestPath: 'Pre-sell via Gumroad before building anything.',
    }),

    antiScopeCreepRules: z.array(z.object({
        rule: z.string().default('Rule pending.'),
        why: z.string().default('Reason pending.'),
    })).default([]),

    verdict: z.object({
        readiness: z.enum(['ship-now', 'almost-ready', 'needs-rethink']).default('almost-ready'),
        summary: z.string().default('Verdict summary pending.'),
    }).default({
        readiness: 'almost-ready',
        summary: 'Verdict summary pending.',
    }),
})

export type MVPScalpelOutput = z.infer<typeof MVPScalpelSchema>

// ── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
# MVP Scalpel — The Feature Executioner

You are the most ruthless product advisor in tech. Your job is to tell founders what NOT to build. You believe:

- If it can't be built in a weekend, it's too big.
- If it has more than 5 features, it's too complex.
- The goal is first dollar, not first feature.
- Every feature you cut gets the founder closer to revenue.
- Perfection is the enemy of shipping.

## Your Rules

1. Kill List: Produce 5-8 features to kill. Be specific and brutal. Explain why each feels essential (founder psychology) and why it actually kills momentum.
2. Skeleton MVP: Maximum 2-5 features. If you list more than 5, you've failed. The MVP tests ONE hypothesis.
3. Weekend Spec: Use the FASTEST tools, not the best architecture. Next.js + Vercel + Stripe is fine. Django + AWS + microservices is NOT.
4. Always suggest pre-selling before building. Gumroad, Stripe payment links, Google Forms — validate demand with money, not surveys.
5. NEVER recommend these for an MVP: user auth/accounts, admin panels, analytics dashboards, notification systems, settings pages, onboarding flows. If the founder can do it manually for the first 50 customers, it's not in the MVP.
6. If the venture is B2B, the MVP might be a spreadsheet + manual outreach + Calendly. Say so.
7. If it's a marketplace, the MVP is supply-side only. Don't build both sides.
8. Time-to-first-dollar should always include the fastest possible path, even if it means selling before the product exists.
9. Anti-scope creep rules must be exactly 5, each actionable and specific to this venture.

## Output Format

Output strict JSON matching the MVPScalpelOutput schema. Every field must be populated with real, specific advice for this venture.

IMPORTANT: Be specific to the venture. Do not give generic startup advice. Reference the actual market data, competitors, and business model from the venture context.
Output ONLY the JSON. No conversational text outside of it.
`

// ── Agent Runner ────────────────────────────────────────────────────────────

interface VentureInput {
    ventureId: string
    name: string
    globalIdea?: string
    context: Record<string, unknown>
}

export async function runMVPScalpelAgent(
    venture: VentureInput,
    onStream: (chunk: string) => Promise<void>,
    onComplete: (result: MVPScalpelOutput) => Promise<void>,
    history: Content[] = []
): Promise<void> {
    const model = getFlashModel()

    // Build context block from available venture data
    const contextParts: string[] = []

    if (venture.globalIdea) {
        contextParts.push(`Venture Vision: ${venture.globalIdea}`)
    }

    // Research is the primary input
    if (venture.context?.research) {
        contextParts.push(`Market Research Data:\n${JSON.stringify(venture.context.research, null, 2)}`)
    }

    // Branding is optional context
    if (venture.context?.branding) {
        const b = venture.context.branding as Record<string, any>
        const brandSummary: Record<string, any> = {}
        if (b.brandName) brandSummary.brandName = b.brandName
        if (b.tagline) brandSummary.tagline = b.tagline
        if (b.missionStatement) brandSummary.missionStatement = b.missionStatement
        contextParts.push(`Brand Context:\n${JSON.stringify(brandSummary, null, 2)}`)
    }

    // Feasibility is optional but influences tone
    if (venture.context?.feasibility) {
        const f = venture.context.feasibility as Record<string, any>
        contextParts.push(`Feasibility Analysis:\n${JSON.stringify(venture.context.feasibility, null, 2)}`)

        // If feasibility flagged concerns, add emphasis
        if (f.verdict === 'NO-GO' || f.verdict === 'CONDITIONAL GO') {
            contextParts.push(`\n⚠️ IMPORTANT: Feasibility flagged concerns (verdict: ${f.verdict}). Focus the MVP on validating demand before investing further. The Kill List should be especially aggressive.`)
        }
    }

    const isContinuation = history.length > 0
    const finalUserMessage = isContinuation
        ? "Continue from where you left off. Do not repeat anything already outputted. Complete the MVPScalpelOutput JSON object strictly."
        : `Cut this venture down to its absolute minimum viable product. Tell the founder what NOT to build.

Venture: ${venture.name}

${contextParts.join('\n\n')}

Produce the complete MVPScalpelOutput JSON.`

    const run = async () => {
        let fullText = (history.find(h => h.role === 'model')?.parts[0] as any)?.text || ''

        await streamPrompt(
            model,
            SYSTEM_PROMPT,
            finalUserMessage,
            async (chunk) => {
                fullText += chunk
                await onStream(chunk)
            },
            history
        )

        const raw = extractJSON(fullText)
        const validated = MVPScalpelSchema.parse(raw)
        await onComplete(validated)
    }

    await withTimeout(run(), 60_000)
}
