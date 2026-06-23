'use client'

import { Sidebar } from '@/components/shared/sidebar'
import { 
  Plus, 
  Search, 
  Briefcase, 
  Calendar, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Link as LinkIcon 
} from 'lucide-react'
import Link from 'next/link'

interface MockCard {
  id: string
  company: string
  logo: string
  logoBg: string
  title: string
  salary: string | null
  tags: string[]
  source: string
  added: string
  alert?: string
  alertColor?: string
  success?: boolean
  muted?: boolean
}

interface MockColumn {
  id: string
  name: string
  color: string
  cards: MockCard[]
}

export default function DashboardPage() {
  const stats = [
    { title: "Total Candidatures", value: "14", icon: Briefcase, color: "text-primary" },
    { title: "Entretiens Planifiés", value: "3", icon: Calendar, color: "text-amber-500", highlight: true },
    { title: "Taux de Réponse", value: "42%", icon: TrendingUp, color: "text-emerald-500" },
    { title: "Temps de réponse moyen", value: "6.2 jours", icon: Clock, color: "text-primary" }
  ]

  const columns: MockColumn[] = [
    {
      id: "to-apply",
      name: "À postuler",
      color: "bg-col-to-apply",
      cards: [
        {
          id: "1",
          company: "Vercel",
          logo: "▲",
          logoBg: "bg-black text-white",
          title: "Senior React / Next.js Developer",
          salary: null,
          tags: ["Remote", "Full-time"],
          source: "Extension Chrome",
          added: "Ajouté hier"
        },
        {
          id: "2",
          company: "Stripe",
          logo: "S",
          logoBg: "bg-indigo-600 text-white",
          title: "Staff Fullstack Engineer (Node/React)",
          salary: "75k - 85k",
          tags: ["Paris", "Hybrid"],
          source: "Manuel",
          added: "Il y a 3j"
        }
      ]
    },
    {
      id: "applied",
      name: "Postulé",
      color: "bg-col-applied",
      cards: [
        {
          id: "3",
          company: "Notion",
          logo: "N",
          logoBg: "bg-black text-white border border-white/10",
          title: "Product Engineer (Frontend focus)",
          salary: null,
          tags: ["Remote (Europe)"],
          source: "Welcome to J.",
          added: "Postulé le 18/06"
        }
      ]
    },
    {
      id: "interview",
      name: "Entretien",
      color: "bg-col-interview",
      cards: [
        {
          id: "4",
          company: "Google",
          logo: "G",
          logoBg: "bg-red-500 text-white",
          title: "UX/UI Designer - Cloud Products",
          salary: "85k+",
          tags: ["Paris", "Onsite"],
          source: "LinkedIn",
          added: "Entretien RH",
          alert: "Entretien RH : Demain à 10:00"
        },
        {
          id: "5",
          company: "Datadog",
          logo: "D",
          logoBg: "bg-purple-600 text-white",
          title: "Software Engineer - Core Platform",
          salary: null,
          tags: ["Paris 11e", "Hybrid"],
          source: "LinkedIn",
          added: "Test Tech",
          alert: "Test Technique : dans 3 jours",
          alertColor: "bg-primary/10 border-primary/20 text-purple-400"
        }
      ]
    },
    {
      id: "offer",
      name: "Offres reçues",
      color: "bg-col-offer",
      cards: [
        {
          id: "6",
          company: "Sellsy",
          logo: "S",
          logoBg: "bg-blue-600 text-white",
          title: "React Developer (CRM Core team)",
          salary: "50k - 55k",
          tags: ["La Rochelle", "Hybrid"],
          source: "ManoMano",
          added: "Offre reçue le 20/06",
          success: true
        }
      ]
    },
    {
      id: "refused",
      name: "Refusé / Clôturé",
      color: "bg-col-refused",
      cards: [
        {
          id: "7",
          company: "Figma",
          logo: "F",
          logoBg: "bg-orange-500 text-white",
          title: "Staff Product Designer",
          salary: null,
          tags: ["London / Remote"],
          source: "Extension Chrome",
          added: "Refusé après Tech Call",
          muted: true
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      <Sidebar />

      {/* Panneau Principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Barre du haut */}
        <header className="h-[70px] border-b border-border-color flex items-center justify-between px-10">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              className="bg-foreground/4 border border-border-color py-2.5 pl-11 pr-4 rounded-xl text-sm w-[320px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
              placeholder="Rechercher une offre, entreprise, tag..." 
            />
          </div>

          <div>
            <button 
              onClick={() => alert('Ajouter une candidature')}
              className="bg-primary hover:bg-primary-hover text-white py-2.5 px-5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all duration-200 cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              Nouvelle offre
            </button>
          </div>
        </header>

        {/* Ligne des KPIs */}
        <section className="flex gap-5 px-10 pt-6 pb-2">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div key={i} className="flex-1 bg-card-bg border border-border-color rounded-2xl p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-foreground/3 border border-border-color`}>
                  <Icon size={20} className={stat.color} />
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-0.5">{stat.title}</p>
                  <h3 className={`font-display text-2xl font-bold ${stat.highlight ? 'text-amber-500' : ''}`}>{stat.value}</h3>
                </div>
              </div>
            )
          })}
        </section>

        {/* Zone de Tableau Kanban */}
        <div className="flex-1 flex gap-5 px-10 pb-10 pt-4 overflow-x-auto items-stretch">
          {columns.map((col) => (
            <div key={col.id} className="w-[320px] min-w-[320px] bg-foreground/3 border border-border-color rounded-[20px] flex flex-col p-4">
              
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="flex items-center gap-2.5 font-semibold text-sm">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                  {col.name}
                </span>
                <span className="bg-foreground/5 border border-border-color px-2.5 py-0.5 rounded-full text-[11px] text-text-muted">
                  {col.cards.length}
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
                {col.cards.map((card) => (
                  <div 
                    key={card.id} 
                    className={`bg-card-bg border border-border-color rounded-2xl p-4 cursor-grab hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-200 relative group hover:shadow-xl hover:shadow-black/20 ${card.muted ? 'opacity-60' : ''} ${card.success ? 'border-emerald-500/30' : ''}`}
                  >
                    
                    <div className="flex items-start justify-between mb-3">
                      {/* Liaison vers la page entreprise */}
                      <Link 
                        href={`/company/${card.company.toLowerCase()}`}
                        className="flex items-center gap-2 text-text-muted hover:text-foreground transition-colors duration-150 group/link"
                      >
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] ${card.logoBg}`}>
                          {card.logo}
                        </div>
                        <span className="text-[11px] font-semibold group-hover/link:underline">{card.company}</span>
                      </Link>
                      
                      {card.salary && (
                        <span className={`text-[10px] py-0.5 px-2 rounded-md font-medium border ${card.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-500/8 border-emerald-500/15 text-emerald-400'}`}>
                          {card.salary}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold mb-2.5 leading-snug">{card.title}</h4>

                    <div className="flex flex-wrap gap-1.5 mb-3.5">
                      {card.tags.map((tag, tIndex) => (
                        <span key={tIndex} className="text-[10px] bg-foreground/3 border border-border-color text-foreground px-2 py-0.5 rounded-full font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {card.alert && (
                      <div className={`mb-3.5 border rounded-lg py-1.5 px-2.5 text-[10px] flex items-center gap-2 font-medium ${card.alertColor || 'bg-amber-500/8 border-amber-500/15 text-amber-400'}`}>
                        <Calendar size={12} />
                        {card.alert}
                      </div>
                    )}

                    <div className="border-t border-border-color pt-2.5 flex items-center justify-between text-[10px] text-text-muted">
                      <div className="flex items-center gap-1">
                        <LinkIcon size={12} />
                        {card.source}
                      </div>
                      <span className={card.success ? 'text-emerald-400 font-semibold' : ''}>{card.added}</span>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>

      </main>
    </div>
  )
}
