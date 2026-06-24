'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Briefcase, Building2, ClipboardList, Settings, 
  LayoutGrid, ChevronRight, LogOut, Sun, Moon,
  PanelLeftClose, PanelLeftOpen, Kanban
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { handleSignOut } from '@/app/actions/auth'
import Image from 'next/image'
import { useState, useEffect } from 'react'

interface SidebarProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Montage coté client uniquement pour éviter le mismatch d'hydratation
  useEffect(() => { setMounted(true) }, [])

  const menuItems = [
    { name: 'Mes Tableaux', href: '/boards', icon: LayoutGrid },
    { name: 'Dashboard', href: '/dashboard', icon: Kanban },
    { name: 'Entreprises', href: '/company', icon: Building2 },
    { name: 'Tâches', href: '/tasks', icon: ClipboardList },
    { name: 'Paramètres', href: '/settings', icon: Settings },
  ]

  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname.startsWith('/dashboard')
    if (href === '/boards') return pathname === '/boards' || pathname.startsWith('/boards/')
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside
      className={`${
        collapsed ? 'w-[72px] min-w-[72px]' : 'w-[260px] min-w-[260px]'
      } bg-bg-side border-r border-border-color flex flex-col justify-between transition-all duration-300 ease-in-out`}
    >
      <div className="flex flex-col flex-1 p-3 overflow-hidden">
        {/* Logo + Collapse button */}
        <div className={`flex items-center mb-6 ${collapsed ? 'justify-center flex-col gap-2' : 'justify-between'} px-1 pt-2`}>
          {collapsed ? (
            <Link href="/boards" className="group">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
                <Briefcase size={15} className="text-white" />
              </div>
            </Link>
          ) : (
            <Link href="/boards" className="flex items-center gap-2.5 group min-w-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                <Briefcase size={15} className="text-white" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-text-muted bg-clip-text text-transparent truncate">
                jobby
              </span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-foreground hover:bg-foreground/5 transition-all duration-200 flex-shrink-0"
            aria-label={collapsed ? 'Déplier la sidebar' : 'Réduire la sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          <ul className="flex flex-col gap-1 list-none p-0 m-0">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <li key={item.name} className="list-none">
                  <Link
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={`flex items-center gap-3 text-sm font-medium px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      active
                        ? 'bg-primary/10 border border-primary/15 text-primary'
                        : 'text-text-muted hover:text-foreground hover:bg-foreground/5 border border-transparent'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <Icon
                      size={17}
                      className={`flex-shrink-0 transition-colors ${
                        active ? 'text-primary' : 'text-text-muted group-hover:text-foreground'
                      }`}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.name}</span>
                        {active && <ChevronRight size={13} className="text-primary/50 flex-shrink-0" />}
                      </>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* Bas de sidebar */}
      <div className={`flex flex-col gap-2 p-3 border-t border-border-color ${collapsed ? 'items-center' : ''}`}>
        <form action={handleSignOut}>
          <button
            type="submit"
            title={collapsed ? 'Déconnexion' : undefined}
            className={`${
              collapsed ? 'w-9 h-9 justify-center' : 'w-full'
            } flex items-center gap-3 text-sm font-medium px-3 py-2.5 rounded-xl text-text-muted hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 cursor-pointer`}
          >
            <LogOut size={15} className="flex-shrink-0" />
            {!collapsed && 'Déconnexion'}
          </button>
        </form>

        <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'justify-between gap-2'}`}>
          <div className={`flex items-center gap-2.5 min-w-0 ${collapsed ? 'flex-col' : ''}`}>
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name ?? 'Avatar'}
                width={32}
                height={32}
                className="rounded-full border border-border-color flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center font-semibold text-white text-xs border border-foreground/10 flex-shrink-0">
                {userInitials}
              </div>
            )}
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold leading-none mb-0.5 truncate">
                  {user?.name?.split(' ')[0] ?? 'Utilisateur'}
                </span>
                <span className="text-[10px] text-text-muted leading-none truncate">
                  {user?.email ?? ''}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-foreground hover:bg-foreground/5 transition-all duration-200 flex-shrink-0"
            aria-label="Changer de thème"
          >
            {/* Affiché uniquement après le mount pour éviter le mismatch hydration */}
            {mounted && (theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />)}
            {!mounted && <div className="w-3.5 h-3.5 rounded-full bg-border-color" />}
          </button>
        </div>
      </div>
    </aside>
  )
}
