import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { JobService } from '@/services/jobs'

// Schéma de validation des modifications de la candidature
const updateJobSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  location: z.string().max(100).optional().nullable(),
  salary: z.string().max(100).optional().nullable(),
  url: z.string().max(1000).optional().nullable(),
  contactName: z.string().max(100).optional().nullable(),
  contactEmail: z.string().max(100).optional().nullable(),
  contactPhone: z.string().max(100).optional().nullable(),
  columnId: z.string().optional(),
  archive: z.boolean().optional() // Si true, active le soft delete
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    // 1. Récupération de l'utilisateur (démo fallback)
    const user = await JobService.getOrCreateDemoUser()
    const userId = user.id

    // Vérifie que l'offre appartient bien à l'utilisateur
    const existingJob = await db.jobApplication.findFirst({
      where: { id, userId }
    })

    if (!existingJob) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Candidature introuvable.' } },
        { status: 404 }
      )
    }

    // 2. Validation du payload
    const body = await request.json()
    const validation = updateJobSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Champs invalides.', details: validation.error.format() } },
        { status: 400 }
      )
    }

    const data = validation.data
    const updateData: any = {}

    // Remplissage sélectif des modifications
    if (data.title !== undefined) updateData.title = data.title
    if (data.location !== undefined) updateData.location = data.location
    if (data.salary !== undefined) updateData.salary = data.salary
    if (data.url !== undefined) updateData.url = data.url
    
    // Mise à jour de la relation Contact
    if (data.contactName !== undefined || data.contactEmail !== undefined || data.contactPhone !== undefined) {
      const existingContact = await db.contact.findFirst({
        where: {
          jobApplications: {
            some: { id }
          }
        }
      })

      if (existingContact) {
        await db.contact.update({
          where: { id: existingContact.id },
          data: {
            name: (data.contactName !== undefined && data.contactName !== null) ? data.contactName : existingContact.name,
            email: data.contactEmail !== undefined ? data.contactEmail : existingContact.email,
            phone: data.contactPhone !== undefined ? data.contactPhone : existingContact.phone,
            companyId: existingJob.companyId
          }
        })
      } else if (data.contactName) {
        await db.contact.create({
          data: {
            name: data.contactName,
            email: data.contactEmail || null,
            phone: data.contactPhone || null,
            userId,
            companyId: existingJob.companyId,
            jobApplications: {
              connect: { id }
            }
          }
        })
      }
    }

    // Soft delete / Archive
    if (data.archive === true) {
      updateData.deletedAt = new Date()
    }

    // 3. Mise à jour de la colonne et écriture dans l'historique de transition
    if (data.columnId !== undefined && data.columnId !== existingJob.columnId) {
      await JobService.move(id, data.columnId, existingJob.order)
    }

    // 4. Mise à jour générale de la fiche
    const updatedJob = await db.jobApplication.update({
      where: { id },
      data: updateData,
      include: { company: true, column: true }
    })

    return NextResponse.json({ success: true, job: updatedJob })
  } catch (e) {
    console.error('API Update Job Error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la mise à jour de la candidature.' } },
      { status: 500 }
    )
  }
}
