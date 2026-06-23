'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Briefcase, Building2, ClipboardList, Settings } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'

/**
 * Composant de navigation latérale de l'application Dashboard.
 */
export function Sidebar() {
  const pathname = usePathname()

  const menuItems = [
    { name: 'Tableau Kanban', href: '/dashboard', icon: Briefcase },
    { name: 'Entreprises', href: '/company', icon: Building2 },
    { name: 'Tâches & Rappels', href: '#', icon: ClipboardList },
    { name: 'Paramètres', href: '#', icon: Settings },
  ]

  return (
    <aside className="w-[260px] min-w-[260px] bg-bg-side border-r border-border-color flex flex-col justify-between p-6">
      <div>
        <div className="flex items-center gap-3 pl-2 mb-10">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <Briefcase size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-text-muted bg-clip-text text-transparent">
            jobby
          </span>
        </div>

        <nav>
          <ul className="flex flex-col gap-2 list-none p-0 m-0">
            {menuItems.map((item) => {
              const Icon = item.icon
              // Active si l'URL courante commence par l'href (sauf pour #)
              const isActive = item.href !== '#' && (
                pathname === item.href || pathname.startsWith(item.href + '/')
              )

              return (
                <li key={item.name} className="list-none">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-4 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/10 border border-primary/20 text-purple-400'
                        : 'text-text-muted hover:text-foreground hover:bg-foreground/5'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-purple-400' : 'text-text-muted'} />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border-color">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-semibold text-white border border-foreground/10">
            TL
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none mb-1">Thomas L.</span>
            <span className="text-[11px] text-text-muted leading-none">thomas@jobby.dev</span>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  )
}
