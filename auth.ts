import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/crypto'

export async function provisionDefaultBoard(userId: string) {
  const existingBoard = await db.board.findFirst({
    where: { userId },
  })
  
  if (existingBoard) return

  const board = await db.board.create({
    data: {
      name: 'Ma recherche d\'emploi',
      emoji: '🚀',
      isDefault: true,
      order: 0,
      userId: userId,
    },
  })

  const defaultColumns = [
    { name: 'À postuler', order: 0, color: '#6b7280' },
    { name: 'Postulé', order: 1, color: '#3b82f6' },
    { name: 'Entretien', order: 2, color: '#f59e0b' },
    { name: 'Offre reçue', order: 3, color: '#10b981' },
    { name: 'Refusé', order: 4, color: '#ef4444' },
  ]

  await db.column.createMany({
    data: defaultColumns.map((col) => ({
      ...col,
      userId: userId,
      boardId: board.id,
    })),
  })
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = (credentials.email as string).toLowerCase()
        const user = await db.user.findUnique({
          where: { email }
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isValid = verifyPassword(credentials.password as string, user.passwordHash)
        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  events: {
    /**
     * Automatically provision a default board + Kanban columns
     * when a new user is created via OAuth.
     */
    async createUser({ user }) {
      if (user.id) {
        await provisionDefaultBoard(user.id)
      }
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt',
  },
})
