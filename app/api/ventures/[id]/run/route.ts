// app/api/ventures/[id]/run/route.ts
import { requireAuth } from '@/lib/auth'
import {
    getVenture,
    createConversation,
    appendStreamLine,
    updateConversationStatus,
} from '@/lib/queries'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
    moduleId: z.enum(['research', 'branding', 'marketing', 'landing', 'feasibility', 'full-launch']),
    prompt: z.string().min(1).max(2000),
})

async function runAgent(
    ventureId: string,
    conversationId: string,
    moduleId: string,
    prompt: string,
    userId: string
) {
    // TODO: Wire Gemini agents here
    // For now: simulate a 2-second delay then mark complete
    await new Promise(r => setTimeout(r, 2000))
    await appendStreamLine(conversationId, 'Agent wiring coming in Phase 11...')
    await updateConversationStatus(conversationId, 'complete')
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth()
        const { id } = await params

        const body = await request.json()
        const result = bodySchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
        }

        const { moduleId, prompt } = result.data

        const venture = await getVenture(id, session.userId)
        if (!venture) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        const conversation = await createConversation(id, moduleId, prompt)

        // Fire and forget — agent runs async
        runAgent(id, conversation.id, moduleId, prompt, session.userId).catch(
            err => console.error('Agent error:', err)
        )

        return NextResponse.json(
            { conversationId: conversation.id, status: 'running' },
            { status: 202 }
        )
    } catch (e) {
        if (e instanceof NextResponse) return e
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
