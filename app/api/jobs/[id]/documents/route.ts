import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { db } from '@/lib/db'
import { auth } from '@/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    // Authentification via session OAuth
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    // Vérifie que la candidature appartient bien à l'utilisateur
    const existingJob = await db.jobApplication.findFirst({
      where: { id, userId }
    })

    if (!existingJob) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Candidature introuvable.' } },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string // "CV", "COVER_LETTER", "OTHER"

    if (!file) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Fichier manquant.' } },
        { status: 400 }
      )
    }

    // 1. Validation de la taille (max 10 Mo)
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: { code: 'FILE_TOO_LARGE', message: 'Le fichier dépasse la taille maximale autorisée (10 Mo).' } },
        { status: 400 }
      )
    }

    // 2. Validation de l'extension du fichier (XSS prevention)
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.txt']
    const ext = path.extname(file.name).toLowerCase()
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: { code: 'INVALID_FILE_TYPE', message: 'Extension de fichier non autorisée. (Extensions permises : .pdf, .doc, .docx, .png, .jpg, .jpeg, .txt)' } },
        { status: 400 }
      )
    }

    // 3. Assainissement du nom de fichier (Path Traversal prevention)
    const baseName = path.basename(file.name)
    const cleanName = baseName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFilename = `${Date.now()}-${cleanName}`

    // Sauvegarde physique du fichier dans public/uploads
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadDir, { recursive: true })
    const filePath = path.join(uploadDir, uniqueFilename)
    await fs.writeFile(filePath, buffer)

    const fileUrl = `/uploads/${uniqueFilename}`

    // Création de l'enregistrement en base
    const document = await db.document.create({
      data: {
        name: file.name,
        url: fileUrl,
        type: type || 'OTHER',
        jobApplicationId: id
      }
    })

    return NextResponse.json({ success: true, document }, { status: 201 })
  } catch (e) {
    console.error('API Upload Document Error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors du téléversement du document.' } },
      { status: 500 }
    )
  }
}
