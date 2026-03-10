// app/api/ventures/[id]/stream/[conversationId]/route.ts
import { requireAuth } from '@/lib/auth'
import { getVenture, getConversation } from '@/lib/queries'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
    try {
        const session = await requireAuth()
        const { id, conversationId } = await params

        const venture = await getVenture(id, session.userId)
        if (!venture) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        const conversation = await getConversation(conversationId)
        if (!conversation || conversation.venture_id !== id) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                let lastLineIndex = 0
                let done = false

                const send = (data: object) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
                }

                // Poll every 400ms
                while (!done) {
                    if (request.signal.aborted) break

                    const conv = await getConversation(conversationId)
                    if (!conv) break

                    // Send any new stream lines
                    const newLines = conv.stream_output.slice(lastLineIndex)
                    let i = 0
                    for (const line of newLines) {
                        if (line.startsWith('__STATUS__')) {
                            const rest = line.replace('__STATUS__', '')
                            const colonIdx = rest.indexOf(':')
                            const agentId = rest.slice(0, colonIdx)
                            const status = rest.slice(colonIdx + 1)
                            send({ type: 'agent-status', agentId, status })
                        } else {
                            send({ type: 'line', content: line, index: lastLineIndex + i })
                        }
                        i++
                    }
                    lastLineIndex = conv.stream_output.length

                    // Check for completion
                    if (conv.status === 'complete') {
                        send({ type: 'complete', result: conv.result })
                        done = true
                    } else if (conv.status === 'failed') {
                        send({ type: 'error', message: 'Agent run failed' })
                        done = true
                    }

                    if (!done) await new Promise(r => setTimeout(r, 400))
                }

                controller.close()
            },
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        })
    } catch (e) {
        if (e instanceof NextResponse) return e
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
