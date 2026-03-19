import { z } from 'zod'
import {
    getFlashModel,
    streamPrompt,
    extractJSON,
    withTimeout,
    withRetry,
    Content,
} from '@/lib/gemini'

// ── VariantGenerator Zod Schema ──────────────────────────────────────────────

const VariantSchema = z.object({
    name: z.string(),
    description: z.string(),
    targetAudience: z.string(),
    businessModel: z.string(),
    keyDifferentiator: z.string(),
})

const VariantGeneratorSchema = z.object({
    variants: z.array(VariantSchema).min(2).max(3),
})

export type VariantGeneratorOutput = z.infer<typeof VariantGeneratorSchema>

// ── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
# Venture Variant Strategist

You are a venture variant strategist. Your job is to take a core startup idea and generate 2-3 maximally different business model variants.

## Rules

1. Each variant must target a DIFFERENT audience OR use a DIFFERENT business model OR attack a DIFFERENT market segment.
2. Never generate variants that are just renames of the same idea. Make each variant genuinely distinct.
3. Variant names should be short and descriptive (e.g. "B2C Subscription", "B2B SaaS", "Marketplace").
4. Descriptions should be 2-3 sentences explaining the variant's approach.
5. The keyDifferentiator must explain what makes THIS variant different from the others.

## Output

Output strict JSON matching this structure:
{
  "variants": [
    {
      "name": "string",
      "description": "string (2-3 sentences)",
      "targetAudience": "string",
      "businessModel": "string",
      "keyDifferentiator": "string"
    }
  ]
}

Output ONLY the JSON. No markdown fences, no explanation.
`

// ── Agent Runner ──────────────────────────────────────────────────────────────

export async function runVariantGenerator(
    coreIdea: string,
    ventureName: string,
    onStream: (chunk: string) => Promise<void>,
    onComplete: (result: VariantGeneratorOutput) => Promise<void>
): Promise<void> {
    const model = getFlashModel()

    const userMessage = `Generate 2-3 maximally different business model variants for this venture concept.

Venture: ${ventureName}
Core Idea: ${coreIdea}

Each variant should explore a fundamentally different approach to solving the same problem. Think different audiences, different revenue models, different market segments.

Output the VariantGenerator JSON.`

    const run = async () => {
        const responseText = await streamPrompt(
            model,
            SYSTEM_PROMPT,
            userMessage,
            onStream
        )

        const raw = extractJSON(responseText)
        const validated = VariantGeneratorSchema.parse(raw)
        await onComplete(validated)
    }

    await withTimeout(withRetry(run), 120_000)
}
