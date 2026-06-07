import { createClient } from '@/lib/supabase/server'
import { Users, Package, Warehouse, DollarSign } from 'lucide-react'

export default async function AdminPage() {
  const supabase = createClient()

  const [
    { count: usersCount },
    { count: parcelsCount },
    { count: warehousesCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
    supabase.from('parcels').select('*', { count: 'exact', head: true }),
    supabase.from('warehouses').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const stats = [
    { icon: Users,     label: 'Клиентов',  value: usersCount ?? 0,      color: 'text-brand-600',  bg: 'bg-brand-50' },
    { icon: Package,   label: 'Посылок',   value: parcelsCount ?? 0,    color: 'text-amber-600',  bg: 'bg-amber-50' },
    { icon: Warehouse, label: 'Складов',   value: warehousesCount ?? 0, color: 'text-green-600',  bg: 'bg-green-50' },
    { icon: DollarSign,label: 'Транзакций',value: 0,                    color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Панель администратора</h1>
        <p className="text-gray-500 text-sm mt-1">Управление системой</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="card p-4">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-gray-500 text-xs font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/admin/warehouses" className="card p-5 hover:shadow-card-md transition-shadow group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <Warehouse size={18} className="text-green-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Склады</h2>
          </div>
          <p className="text-sm text-gray-500">Управление складами и филиалами по странам</p>
          <p className="text-xs text-brand-600 mt-3 font-medium group-hover:underline">Перейти →</p>
        </a>

        <a href="/admin/tariffs" className="card p-5 hover:shadow-card-md transition-shadow group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
              <DollarSign size={18} className="text-purple-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Тарифы</h2>
          </div>
          <p className="text-sm text-gray-500">Настройка цен и тарифных сеток по направлениям</p>
          <p className="text-xs text-brand-600 mt-3 font-medium group-hover:underline">Перейти →</p>
        </a>
      </div>
    </div>
  )
}