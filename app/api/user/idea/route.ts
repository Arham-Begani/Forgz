// app/api/user/idea/route.ts
import { requireAuth, AuthError, isAuthError } from '@/lib/auth'
import { getUserIdea, setUserIdea } from '@/lib/queries'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export async function GET() {
  try {
    const session = await requireAuth()
    const idea = await getUserIdea(session.userId)
    return NextResponse.json({ idea })
  } catch (e) {
    if (isAuthError(e)) return e.toResponse()
    return NextResponse.json({ idea: null })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const result = z.string().min(1).max(2000).safeParse(body.idea)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid idea' }, { status: 400 })
    }
    await setUserIdea(session.userId, result.data)
    return NextResponse.json({ idea: result.data })
  } catch (e) {
    if (isAuthError(e)) return e.toResponse()
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
