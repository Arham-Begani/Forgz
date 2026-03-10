// app/api/projects/route.ts
import { requireAuth } from '@/lib/auth'
import { getProjectsByUser, createProject } from '@/lib/queries'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(10).optional(),
})

export async function GET() {
  try {
    const session = await requireAuth()
    const projects = await getProjectsByUser(session.userId)
    return NextResponse.json(projects)
  } catch (e) {
    if (e instanceof NextResponse) return e
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const result = CreateProjectSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error.flatten() }, { status: 400 })
    }

    const project = await createProject(
      session.userId,
      result.data.name,
      result.data.description,
      result.data.icon,
    )
    return NextResponse.json(project, { status: 201 })
  } catch (e) {
    if (e instanceof NextResponse) return e
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
