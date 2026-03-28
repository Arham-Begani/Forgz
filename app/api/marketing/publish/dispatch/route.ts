import { dispatchDuePublishJobs } from '@/lib/marketing-dispatch'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.MARKETING_PUBLISH_CRON_SECRET
  if (!expected) return false
  return request.headers.get('x-marketing-cron-secret') === expected
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const summary = await dispatchDuePublishJobs()
    return NextResponse.json({ ok: true, summary })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Dispatch failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
