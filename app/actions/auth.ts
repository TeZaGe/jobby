'use server'

import { signIn, signOut, provisionDefaultBoard } from '@/auth'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/crypto'
import { AuthError } from 'next-auth'


export async function handleSignOut() {
  await signOut({ redirectTo: '/' })
}

export async function handleCredentialsSignIn(prevState: any, formData: FormData) {
  const email = (formData.get('email') as string)?.toLowerCase()?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Veuillez remplir tous les champs.' }
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard'
    })
  } catch (error: any) {
    // Si c'est une redirection de Next.js, on la laisse passer
    if (error.message === 'NEXT_REDIRECT' || error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    
    if (error instanceof AuthError) {
      if (error.type === 'CredentialsSignin') {
        return { error: 'Identifiants incorrects.' }
      }
      return { error: 'Une erreur de connexion est survenue.' }
    }
    
    return { error: 'Une erreur inattendue est survenue.' }
  }
}

export async function handleCredentialsSignUp(prevState: any, formData: FormData) {
  const email = (formData.get('email') as string)?.toLowerCase()?.trim()
  const name = formData.get('name') as string
  const password = formData.get('password') as string

  if (!email || !password || !name) {
    return { error: 'Veuillez remplir tous les champs.' }
  }

  if (password.length < 6) {
    return { error: 'Le mot de passe doit faire au moins 6 caractères.' }
  }

  try {
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return { error: 'Cet e-mail est déjà utilisé.' }
    }

    const passwordHash = hashPassword(password)
    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash
      }
    })

    // Créer le tableau Kanban par défaut
    await provisionDefaultBoard(user.id)

  } catch (error) {
    console.error('Sign up error:', error)
    return { error: 'Une erreur est survenue lors de la création du compte.' }
  }

  // Connecter l'utilisateur nouvellement inscrit
  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard'
    })
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT' || error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    return { error: 'Compte créé, mais une erreur est survenue lors de la connexion automatique.' }
  }
}
