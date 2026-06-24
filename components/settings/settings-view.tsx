'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import {
  User, Sun, Moon, Key
} from 'lucide-react'
import Image from 'next/image'

interface SettingsViewProps {
  user: {
    name: string | null
    email: string | null
    image: string | null
    extensionToken: string | null
  }
}

export function SettingsView({ user }: SettingsViewProps) {
  const { theme, setTheme } = useTheme()
  const userInitials = user.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <main className="flex-1 overflow-auto p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Key size={18} className="text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Configuration</span>
          </div>
          <h1 className="font-display font-bold text-3xl tracking-tight">Paramètres</h1>
          <p className="text-text-muted text-sm mt-1">Gérez votre compte et vos préférences</p>
        </div>

        <div className="space-y-5">
          {/* Profil */}
          <section className="bg-card-bg border border-border-color rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <User size={15} className="text-primary" />
              <h2 className="font-semibold text-sm uppercase tracking-wider text-text-muted">Profil</h2>
            </div>
            <div className="flex items-center gap-4">
              {user.image ? (
                <Image src={user.image} alt={user.name ?? 'Avatar'} width={56} height={56}
                  className="rounded-2xl border border-border-color flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center font-bold text-white text-xl border border-foreground/10 flex-shrink-0">
                  {userInitials}
                </div>
              )}
              <div>
                <p className="font-semibold text-base">{user.name ?? 'Utilisateur'}</p>
                <p className="text-text-muted text-sm">{user.email}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-text-muted">Connecté via Google</span>
                </div>
              </div>
            </div>
          </section>

          {/* Apparence */}
          <section className="bg-card-bg border border-border-color rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Sun size={15} className="text-primary" />
              <h2 className="font-semibold text-sm uppercase tracking-wider text-text-muted">Apparence</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Thème de l&apos;interface</p>
                <p className="text-xs text-text-muted mt-0.5">Choisissez entre le mode sombre et clair</p>
              </div>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 border border-border-color px-4 py-2 rounded-xl text-sm font-medium transition-all"
              >
                {theme === 'dark' ? <><Sun size={15} /> Mode clair</> : <><Moon size={15} /> Mode sombre</>}
              </button>
            </div>
          </section>


        </div>
      </div>
    </main>
  )
}
