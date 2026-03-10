// app/api/auth/session/route.ts
import { getSession } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
    const session = await getSession()

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
        userId: session.userId,
        email: session.email,
        name: session.name,
        plan: 'free',
    })
}
