import { createClient } from '@/lib/supabase/server'
import { Package, Clock, CheckCircle2, Wallet, Copy } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: deposit }, { data: parcels }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('client_deposit').select('*').eq('client_id', user!.id).single(),
    supabase.from('parcels').select('*').eq('client_id', user!.id).order('created_at', { ascending: false }).limit(5),
  ])

  const activeCount  = parcels?.filter(p => !['delivered','returned'].includes(p.status)).length ?? 0
  const pendingCount = parcels?.filter(p => p.status === 'expected').length ?? 0
  const doneCount    = parcels?.filter(p => p.status === 'delivered').length ?? 0

  const statusLabels: Record<string, { label: string; color: string }> = {
    expected:             { label: 'Ожидается',         color: 'bg-amber-50 text-amber-700' },
    arrived_origin:       { label: 'На складе',         color: 'bg-blue-50 text-blue-700' },
    consolidated:         { label: 'Консолидирована',   color: 'bg-purple-50 text-purple-700' },
    in_container:         { label: 'В контейнере',      color: 'bg-indigo-50 text-indigo-700' },
    shipped:              { label: 'Отправлена',        color: 'bg-cyan-50 text-cyan-700' },
    in_transit:           { label: 'В пути',            color: 'bg-sky-50 text-sky-700' },
    arrived_destination:  { label: 'Прибыла',           color: 'bg-teal-50 text-teal-700' },
    customs_processing:   { label: 'Таможня',           color: 'bg-orange-50 text-orange-700' },
    customs_hold:         { label: 'Задержана',         color: 'bg-red-50 text-red-700' },
    at_warehouse:         { label: 'На складе (АЗ)',    color: 'bg-lime-50 text-lime-700' },
    ready_for_pickup:     { label: 'Готова к выдаче',   color: 'bg-green-50 text-green-700' },
    out_for_delivery:     { label: 'У курьера',         color: 'bg-emerald-50 text-emerald-700' },
    delivered:            { label: 'Доставлена',        color: 'bg-green-50 text-green-700' },
    returned:             { label: 'Возврат',           color: 'bg-gray-50 text-gray-600' },
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">
          Здравствуйте, {profile?.first_name} 👋
        </h1>
        <p className="text-text-muted text-sm mt-1">Вот что происходит с вашими посылками</p>
      </div>

      {/* Personal code card */}
      {profile?.personal_code && (
        <div className="card p-5 mb-6 flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-700 border-0 text-white">
          <div>
            <p className="text-brand-200 text-xs font-medium mb-1 uppercase tracking-wider">Ваш персональный код</p>
            <p className="text-2xl font-mono font-bold tracking-widest">{profile.personal_code}</p>
            <p className="text-brand-200 text-xs mt-1">Используйте его как фамилию при заказах</p>
          </div>
          <button
            className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
            onClick={() => navigator.clipboard.writeText(profile.personal_code!)}
          >
            <Copy size={14} />
            Скопировать
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Package,     label: 'Активных',   value: activeCount,                          color: 'text-brand-600',  bg: 'bg-brand-50' },
          { icon: Clock,       label: 'Ожидается',  value: pendingCount,                         color: 'text-amber-600',  bg: 'bg-amber-50' },
          { icon: CheckCircle2,label: 'Доставлено', value: doneCount,                            color: 'text-green-600',  bg: 'bg-green-50' },
          { icon: Wallet,      label: 'Депозит',    value: formatCurrency(deposit?.balance ?? 0), color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="card p-4">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-text-muted text-xs font-medium">{label}</p>
            <p className="text-xl font-bold text-text mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent parcels */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-text">Последние посылки</h2>
          <a href="/dashboard/parcels" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            Все посылки →
          </a>
        </div>

        {!parcels || parcels.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Package size={24} className="text-text-muted" />
            </div>
            <p className="text-text font-medium mb-1">Посылок пока нет</p>
            <p className="text-text-muted text-sm">Добавьте первую посылку чтобы начать отслеживание</p>
            <a href="/dashboard/parcels/new" className="btn-primary mt-4 inline-flex">
              + Добавить посылку
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {parcels.map(parcel => {
              const s = statusLabels[parcel.status] ?? { label: parcel.status, color: 'bg-gray-50 text-gray-600' }
              return (
                <div key={parcel.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-surface-100 rounded-lg flex items-center justify-center group-hover:bg-surface-200 transition-colors">
                      <Package size={15} className="text-text-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text font-mono">{parcel.tracking_number}</p>
                      <p className="text-xs text-text-muted">{parcel.description || 'Без описания'}</p>
                    </div>
                  </div>
                  <span className={`badge ${s.color}`}>{s.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
