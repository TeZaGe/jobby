'use client'

import { Sidebar } from '@/components/shared/sidebar'
import { Building2, Search, ArrowUpRight, Clock, Briefcase } from 'lucide-react'
import Link from 'next/link'

export default function CompaniesPage() {
  const companies = [
    { id: "vercel", name: "Vercel", logo: "▲", bg: "bg-black text-white", url: "vercel.com", activeJobs: 1, avgResponse: "4 jours" },
    { id: "stripe", name: "Stripe", logo: "S", bg: "bg-indigo-600 text-white", url: "stripe.com", activeJobs: 1, avgResponse: "En attente" },
    { id: "notion", name: "Notion", logo: "N", bg: "bg-black text-white border border-white/10", url: "notion.so", activeJobs: 1, avgResponse: "En attente" },
    { id: "google", name: "Google", logo: "G", bg: "bg-red-500 text-white", url: "google.com", activeJobs: 1, avgResponse: "8 jours" },
    { id: "datadog", name: "Datadog", logo: "D", bg: "bg-purple-600 text-white", url: "datadoghq.com", activeJobs: 1, avgResponse: "5 jours" },
    { id: "sellsy", name: "Sellsy", logo: "S", bg: "bg-blue-600 text-white", url: "sellsy.com", activeJobs: 1, avgResponse: "12 jours" },
    { id: "figma", name: "Figma", logo: "F", bg: "bg-orange-500 text-white", url: "figma.com", activeJobs: 0, avgResponse: "3 jours" }
  ]

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      <Sidebar />

      {/* Main Panel */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top bar */}
        <header className="h-[70px] border-b border-border-color flex items-center justify-between px-10">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              className="bg-foreground/4 border border-border-color py-2.5 pl-11 pr-4 rounded-xl text-sm w-[320px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
              placeholder="Rechercher une entreprise..." 
            />
          </div>
        </header>

        {/* Company Grid Content */}
        <div className="flex-1 overflow-y-auto p-10">
          <div className="flex items-center gap-3 mb-8">
            <Building2 size={24} className="text-primary" />
            <h1 className="font-display font-bold text-3xl tracking-tight">Entreprises Suivies</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {companies.map((company) => (
              <div 
                key={company.id}
                className="bg-card-bg border border-border-color rounded-2xl p-6 hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-200 flex flex-col justify-between hover:shadow-xl hover:shadow-black/20"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-display font-extrabold text-2xl shadow-md ${company.bg}`}>
                        {company.logo}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg leading-tight mb-1">{company.name}</h3>
                        <span className="text-xs text-text-muted">{company.url}</span>
                      </div>
                    </div>
                    
                    <Link 
                      href={`/company/${company.id}`}
                      className="p-2 rounded-lg bg-foreground/3 hover:bg-primary/10 border border-border-color hover:border-primary/20 text-text-muted hover:text-primary transition-all duration-150"
                    >
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>

                  <div className="flex flex-col gap-2.5 border-t border-border-color pt-4 text-xs text-text-muted">
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} />
                      <span>{company.activeJobs} offre{company.activeJobs > 1 ? 's' : ''} active{company.activeJobs > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>Temps de réponse : <strong className="text-foreground">{company.avgResponse}</strong></span>
                    </div>
                  </div>
                </div>

                <Link 
                  href={`/company/${company.id}`}
                  className="mt-6 w-full text-center bg-foreground/4 border border-border-color hover:bg-primary/10 hover:border-primary/20 hover:text-purple-400 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 block"
                >
                  Voir la fiche entreprise
                </Link>

              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
