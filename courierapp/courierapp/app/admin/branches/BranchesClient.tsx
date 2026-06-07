'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, MapPin, X, Loader2, CheckCircle2, Building2, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Branch {
  id: string
  name: string
  address: string
  phone: string | null
  branch_type: string
  azpost_code: string | null
  lat: number | null
  lng: number | null
  working_hours: any
  is_active: boolean
  sort_order: number
}

const emptyForm = {
  name: '',
  address: '',
  phone: '',
  branch_type: 'pickup_point',
  azpost_code: '',
  lat: '',
  lng: '',
  is_active: true,
  sort_order: '10',
  wh_mf_customer: '',
  wh_mf_warehouse: '',
  wh_sat_customer: '',
  wh_sat_warehouse: '',
}

export default function BranchesClient({ branches: initial }: { branches: Branch[] }) {
  const supabase = createClient()
  const [branches, setBranches] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'branch' | 'pickup_point'>('all')

  const filtered = branches.filter(b => filter === 'all' ? true : b.branch_type === filter)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setError(null)
    setSuccess(false)
    setShowModal(true)
  }

  function openEdit(b: Branch) {
    setEditing(b)
    const wh = b.working_hours ?? {}
    setForm({
      name: b.name,
      address: b.address,
      phone: b.phone ?? '',
      branch_type: b.branch_type,
      azpost_code: b.azpost_code ?? '',
      lat: b.lat != null ? String(b.lat) : '',
      lng: b.lng != null ? String(b.lng) : '',
      is_active: b.is_active,
      sort_order: String(b.sort_order),
      wh_mf_customer: wh.mon_fri?.customer_service ?? '',
      wh_mf_warehouse: wh.mon_fri?.warehouse ?? '',
      wh_sat_customer: wh.sat?.customer_service ?? '',
      wh_sat_warehouse: wh.sat?.warehouse ?? '',
    })
    setError(null)
    setSuccess(false)
    setShowModal(true)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const working_hours: any = {}
    if (form.wh_mf_customer || form.wh_mf_warehouse) {
      working_hours.mon_fri = {}
      if (form.wh_mf_customer) working_hours.mon_fri.customer_service = form.wh_mf_customer
      if (form.wh_mf_warehouse) working_hours.mon_fri.warehouse = form.wh_mf_warehouse
    }
    if (form.wh_sat_customer || form.wh_sat_warehouse) {
      working_hours.sat = {}
      if (form.wh_sat_customer) working_hours.sat.customer_service = form.wh_sat_customer
      if (form.wh_sat_warehouse) working_hours.sat.warehouse = form.wh_sat_warehouse
    }

    const warehouseId = (await supabase
      .from('warehouses')
      .select('id')
      .eq('is_origin', false)
      .limit(1)
      .single()).data?.id

    const payload = {
      warehouse_id:  warehouseId,
      name:          form.name,
      address:       form.address,
      phone:         form.phone || null,
      branch_type:   form.branch_type,
      azpost_code:   form.azpost_code || null,
      lat:           form.lat ? parseFloat(form.lat) : null,
      lng:           form.lng ? parseFloat(form.lng) : null,
      working_hours: Object.keys(working_hours).length > 0 ? working_hours : null,
      is_active:     form.is_active,
      sort_order:    parseInt(form.sort_order) || 10,
    }

    if (editing) {
      const { error: err } = await supabase.from('branches').update(payload).eq('id', editing.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase.from('branches').insert(payload)
      if (err) { setError(err.message); setLoading(false); return }
    }

    const { data } = await supabase.from('branches').select('*').order('sort_order')
    setBranches(data ?? [])
    setSuccess(true)
    setLoading(false)
    setTimeout(() => setShowModal(false), 800)
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить?')) return
    await supabase.from('branches').delete().eq('id', id)
    setBranches(prev => prev.filter(b => b.id !== id))
  }

  async function handleToggle(b: Branch) {
    await supabase.from('branches').update({ is_active: !b.is_active }).eq('id', b.id)
    setBranches(prev => prev.map(x => x.id === b.id ? { ...x, is_active: !x.is_active } : x))
  }

  const branchCount = branches.filter(b => b.branch_type === 'branch').length
  const pickupCount = branches.filter(b => b.branch_type === 'pickup_point').length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Filiallar və məntəqələr</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {branchCount} filial · {pickupCount} Azərpoçt məntəqəsi
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Əlavə et
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {[
          { value: 'all', label: 'Hamısı' },
          { value: 'branch', label: '🏢 Filiallar' },
          { value: 'pickup_point', label: '📦 Azərpoçt məntəqələri' },
        ].map(f => (
          <button key={f.value}
            onClick={() => setFilter(f.value as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.value ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(b => (
          <div key={b.id} className={`card p-4 flex items-center justify-between ${!b.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                b.branch_type === 'branch' ? 'bg-brand-50' : 'bg-amber-50'
              }`}>
                {b.branch_type === 'branch'
                  ? <Building2 size={18} className="text-brand-600" />
                  : <Package size={18} className="text-amber-600" />
                }
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{b.name}</p>
                  {b.azpost_code && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-mono">{b.azpost_code}</span>
                  )}
                  {!b.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Bağlı</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{b.address}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {b.phone && <p className="text-xs text-gray-400">{b.phone}</p>}
                  {b.lat && b.lng && (
                    <a
                      href={`https://www.google.com/maps?q=${b.lat},${b.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"
                    >
                      <MapPin size={11} /> Xəritədə aç
                    </a>
                  )}
                  {b.working_hours?.mon_fri && (
                    <p className="text-xs text-gray-400">
                      B.e-Cümə: {b.working_hours.mon_fri.warehouse ?? b.working_hours.mon_fri.customer_service}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => handleToggle(b)}
                className={`btn-ghost p-2 text-xs ${b.is_active ? 'hover:text-amber-600' : 'hover:text-green-600'}`}
                title={b.is_active ? 'Bağla' : 'Aç'}>
                {b.is_active ? '⏸' : '▶'}
              </button>
              <button onClick={() => openEdit(b)} className="btn-ghost p-2"><Pencil size={15} /></button>
              <button onClick={() => handleDelete(b.id)} className="btn-ghost p-2 hover:text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? 'Redaktə et' : 'Yeni məntəqə'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              <div>
                <label className="label">Növ</label>
                <select name="branch_type" value={form.branch_type} onChange={handleChange} className="input">
                  <option value="branch">🏢 Filial</option>
                  <option value="pickup_point">📦 Azərpoçt məntəqəsi</option>
                </select>
              </div>

              <div>
                <label className="label">Ad</label>
                <input name="name" type="text" className="input" placeholder="Nəsimi filialı"
                  value={form.name} onChange={handleChange} required />
              </div>

              <div>
                <label className="label">Ünvan</label>
                <input name="address" type="text" className="input" placeholder="Küç. 92, Nəsimi r."
                  value={form.address} onChange={handleChange} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Telefon</label>
                  <input name="phone" type="text" className="input" placeholder="+994 12 310 07 09"
                    value={form.phone} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">Azərpoçt kodu</label>
                  <input name="azpost_code" type="text" className="input font-mono" placeholder="AZ1073"
                    value={form.azpost_code} onChange={handleChange} />
                </div>
              </div>

              {/* Coordinates */}
              <div>
                <label className="label">Koordinatlar (geolokasiya)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input name="lat" type="number" step="0.0000001" className="input font-mono"
                      placeholder="40.3777000" value={form.lat} onChange={handleChange} />
                    <p className="text-xs text-gray-400 mt-1">Enlik (Latitude)</p>
                  </div>
                  <div>
                    <input name="lng" type="number" step="0.0000001" className="input font-mono"
                      placeholder="49.8534000" value={form.lng} onChange={handleChange} />
                    <p className="text-xs text-gray-400 mt-1">Uzunluq (Longitude)</p>
                  </div>
                </div>
                {form.lat && form.lng && (
                  <a href={`https://www.google.com/maps?q=${form.lat},${form.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-brand-600 hover:underline mt-1 inline-flex items-center gap-1">
                    <MapPin size={11} /> Xəritədə yoxla
                  </a>
                )}
              </div>

              {/* Working hours */}
              <div>
                <label className="label">İş saatları — Bazar ertəsi–Cümə</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input name="wh_mf_customer" type="text" className="input" placeholder="10:00-19:00"
                      value={form.wh_mf_customer} onChange={handleChange} />
                    <p className="text-xs text-gray-400 mt-1">Müştəri xidməti</p>
                  </div>
                  <div>
                    <input name="wh_mf_warehouse" type="text" className="input" placeholder="10:00-21:00"
                      value={form.wh_mf_warehouse} onChange={handleChange} />
                    <p className="text-xs text-gray-400 mt-1">Anbar xidməti</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="label">İş saatları — Şənbə</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input name="wh_sat_customer" type="text" className="input" placeholder="10:00-16:00"
                      value={form.wh_sat_customer} onChange={handleChange} />
                    <p className="text-xs text-gray-400 mt-1">Müştəri xidməti</p>
                  </div>
                  <div>
                    <input name="wh_sat_warehouse" type="text" className="input" placeholder="10:00-18:00"
                      value={form.wh_sat_warehouse} onChange={handleChange} />
                    <p className="text-xs text-gray-400 mt-1">Anbar xidməti</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Sıralama</label>
                  <input name="sort_order" type="number" min="0" className="input"
                    value={form.sort_order} onChange={handleChange} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="is_active" checked={form.is_active}
                      onChange={handleChange} className="w-4 h-4 rounded accent-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Aktivdir</span>
                  </label>
                </div>
              </div>

              {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Ləğv et</button>
                <button type="submit" className="btn-primary flex-1" disabled={loading || success}>
                  {success ? <><CheckCircle2 size={16} /> Saxlanıldı</> :
                   loading ? <><Loader2 size={16} className="animate-spin" /> Saxlanır...</> :
                   editing ? 'Yadda saxla' : 'Yarat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
