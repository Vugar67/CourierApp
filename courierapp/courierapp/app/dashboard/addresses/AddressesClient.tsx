'use client'

import { useState } from 'react'
import { Copy, Check, MapPin } from 'lucide-react'

const COUNTRY_ORDER = ['US', 'CA', 'DE', 'ES', 'GB', 'TR', 'CN', 'AZ']


const COUNTRY_NAMES: Record<string, string> = {
  US: 'ABŞ', CA: 'Kanada', DE: 'Almaniya',
  GB: 'İngiltərə', ES: 'İspaniya', TR: 'Türkiyə',
  CN: 'Çin', AZ: 'Azərbaycan',
}

interface Warehouse {
  id: string
  name: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string | null
  zip: string
  phone: string
  countries?: { name_ru: string; name_az: string; name_en: string; code: string }
}

interface Profile {
  personal_code: string | null
  first_name: string
  last_name: string
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100 group hover:border-brand-200 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
      </div>
      <button
        onClick={handleCopy}
        className={`ml-3 p-1.5 rounded-lg transition-all shrink-0 ${
          copied
            ? 'bg-green-100 text-green-600'
            : 'bg-white text-gray-400 hover:text-brand-600 hover:bg-brand-50 border border-gray-200'
        }`}
        title="Kopyala"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  )
}

export default function AddressesClient({
  warehouses,
  profile,
}: {
  warehouses: Warehouse[]
  profile: Profile | null
}) {
  const [activeTab, setActiveTab] = useState(warehouses[0]?.id ?? '')

  const sortedWarehouses = [...warehouses].sort((a, b) => {
    const ai = COUNTRY_ORDER.indexOf(a.countries?.code ?? '')
    const bi = COUNTRY_ORDER.indexOf(b.countries?.code ?? '')
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
  const activeWarehouse = sortedWarehouses.find(w => w.id === activeTab) ?? warehouses.find(w => w.id === activeTab)
  const countryCode = activeWarehouse?.countries?.code ?? ''

  // Build full name with personal code
  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}${profile.personal_code ? ' ' + profile.personal_code : ''}`
    : ''

  // Build address fields for active warehouse
  const fields = activeWarehouse ? [
    { label: 'Ad Soyad / Full Name', value: fullName },
    { label: 'Ünvan 1 / Address Line 1', value: activeWarehouse.address_line1 },
    ...(activeWarehouse.address_line2 ? [{ label: 'Ünvan 2 / Address Line 2', value: activeWarehouse.address_line2 }] : []),
    { label: 'Şəhər / City', value: activeWarehouse.city },
    ...(activeWarehouse.state ? [{ label: 'Ştat/Region / State', value: activeWarehouse.state }] : []),
    { label: 'Ölkə / Country', value: activeWarehouse.countries?.name_en ?? '' },
    { label: 'ZIP / Postal Code', value: activeWarehouse.zip },
    { label: 'Telefon / Phone Number', value: activeWarehouse.phone },
  ] : []

  // Copy all fields at once
  async function copyAll() {
    if (!activeWarehouse) return
    const text = fields.map(f => `${f.label}: ${f.value}`).join('\n')
    await navigator.clipboard.writeText(text)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Anbar ünvanlarım</h1>
        <p className="text-gray-500 text-sm mt-1">
          Alış-veriş zamanı aşağıdakı ünvanı çatdırılış ünvanı kimi göstərin
        </p>
      </div>

      {/* Personal code banner */}
      {profile?.personal_code && (
        <div className="card p-4 mb-5 bg-gradient-to-r from-brand-600 to-brand-700 border-0 text-white flex items-center justify-between">
          <div>
            <p className="text-brand-200 text-xs font-medium mb-0.5 uppercase tracking-wider">Şəxsi kodunuz</p>
            <p className="text-2xl font-mono font-bold tracking-widest">{profile.personal_code}</p>
            <p className="text-brand-200 text-xs mt-0.5">Sifariş verərkən soyadınız kimi istifadə edin</p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(profile.personal_code!)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
          >
            <Copy size={13} /> Kopyala
          </button>
        </div>
      )}

      {/* Warning for Spain */}
      {countryCode === 'ES' && (
        <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-xs text-amber-800">
          <span className="shrink-0">⚠️</span>
          <p>Diqqət! Satıcının saytında anbar ünvanını doldurarkən şəhər olaraq "Barcelona" deyil <strong>"Gavà"</strong> qeyd edilməlidir.</p>
        </div>
      )}

      {/* Warning for Germany */}
      {countryCode === 'DE' && (
        <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-xs text-amber-800">
          <span className="shrink-0">⚠️</span>
          <p>Diqqət! Anbar ünvanı ilə bərabər şirkətin adını qeyd edin. Şirkətin adı qeyd edilmədikdə DHL kuryer şirkəti bağlamağa icazə vermir.</p>
        </div>
      )}

      {/* Country tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 sticky top-0 z-10 bg-white pt-2 -mx-6 px-6">
        {sortedWarehouses.map(w => {
          const code = w.countries?.code ?? ''
          const isActive = w.id === activeTab
          return (
            <button
              key={w.id}
              onClick={() => setActiveTab(w.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              <img src={`https://flagcdn.com/20x15/${code.toLowerCase()}.png`} width="20" height="15" alt={code} className="rounded-sm" />
              <span>{COUNTRY_NAMES[code] ?? w.countries?.name_az ?? code}</span>
            </button>
          )
        })}
      </div>

      {/* Address fields */}
      {activeWarehouse && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-brand-600" />
              <span className="font-semibold text-gray-900">{activeWarehouse.name}</span>
            </div>
            <button
              onClick={copyAll}
              className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              <Copy size={13} /> Hamısını kopyala
            </button>
          </div>

          <div className="space-y-2">
            {fields.map(f => (
              <CopyField key={f.label} label={f.label} value={f.value} />
            ))}
          </div>
        </div>
      )}

      {warehouses.length === 0 && (
        <div className="card p-12 text-center">
          <MapPin size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Anbar ünvanları hələ əlavə edilməyib</p>
        </div>
      )}
    </div>
  )
}
