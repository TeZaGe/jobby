'use client'

import Link from 'next/link'
import { Briefcase, Check, Puzzle } from 'lucide-react'

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center overflow-hidden relative px-4">
      {/* Halos de lumières d'ambiance */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-radial from-primary/12 to-transparent pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-radial from-emerald-500/8 to-transparent pointer-events-none z-0" />

      <div className="flex w-full max-w-[1000px] h-[600px] bg-card-bg backdrop-blur-xl border border-border-color rounded-[24px] overflow-hidden z-10 shadow-2xl shadow-primary/5">
        
        {/* Partie gauche : Branding & Intro */}
        <div className="hidden md:flex flex-1.2 bg-gradient-to-br from-purple-950/20 to-neutral-950/40 p-14 flex-col justify-between border-r border-border-color">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <Briefcase size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">
              jobby
            </span>
          </div>

          <div className="my-auto">
            <h1 className="font-display font-extrabold text-[36px] leading-[1.15] mb-6 tracking-tight">
              Prenez le contrôle de votre <span className="bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">recherche d'emploi</span>.
            </h1>
            <p className="text-text-muted text-sm leading-relaxed mb-8 max-w-[380px]">
              Centralisez vos offres d'emploi, suivez vos entretiens et analysez vos statistiques de recrutement en un seul endroit avec notre extension de scraping et notre tableau Kanban dynamique.
            </p>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-foreground/3 border border-border-color px-4 py-2.5 rounded-full w-fit">
                <Check size={14} className="text-primary" />
                <span className="text-xs font-medium text-foreground">Extension de Scraping</span>
              </div>
              <div className="flex items-center gap-3 bg-foreground/3 border border-border-color px-4 py-2.5 rounded-full w-fit">
                <Check size={14} className="text-primary" />
                <span className="text-xs font-medium text-foreground">Statistiques Détaillées</span>
              </div>
              <div className="flex items-center gap-3 bg-foreground/3 border border-border-color px-4 py-2.5 rounded-full w-fit">
                <Check size={14} className="text-primary" />
                <span className="text-xs font-medium text-foreground">Kanban Collaboratif</span>
              </div>
            </div>
          </div>

          <span className="text-[11px] text-text-muted/50">
            © 2026 Jobby CRM. Tous droits réservés.
          </span>
        </div>

        {/* Partie droite : Formulaire de Connexion */}
        <div className="flex-1 p-14 flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left">
            <h2 className="font-display font-bold text-2xl mb-2 tracking-tight">
              Content de vous revoir !
            </h2>
            <p className="text-text-muted text-sm">
              Connectez-vous pour accéder à votre espace candidat.
            </p>
          </div>

          {/* Lien simulé de connexion NextAuth */}
          <Link
            href="/dashboard"
            className="w-full bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-200 py-3.5 px-5 rounded-xl text-sm font-semibold flex items-center justify-center gap-3 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 active:translate-y-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.12h4.01c2.34-2.16 3.69-5.32 3.69-8.74z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.01-3.12c-1.12.75-2.54 1.19-3.95 1.19-3.05 0-5.63-2.06-6.55-4.83H1.31v3.22A12 12 0 0 0 12 24z"/>
              <path fill="#FBBC05" d="M5.45 14.33a7.14 7.14 0 0 1 0-4.66V6.45H1.31a12 12 0 0 0 0 11.1l4.14-3.22z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.31 6.45l4.14 3.22c.92-2.77 3.5-4.83 6.55-4.83z"/>
            </svg>
            Continuer avec Google
          </Link>

          <div className="flex items-center my-8 text-text-muted/30 text-xs font-semibold uppercase tracking-wider before:content-[''] before:flex-1 before:h-[1px] before:bg-border-color before:mr-4 after:content-[''] after:flex-1 after:h-[1px] after:bg-border-color after:ml-4">
            Ou utilisez l'extension
          </div>

          <div className="bg-primary/5 border border-dashed border-primary/20 p-5 rounded-2xl text-center">
            <Puzzle className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="text-sm font-semibold mb-1">Jeton d'API de l'Extension</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Une fois connecté via Google, récupérez votre jeton de sécurité dans les paramètres pour configurer l'extension de scraping en un clic.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
