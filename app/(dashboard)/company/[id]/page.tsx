'use client'

import * as React from 'react'
import { Sidebar } from '@/components/shared/sidebar'
import { 
  ArrowLeft, 
  Globe, 
  Calendar, 
  FileText, 
  Users, 
  Mail, 
  Phone 
} from 'lucide-react'
import Link from 'next/link'

interface Params {
  id: string
}

export default function CompanyDetailPage({ params }: { params: Promise<Params> }) {
  // Déballage du paramètre asynchrone conforme à Next.js 15
  const resolvedParams = React.use(params)
  const companyNameRaw = resolvedParams.id
  
  // Formatage du nom pour l'affichage (ex: vercel -> Vercel)
  const companyName = companyNameRaw.charAt(0).toUpperCase() + companyNameRaw.slice(1)

  const kpi = [
    { title: "Candidatures totales", value: "2", color: "" },
    { title: "Temps de réponse moyen", value: "4 jours", color: "text-purple-400" },
    { title: "Taux de conversion", value: "50%", color: "text-emerald-400" }
  ]

  const contacts = [
    { 
      name: "Sarah Jenkins", 
      role: "Lead Talent Acquisition", 
      email: `sarah.j@${companyNameRaw}.com`, 
      phone: "+33 6 12 34 56 78" 
    },
    { 
      name: "Dan Abramov", 
      role: "Engineering Manager", 
      email: `dan@${companyNameRaw}.com`, 
      phone: null 
    }
  ]

  const timelineItems = [
    {
      title: "Senior React / Next.js Developer",
      meta: "Créé via l'extension • Ajouté le 22/06/2026 à 14:32",
      status: "À postuler",
      badgeClass: "bg-neutral-500/10 border-neutral-500/20 text-neutral-400"
    },
    {
      title: "Product Engineer Intern (Frontend focus)",
      meta: "Créé manuellement • Postulé le 10/05/2026 • Clôturé le 14/05/2026",
      status: "Refusé",
      badgeClass: "bg-red-500/10 border-red-500/20 text-red-400",
      muted: true
    }
  ]

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      <Sidebar />

      {/* Zone de contenu défilante */}
      <main className="flex-1 overflow-y-auto p-10">
        
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 text-text-muted hover:text-foreground text-sm font-medium mb-6 w-fit transition-colors duration-200"
        >
          <ArrowLeft size={16} />
          Retour au tableau
        </Link>

        {/* En-tête de l'entreprise */}
        <header className="flex items-center justify-between border-b border-border-color pb-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-black border border-border-color flex items-center justify-center font-display font-extrabold text-3xl text-white shadow-xl shadow-black/30">
              {companyName.charAt(0)}
            </div>
            <div className="flex flex-col">
              <h1 className="font-display font-bold text-3xl mb-1.5 tracking-tight">{companyName}</h1>
              <a 
                href={`https://${companyNameRaw}.com`} 
                target="_blank" 
                rel="noreferrer"
                className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-1.5 w-fit"
              >
                {companyNameRaw}.com
                <Globe size={14} />
              </a>
            </div>
          </div>
        </header>

        {/* Grille d'agencement du contenu */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne de gauche (KPIs, Timeline, Notes) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-5">
              {kpi.map((item, index) => (
                <div key={index} className="bg-card-bg border border-border-color rounded-2xl p-5 text-center">
                  <p className="text-xs text-text-muted mb-1.5">{item.title}</p>
                  <h3 className={`font-display text-2xl font-bold ${item.color}`}>{item.value}</h3>
                </div>
              ))}
            </div>

            {/* Historique des offres */}
            <div className="bg-card-bg border border-border-color rounded-[20px] p-6">
              <h2 className="font-display font-bold text-lg mb-6 flex items-center gap-2.5">
                <Calendar size={18} className="text-primary" />
                Historique des offres chez {companyName}
              </h2>

              <div className="relative pl-6 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-border-color">
                {timelineItems.map((item, i) => (
                  <div key={i} className={`relative mb-6 last:mb-0 ${item.muted ? 'opacity-70' : ''}`}>
                    <span className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-[3px] border-background bg-text-muted" />
                    
                    <div className="bg-foreground/2 border border-border-color rounded-xl p-4 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-1 leading-snug">{item.title}</h4>
                        <p className="text-[11px] text-text-muted">{item.meta}</p>
                      </div>
                      <span className={`text-[10px] font-semibold py-1 px-2.5 rounded-full border ${item.badgeClass}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bloc-notes */}
            <div className="bg-card-bg border border-border-color rounded-[20px] p-6">
              <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2.5">
                <FileText size={18} className="text-primary" />
                Notes sur l'entreprise
              </h2>
              <textarea 
                className="w-full h-[150px] bg-foreground/3 border border-border-color rounded-xl p-4 text-sm leading-relaxed text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none mb-3"
                defaultValue={`${companyName} est une entreprise technologique de pointe.\nProcessus de recrutement standard :\n- Entretien de qualification RH (30 min)\n- Test technique ou cas pratique à réaliser\n- Entretien technique avec l'équipe développement\n- Entretien final de culture-fit`}
              />
              <button 
                onClick={() => alert('Notes enregistrées !')}
                className="bg-primary/10 border border-primary/20 hover:bg-primary/15 text-purple-400 py-2 px-4 rounded-lg text-xs font-semibold float-right cursor-pointer transition-colors duration-200"
              >
                Enregistrer les notes
              </button>
              <div className="clear-both" />
            </div>

          </div>

          {/* Colonne de droite (Contacts) */}
          <div>
            <div className="bg-card-bg border border-border-color rounded-[20px] p-6">
              <h2 className="font-display font-bold text-lg mb-6 flex items-center gap-2.5">
                <Users size={18} className="text-primary" />
                Contacts ({contacts.length})
              </h2>

              <div className="flex flex-col gap-3">
                {contacts.map((contact, index) => (
                  <div key={index} className="bg-foreground/2 border border-border-color rounded-xl p-4">
                    <h4 className="text-sm font-semibold mb-0.5">{contact.name}</h4>
                    <p className="text-xs text-primary font-medium mb-3">{contact.role}</p>
                    
                    <div className="flex flex-col gap-2 text-xs text-text-muted">
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-foreground transition-colors duration-150">
                        <Mail size={14} />
                        {contact.email}
                      </a>
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-foreground transition-colors duration-150">
                          <Phone size={14} />
                          {contact.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  )
}
