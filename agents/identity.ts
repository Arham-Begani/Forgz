import { z } from 'zod'
import {
    getFlashModel,
    streamPrompt,
    extractJSON,
    withTimeout,
    withRetry,
} from '@/lib/gemini'

// ── IdentityOutput Zod Schema ────────────────────────────────────────────────

const IdentityOutputSchema = z.object({
    brandName: z.string(),
    brandNameRationale: z.string(),
    brandBible: z.string(),
    nameCandidates: z.array(z.string()),
    tagline: z.string(),
    missionStatement: z.string(),
    brandArchetype: z.string(),
    brandPersonality: z.array(z.string()),
    toneOfVoice: z.object({
        description: z.string(),
        doExamples: z.array(z.string()),
        dontExamples: z.array(z.string()),
    }),
    colorPalette: z.array(
        z.object({
            name: z.string(),
            hex: z.string(),
            role: z.string(),
            psychology: z.string(),
        })
    ),
    typography: z.object({
        displayFont: z.string(),
        bodyFont: z.string(),
        usageRules: z.string(),
    }),
    logoConceptDescriptions: z.array(z.string()),
    uiKitSpec: z.object({
        borderRadius: z.string(),
        spacing: z.string(),
        buttonStyle: z.string(),
        cardStyle: z.string(),
    }),
})

export type IdentityOutput = z.infer<typeof IdentityOutputSchema>

// ── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
# Identity Architect — Brand Specialist

You are Forge's brand creation agent. You build brands that feel inevitable — like they could only belong to this venture.

## Your Job

1. Read Genesis Engine's findings before writing a single word
2. The brand must reflect the market positioning Genesis identified
3. The brand voice must speak directly to the pain points Genesis found
4. Generate a complete Brand Bible — not just a name

## Brand Bible Components

### 1. Brand Name (5 candidates, 1 recommendation)
- Names must be: memorable, domain-available (infer), pronounceable globally
- Avoid generic tech names (-ify, -ly, -hub endings unless justified)
- Provide clear rationale for the recommended name

### 2. Tagline
- One sentence. Benefit-led. No jargon.
- Must speak to the primary pain point Genesis identified

### 3. Mission Statement
- Why this company exists beyond making money
- Grounded in the market gap Genesis found

### 4. Brand Archetype
- Choose from: The Creator, The Challenger, The Sage, The Explorer,
  The Innocent, The Hero, The Ruler, The Caregiver, The Jester,
  The Lover, The Everyman, The Magician
- Justify the choice based on the target market and positioning

### 5. Tone of Voice
- 3–5 personality adjectives
- DO examples (3 sample sentences in brand voice)
- DON'T examples (3 anti-examples)
- The voice must match the market's communication style

### 6. Color Palette
- 3–5 colors with hex values
- Role for each: Primary, Accent, Background, Text, Surface
- Psychology rationale — why each color works for this brand
- Base palette on Genesis's market findings — who are the users?

### 7. Typography
- Display font (headlines): must be distinctive, not generic
- Body font (UI/copy): must be highly readable
- Usage rules: when to use each, sizing guidelines
- Never recommend: Inter, Roboto, Arial, Helvetica, or system fonts

### 8. Logo Concept Descriptions (3 options)
- Text descriptions detailed enough for an image generation prompt
- One wordmark, one symbol, one combination mark
- Describe style, composition, colors, feeling

### 9. UI Kit Spec
- Border radius style (sharp/medium/rounded)
- Spacing system
- Button style (filled/outlined/ghost preferences)
- Card style (elevated/flat/bordered)
- Component feel (dense/airy/balanced)

### 10. Comprehensive Brand Bible Document
Write a long-form, professional "Brand Identity & Design Bible".
- Target length: 1000+ words.
- Format: Professional Markdown with headers and visual descriptions.
- Sections required:
  - Brand Core: Mission, Vision, and Value Proposition
  - Target Audience: Psychographics and user personas (based on Genesis research)
  - Verbal Identity: Tone of Voice deep-dive with samples
  - Visual Identity: Color theory, typography rationale, and imagery style
  - Logo System: Detailed concepts and usage principles
  - UI/UX Principles: The "feel" of the digital product
  - Brand Manifest: A 3-paragraph inspiring manifesto

## Output Rules

- Output strict JSON matching IdentityOutputSchema from VENTURE_OBJECT.md
- Validate output structure before returning
- The brand must be coherent — every element must reinforce the same archetype
- No generic outputs — every field must be specific to this venture
- The brandBible field must be a long-form, professional Markdown document.

## Output Schema

Output your final Brand Bible as a single JSON object matching this exact structure:

{
  "brandName": "string",
  "brandNameRationale": "string",
  "brandBible": "Detailed Markdown content...",
  "nameCandidates": ["string", "string", "string", "string", "string"],
  "tagline": "string",
  "missionStatement": "string",
  "brandArchetype": "string",
  "brandPersonality": ["string", "string", "string"],
  "toneOfVoice": {
    "description": "string",
    "doExamples": ["string", "string", "string"],
    "dontExamples": ["string", "string", "string"]
  },
  "colorPalette": [
    { "name": "string", "hex": "#XXXXXX", "role": "Primary|Accent|Background|Text|Surface", "psychology": "string" }
  ],
  "typography": {
    "display font": "string",
    "body font": "string",
    "usageRules": "string"
  },
  "logoConceptDescriptions": ["string", "string", "string"],
  "uiKitSpec": {
    "borderRadius": "string",
    "spacing": "string",
    "buttonStyle": "string",
    "cardStyle": "string"
  }
}

CRITICAL OUTPUT INSTRUCTION:
After your full brand analysis, output your Brand Bible as a single
valid JSON object matching the structure above. The JSON must be the last
thing you output. Do not include any text after the closing brace.
Output ONLY the JSON — no markdown fences, no explanation after.

IMPORTANT: Do not output any conversational text or "Thought Process" headers. Any step-by-step reasoning or thought process MUST be strictly wrapped inside <think> and </think> tags. Only the final valid JSON should be outside the <think> tags.
`

// ── Agent Runner ──────────────────────────────────────────────────────────────

export async function runIdentityAgent(
    venture: { ventureId: string; name: string; globalIdea?: string; context: Record<string, unknown> },
    onStream: (line: string) => Promise<void>,
    onComplete: (result: IdentityOutput) => Promise<void>
): Promise<void> {
    if (!venture.context.research) {
        throw new Error('Research context required. Run the Research module first.')
    }

    const userMessage = `Build a complete Brand Bible for this venture.

${venture.context?.architectPlan ? `Architect's Plan:\n${venture.context.architectPlan}\n\n` : ''}${venture.globalIdea ? `Global Startup Vision: ${venture.globalIdea}\n` : ''}Specific Venture Focus: ${venture.name}

Market research (use this to ground every brand decision):
${JSON.stringify(venture.context.research, null, 2)}

The brand name, voice, and colors must be specific to this market.
Do not produce generic tech startup branding.
Output the full IdentityOutput JSON at the end.`

    const run = async () => {
        const model = getFlashModel()
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
        const validated = IdentityOutputSchema.parse(raw)
        await onComplete(validated)
    }

    await withTimeout(
        withRetry(run),
        Number(process.env.AGENT_TIMEOUT_MS ?? 60000)
    )
}
