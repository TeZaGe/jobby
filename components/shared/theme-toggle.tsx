'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

/**
 * Bouton de basculement de thème (sombre / clair) avec gestion de la désynchronisation de l'hydratation.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Rendu d'un squelette pendant l'hydratation côté serveur
    return <div className="w-9 h-9 rounded-lg bg-card-bg border border-border-color animate-pulse" />
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-xl bg-card-bg border border-border-color hover:bg-border-color text-text-muted hover:text-foreground transition-all duration-200 cursor-pointer flex items-center justify-center"
      aria-label="Changer de thème"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-[18px] w-[18px] text-yellow-400" />
      ) : (
        <Moon className="h-[18px] w-[18px] text-indigo-500" />
      )}
    </button>
  )
}
