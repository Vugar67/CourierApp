'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, DollarSign, X, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Warehouse {
  id: string
  name: string
  countries?: { name_ru: string; code: string }
}

interface Tariff {
  id: string
  warehouse_id: string
  name: string
  price_per_kg: number
  volumetric_divisor: number
  min_charge: number
  currency: string
  is_active: boolean
  warehouses?: { name: string; countries?: { name_ru: string; code: string } }
}

const emptyForm = {
  warehouse_id: '',
  name: '',
  price_per_kg: '',
  volumetric_divisor: '5000',
  min_charge: '0',
  currency: 'USD',
  is_active: true,
}

export default function TariffsClient({
  tariffs: initial,
  warehouses,
}: {
  tariffs: Tariff[]
  warehouses: Warehouse[]
}) {
  const supabase = createClient()
  const [tariffs, setTariffs] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Tariff | null>(null)
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

  function openEdit(t: Tariff) {
    setEditing(t)
    setForm({
      warehouse_id:       t.warehouse_id,
      name:               t.name,
      price_per_kg:       String(t.price_per_kg),
      volumetric_divisor: String(t.volumetric_divisor),
      min_charge:         String(t.min_charge),
      currency:           t.currency,
      is_active:          t.is_active,
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
      warehouse_id:       form.warehouse_id,
      name:               form.name,
      price_per_kg:       parseFloat(form.price_per_kg),
      volumetric_divisor: parseInt(form.volumetric_divisor),
      min_charge:         parseFloat(form.min_charge),
      currency:           form.currency,
      is_active:          form.is_active,
    }

    if (editing) {
      const { error: err } = await supabase.from('tariffs').update(payload).eq('id', editing.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase.from('tariffs').insert(payload)
      if (err) { setError(err.message); setLoading(false); return }
    }

    const { data } = await supabase
      .from('tariffs')
      .select('*, warehouses(name, countries(name_ru, code))')
      .order('created_at', { ascending: false })
    setTariffs(data ?? [])
    setSuccess(true)
    setLoading(false)
    setTimeout(() => setShowModal(false), 800)
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить тариф?')) return
    await supabase.from('tariffs').delete().eq('id', id)
    setTariffs(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Тарифы</h1>
          <p className="text-gray-500 text-sm mt-0.5">Настройка стоимости доставки по направлениям</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Добавить тариф
        </button>
      </div>

      {/* Formula hint */}
      <div className="card p-4 mb-6 bg-blue-50 border-blue-100">
        <p className="text-sm text-blue-800 font-medium mb-1">Формула расчёта</p>
        <p className="text-xs text-blue-700 font-mono">
          Стоимость = max(фактический вес, объёмный вес) × цена за кг<br/>
          Объёмный вес = (Д × Ш × В) / делитель
        </p>
      </div>

      {tariffs.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <DollarSign size={24} className="text-gray-400" />
          </div>
          <p className="font-medium text-gray-900 mb-1">Тарифов пока нет</p>
          <p className="text-gray-500 text-sm mb-4">Сначала добавьте склады, затем создайте тарифы</p>
          <button onClick={openCreate} className="btn-primary mx-auto">
            <Plus size={16} /> Добавить тариф
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Склад</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Название</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Цена/кг</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Делитель</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Мин. сумма</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">Статус</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {tariffs.map((t, i) => (
                <tr key={t.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i === tariffs.length - 1 ? 'border-0' : ''}`}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.warehouses?.name}</p>
                      <p className="text-xs text-gray-400">{t.warehouses?.countries?.name_ru}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.name}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-gray-900">{t.price_per_kg}</span>
                    <span className="text-xs text-gray-400 ml-1">{t.currency}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600 font-mono">{t.volumetric_divisor}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">{t.min_charge} {t.currency}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`badge ${t.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {t.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(t)} className="btn-ghost p-1.5">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="btn-ghost p-1.5 hover:text-red-600 hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? 'Редактировать тариф' : 'Новый тариф'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="label">Склад</label>
                <select name="warehouse_id" value={form.warehouse_id} onChange={handleChange} className="input" required>
                  <option value="">Выберите склад</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.countries?.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Название тарифа</label>
                <input name="name" type="text" className="input" placeholder="Стандарт"
                  value={form.name} onChange={handleChange} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Цена за кг</label>
                  <input name="price_per_kg" type="number" step="0.01" min="0" className="input"
                    placeholder="8.00" value={form.price_per_kg} onChange={handleChange} required />
                </div>
                <div>
                  <label className="label">Валюта</label>
                  <select name="currency" value={form.currency} onChange={handleChange} className="input">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="AZN">AZN</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Объёмный делитель</label>
                  <input name="volumetric_divisor" type="number" min="1" className="input"
                    placeholder="5000" value={form.volumetric_divisor} onChange={handleChange} required />
                </div>
                <div>
                  <label className="label">Минимальная сумма</label>
                  <input name="min_charge" type="number" step="0.01" min="0" className="input"
                    placeholder="0" value={form.min_charge} onChange={handleChange} required />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_active" checked={form.is_active}
                  onChange={handleChange} className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm font-medium text-gray-700">Активен</span>
              </label>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Отмена</button>
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