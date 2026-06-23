import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Évite d'instancier plusieurs connexions à la base de données en mode développement
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is missing')
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  prisma = new PrismaClient({ adapter })
} else {
  if (!globalForPrisma.prisma) {
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    globalForPrisma.prisma = new PrismaClient({ adapter })
  }
  prisma = globalForPrisma.prisma
}

export const db = prisma
