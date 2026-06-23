import { db } from '@/lib/db'

/**
 * Service gérant la logique métier des candidatures (CRUD, statistiques, transitions).
 */
export class JobService {
  /**
   * Récupère une candidature par son ID avec ses relations
   */
  static async getById(id: string) {
    return db.jobApplication.findUnique({
      where: { id },
      include: {
        company: true,
        tags: true,
        notes: { orderBy: { createdAt: 'desc' } },
        events: { orderBy: { date: 'asc' } }
      }
    })
  }

  /**
   * Crée une nouvelle candidature (et l'entreprise associée si inexistante)
   */
  static async create(userId: string, data: {
    title: string
    companyName: string
    location?: string
    description?: string
    url?: string
    salary?: string
    source?: string
    columnId: string
    order: number
  }) {
    // 1. Recherche ou crée l'entreprise associée à cet utilisateur
    let company = await db.company.findUnique({
      where: {
        userId_name: {
          userId,
          name: data.companyName
        }
      }
    })

    if (!company) {
      company = await db.company.create({
        data: {
          name: data.companyName,
          userId
        }
      })
    }

    // 2. Crée la candidature avec la liaison entreprise
    return db.jobApplication.create({
      data: {
        title: data.title,
        location: data.location,
        description: data.description,
        url: data.url,
        salary: data.salary,
        source: data.source,
        columnId: data.columnId,
        order: data.order,
        userId,
        companyId: company.id
      },
      include: {
        company: true
      }
    })
  }

  /**
   * Récupère ou crée un utilisateur de démonstration pour tester l'application en base
   */
  static async getOrCreateDemoUser() {
    let user = await db.user.findFirst({
      where: { email: 'demo@jobby.dev' }
    })

    if (!user) {
      user = await db.user.create({
        data: {
          name: 'Thomas (Demo)',
          email: 'demo@jobby.dev',
          extensionToken: 'demo-extension-token-123456'
        }
      })
    }

    return user
  }

  /**
   * Récupère les colonnes et candidatures associées d'un utilisateur en base.
   * Initialise les colonnes par défaut si aucune n'existe.
   */
  static async getBoardData(userId: string) {
    let columns = await db.column.findMany({
      where: { userId },
      include: {
        jobApplications: {
          where: { deletedAt: null },
          include: {
            company: true,
            tags: true,
            notes: { orderBy: { createdAt: 'desc' } },
            events: { orderBy: { date: 'asc' } },
            contacts: true
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    })

    // Si aucune colonne n'existe, on initialise le tableau par défaut
    if (columns.length === 0) {
      const defaultColumns = [
        { name: "À postuler", order: 1, color: "bg-col-to-apply" },
        { name: "Postulé", order: 2, color: "bg-col-applied" },
        { name: "Entretien", order: 3, color: "bg-col-interview" },
        { name: "Offres reçues", order: 4, color: "bg-col-offer" },
        { name: "Refusé / Clôturé", order: 5, color: "bg-col-refused" }
      ]

      await db.column.createMany({
        data: defaultColumns.map(col => ({
          name: col.name,
          order: col.order,
          color: col.color,
          userId
        }))
      })

      // On re-récupère les colonnes créées
      columns = await db.column.findMany({
        where: { userId },
        include: {
          jobApplications: {
            where: { deletedAt: null },
            include: {
              company: true,
              tags: true,
              notes: { orderBy: { createdAt: 'desc' } },
              events: { orderBy: { date: 'asc' } },
              contacts: true
            },
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { order: 'asc' }
      })
    }

    return columns
  }

  /**
   * Déplace une candidature vers une nouvelle colonne et enregistre l'historique
   */
  static async move(id: string, toColumnId: string, order: number) {
    const job = await db.jobApplication.findUnique({
      where: { id },
      select: { columnId: true }
    })

    if (!job) {
      throw new Error("Candidature introuvable")
    }

    const fromColumnId = job.columnId

    // Si la colonne ne change pas, on met simplement à jour l'ordre
    if (fromColumnId === toColumnId) {
      return db.jobApplication.update({
        where: { id },
        data: { order }
      })
    }

    // Transaction pour mettre à jour la candidature et insérer l'historique
    return db.$transaction(async (tx) => {
      const updatedJob = await tx.jobApplication.update({
        where: { id },
        data: {
          columnId: toColumnId,
          order
        }
      })

      await tx.jobApplicationHistory.create({
        data: {
          jobApplicationId: id,
          fromColumnId,
          toColumnId
        }
      })

      return updatedJob
    })
  }
}
