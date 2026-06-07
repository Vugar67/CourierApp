'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Warehouse, DollarSign, Users, Package, LogOut, ChevronRight, Settings, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/types'

const navItems = [
  { href: '/admin',            icon: LayoutDashboard, label: 'Главная' },
  { href: '/admin/warehouses', icon: Warehouse,       label: 'Склады' },
  { href: '/admin/tariffs',    icon: DollarSign,      label: 'Тарифы' },
  { href: '/admin/triggers',   icon: Zap,             label: 'Триггеры' },
  { href: '/admin/users',      icon: Users,           label: 'Пользователи' },
  { href: '/admin/parcels',    icon: Package,         label: 'Посылки' },
  { href: '/admin/settings',   icon: Settings,        label: 'Настройки' },
]

export default function AdminSidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="w-60 h-full bg-gray-900 flex flex-col shrink-0">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
              <rect x="9" y="11" width="14" height="10" rx="2"/>
              <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            </svg>
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-tight block">CourierApp</span>
            <span className="text-gray-500 text-xs">Администратор</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} className="text-brand-200" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-gray-800">
        {profile && (
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile.first_name} {profile.last_name}</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
        )}
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all duration-150">
          <LogOut size={17} />
          Выйти
        </button>
      </div>
    </aside>
  )
}
