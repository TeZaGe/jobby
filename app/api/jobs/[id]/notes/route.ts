import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { JobService } from '@/services/jobs'

const addNoteSchema = z.object({
  content: z.string().min(1)
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    // 1. Authentification (démo fallback)
    const user = await JobService.getOrCreateDemoUser()
    const userId = user.id

    // Vérifie que l'offre appartient à l'utilisateur
    const existingJob = await db.jobApplication.findFirst({
      where: { id, userId }
    })

    if (!existingJob) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Candidature introuvable.' } },
        { status: 404 }
      )
    }

    // 2. Validation
    const body = await request.json()
    const validation = addNoteSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Note vide ou invalide.' } },
        { status: 400 }
      )
    }

    // 3. Création de la note
    const note = await db.note.create({
      data: {
        content: validation.data.content,
        jobApplicationId: id
      }
    })

    return NextResponse.json({ success: true, note }, { status: 201 })
  } catch (e) {
    console.error('API Add Note Error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur serveur lors de l\'ajout de la note.' } },
      { status: 500 }
    )
  }
}
