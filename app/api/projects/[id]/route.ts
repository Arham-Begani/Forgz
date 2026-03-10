// app/api/projects/[id]/route.ts
import { requireAuth } from '@/lib/auth'
import {
  getProject,
  updateProject,
  deleteProject,
  getVenturesByProject,
} from '@/lib/queries'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(10).optional(),
  status: z.enum(['active', 'archived']).optional(),
  global_idea: z.string().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const project = await getProject(id, session.userId)
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const ventures = await getVenturesByProject(id)

    return NextResponse.json({ ...project, ventures })
  } catch (e) {
    if (e instanceof NextResponse) return e
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const project = await getProject(id, session.userId)
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const result = UpdateProjectSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error.flatten() }, { status: 400 })
    }

    await updateProject(id, result.data)
    return NextResponse.json({ ...project, ...result.data })
  } catch (e) {
    if (e instanceof NextResponse) return e
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const project = await getProject(id, session.userId)
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await deleteProject(id)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    if (e instanceof NextResponse) return e
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
