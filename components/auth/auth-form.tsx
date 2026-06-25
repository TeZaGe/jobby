'use client'

import { useState } from 'react'
import { handleCredentialsSignIn, handleCredentialsSignUp } from '@/app/actions/auth'
import { Loader2, Mail, Lock, User, AlertCircle } from 'lucide-react'

export function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    if (mode === 'register') {
      formData.append('name', name)
    }

    try {
      const action = mode === 'login' ? handleCredentialsSignIn : handleCredentialsSignUp
      const result = await action(null, formData)
      
      if (result && result.error) {
        setError(result.error)
        setLoading(false)
      }
      // Si réussite, next-auth redirige automatiquement vers /dashboard (géré côté serveur)
    } catch (err: any) {
      if (err.message !== 'NEXT_REDIRECT' && !err.digest?.startsWith('NEXT_REDIRECT')) {
        setError('Une erreur inattendue est survenue.')
        setLoading(false)
      }
    }
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex border-b border-border-color">
        <button
          onClick={() => {
            setMode('login')
            setError(null)
          }}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
            mode === 'login'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-foreground'
          }`}
        >
          Se connecter
        </button>
        <button
          onClick={() => {
            setMode('register')
            setError(null)
          }}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
            mode === 'register'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-foreground'
          }`}
        >
          Créer un compte
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === 'register' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Nom complet
            </label>
            <div className="relative">
              <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Jean Dupont"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-foreground/3 border border-border-color rounded-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Adresse email
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="email"
              placeholder="votre@adresse.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-foreground/3 border border-border-color rounded-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Mot de passe
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-foreground/3 border border-border-color rounded-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 px-5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {mode === 'login' ? 'Connexion...' : 'Création du compte...'}
            </>
          ) : (
            mode === 'login' ? 'Se connecter' : 'Créer un compte'
          )}
        </button>
      </form>
    </div>
  )
}
