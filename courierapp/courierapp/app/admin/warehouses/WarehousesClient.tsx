'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Warehouse, X, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Country { id: string; code: string; name_ru: string }
interface WarehouseRow {
  id: string
  country_id: string
  name: string
  address_line1: string
  city: string
  zip: string
  phone: string
  email: string | null
  is_origin: boolean
  is_active: boolean
  countries?: { name_ru: string; code: string }
}

const emptyForm = {
  country_id: '',
  name: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
  email: '',
  is_origin: true,
  is_active: true,
}

export default function WarehousesClient({
  warehouses: initial,
  countries,
}: {
  warehouses: WarehouseRow[]
  countries: Country[]
}) {
  const supabase = createClient()
  const [warehouses, setWarehouses] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<WarehouseRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setError(null)
    setSuccess(false)
    setShowModal(true)
  }

  function openEdit(w: WarehouseRow) {
    setEditing(w)
    setForm({
      country_id:   w.country_id,
      name:         w.name,
      address_line1:w.address_line1,
      address_line2:'',
      city:         w.city,
      state:        '',
      zip:          w.zip,
      phone:        w.phone,
      email:        w.email ?? '',
      is_origin:    w.is_origin,
      is_active:    w.is_active,
    })
    setError(null)
    setSuccess(false)
    setShowModal(true)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      country_id:    form.country_id,
      name:          form.name,
      address_line1: form.address_line1,
      address_line2: form.address_line2 || null,
      city:          form.city,
      state:         form.state || null,
      zip:           form.zip,
      phone:         form.phone,
      email:         form.email || null,
      is_origin:     form.is_origin,
      is_active:     form.is_active,
    }

    if (editing) {
      const { error: err } = await supabase.from('warehouses').update(payload).eq('id', editing.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase.from('warehouses').insert(payload)
      if (err) { setError(err.message); setLoading(false); return }
    }

    // Refresh list
    const { data } = await supabase
      .from('warehouses')
      .select('*, countries(name_ru, code)')
      .order('created_at', { ascending: false })
    setWarehouses(data ?? [])
    setSuccess(true)
    setLoading(false)
    setTimeout(() => setShowModal(false), 800)
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить склад?')) return
    await supabase.from('warehouses').delete().eq('id', id)
    setWarehouses(prev => prev.filter(w => w.id !== id))
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Склады</h1>
          <p className="text-gray-500 text-sm mt-0.5">Управление складами по странам</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Добавить склад
        </button>
      </div>

      {warehouses.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Warehouse size={24} className="text-gray-400" />
          </div>
          <p className="font-medium text-gray-900 mb-1">Складов пока нет</p>
          <p className="text-gray-500 text-sm mb-4">Добавьте первый склад чтобы начать работу</p>
          <button onClick={openCreate} className="btn-primary mx-auto">
            <Plus size={16} /> Добавить склад
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {warehouses.map(w => (
            <div key={w.id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                  <Warehouse size={18} className="text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{w.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono">
                      {w.countries?.code}
                    </span>
                    {w.is_origin && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Отправка</span>
                    )}
                    {!w.is_active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">Неактивен</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{w.address_line1}, {w.city}, {w.zip}</p>
                  <p className="text-xs text-gray-400">{w.phone}{w.email ? ` · ${w.email}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(w)} className="btn-ghost p-2">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(w.id)} className="btn-ghost p-2 hover:text-red-600 hover:bg-red-50">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? 'Редактировать склад' : 'Новый склад'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="label">Страна</label>
                <select name="country_id" value={form.country_id} onChange={handleChange} className="input" required>
                  <option value="">Выберите страну</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.name_ru} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Название склада</label>
                <input name="name" type="text" className="input" placeholder="Склад США — Нью-Йорк"
                  value={form.name} onChange={handleChange} required />
              </div>

              <div>
                <label className="label">Адрес (строка 1)</label>
                <input name="address_line1" type="text" className="input" placeholder="123 Main St"
                  value={form.address_line1} onChange={handleChange} required />
              </div>

              <div>
                <label className="label">Адрес (строка 2, необязательно)</label>
                <input name="address_line2" type="text" className="input" placeholder="Suite 100"
                  value={form.address_line2} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Город</label>
                  <input name="city" type="text" className="input" placeholder="New York"
                    value={form.city} onChange={handleChange} required />
                </div>
                <div>
                  <label className="label">ZIP / Индекс</label>
                  <input name="zip" type="text" className="input" placeholder="10001"
                    value={form.zip} onChange={handleChange} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Телефон</label>
                  <input name="phone" type="text" className="input" placeholder="+1 212 000 0000"
                    value={form.phone} onChange={handleChange} required />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input name="email" type="email" className="input" placeholder="warehouse@example.com"
                    value={form.email} onChange={handleChange} />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="is_origin" checked={form.is_origin}
                    onChange={handleChange} className="w-4 h-4 rounded accent-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Склад отправки</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="is_active" checked={form.is_active}
                    onChange={handleChange} className="w-4 h-4 rounded accent-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Активен</span>
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Отмена
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={loading || success}>
                  {success ? <><CheckCircle2 size={16} /> Сохранено</> :
                   loading ? <><Loader2 size={16} className="animate-spin" /> Сохранение...</> :
                   editing ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}