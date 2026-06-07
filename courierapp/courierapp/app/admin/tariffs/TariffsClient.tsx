'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, DollarSign, X, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Warehouse { id: string; name: string; countries?: { name_ru: string; code: string } }
interface Trigger { id: string; code: string; name_ru: string; is_active: boolean }
interface Tariff {
  id: string; warehouse_id: string; name: string; price_per_kg: number
  volumetric_divisor: number; min_charge: number; currency: string; is_active: boolean
  weight_from: number; weight_to: number | null; calculation_type: string
  trigger_id: string | null; date_from: string | null; date_to: string | null
  warehouses?: { name: string; countries?: { name_ru: string; code: string } }
  tariff_triggers?: { name_ru: string; code: string }
}

const emptyForm = {
  warehouse_id: '', name: '', price_per_kg: '', volumetric_divisor: '5000',
  min_charge: '0', currency: 'USD', is_active: true,
  weight_from: '0', weight_to: '', calculation_type: 'flat',
  trigger_id: '', date_from: '', date_to: '',
}

export default function TariffsClient({ tariffs: initial, warehouses, triggers }: {
  tariffs: Tariff[]; warehouses: Warehouse[]; triggers: Trigger[]
}) {
  const supabase = createClient()
  const [tariffs, setTariffs] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Tariff | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openCreate() { setEditing(null); setForm(emptyForm); setError(null); setSuccess(false); setShowModal(true) }

  function openEdit(t: Tariff) {
    setEditing(t)
    setForm({
      warehouse_id: t.warehouse_id, name: t.name, price_per_kg: String(t.price_per_kg),
      volumetric_divisor: String(t.volumetric_divisor), min_charge: String(t.min_charge),
      currency: t.currency, is_active: t.is_active,
      weight_from: String(t.weight_from ?? 0), weight_to: t.weight_to != null ? String(t.weight_to) : '',
      calculation_type: t.calculation_type ?? 'flat',
      trigger_id: t.trigger_id ?? '', date_from: t.date_from ?? '', date_to: t.date_to ?? '',
    })
    setError(null); setSuccess(false); setShowModal(true)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null)
    const payload = {
      warehouse_id: form.warehouse_id, name: form.name,
      price_per_kg: parseFloat(form.price_per_kg),
      volumetric_divisor: parseInt(form.volumetric_divisor),
      min_charge: parseFloat(form.min_charge), currency: form.currency, is_active: form.is_active,
      weight_from: parseFloat(form.weight_from) || 0,
      weight_to: form.weight_to ? parseFloat(form.weight_to) : null,
      calculation_type: form.calculation_type,
      trigger_id: form.trigger_id || null,
      date_from: form.date_from || null, date_to: form.date_to || null,
    }
    if (editing) {
      const { error: err } = await supabase.from('tariffs').update(payload).eq('id', editing.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase.from('tariffs').insert(payload)
      if (err) { setError(err.message); setLoading(false); return }
    }
    const { data } = await supabase.from('tariffs').select('*, warehouses(name, countries(name_ru, code)), tariff_triggers(name_ru, code)').order('created_at', { ascending: false })
    setTariffs(data ?? []); setSuccess(true); setLoading(false)
    setTimeout(() => setShowModal(false), 800)
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить тариф?')) return
    await supabase.from('tariffs').delete().eq('id', id)
    setTariffs(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Тарифы</h1>
          <p className="text-gray-500 text-sm mt-0.5">Настройка стоимости доставки по направлениям</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Добавить тариф</button>
      </div>

      <div className="card p-4 mb-6 bg-blue-50 border-blue-100">
        <p className="text-sm text-blue-800 font-medium mb-1">Логика применения тарифа</p>
        <p className="text-xs text-blue-700">
          При наступлении события-триггера система ищет все подходящие тарифы (по дате события и весу посылки) и применяет <strong>минимальный</strong>.
          После фиксации тариф не меняется автоматически — только вручную администратором.
          Если подходящий тариф не найден — отправляется алерт администратору.
        </p>
      </div>

      {tariffs.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <DollarSign size={24} className="text-gray-400" />
          </div>
          <p className="font-medium text-gray-900 mb-1">Тарифов пока нет</p>
          <button onClick={openCreate} className="btn-primary mt-4 mx-auto"><Plus size={16} /> Добавить тариф</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Склад','Название','Вес (кг)','Цена/кг','Расчёт','Триггер','Период','Мин.сумма','Статус',''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-3 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tariffs.map((t, i) => (
                  <tr key={t.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i === tariffs.length-1 ? 'border-0':''}`}>
                    <td className="px-3 py-3">
                      <p className="text-sm font-medium text-gray-900">{t.warehouses?.name}</p>
                      <p className="text-xs text-gray-400">{t.warehouses?.countries?.name_ru}</p>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-700">{t.name}</td>
                    <td className="px-3 py-3 text-sm font-mono text-gray-600">
                      {t.weight_from ?? 0} — {t.weight_to != null ? t.weight_to : '∞'}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-sm font-semibold text-gray-900">{t.price_per_kg}</span>
                      <span className="text-xs text-gray-400 ml-1">{t.currency}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`badge text-xs ${t.calculation_type === 'progressive' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {t.calculation_type === 'progressive' ? 'Ступенчато' : 'Единая'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {t.tariff_triggers ? (
                        <span className="badge bg-amber-50 text-amber-700 text-xs">{t.tariff_triggers.name_ru}</span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 font-mono">
                      {t.date_from ? t.date_from : '—'}<br/>
                      {t.date_to ? t.date_to : '—'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{t.min_charge} {t.currency}</td>
                    <td className="px-3 py-3">
                      <span className={`badge ${t.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {t.is_active ? 'Активен' : 'Нет'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(t)} className="btn-ghost p-1.5"><Pencil size={14}/></button>
                        <button onClick={() => handleDelete(t.id)} className="btn-ghost p-1.5 hover:text-red-600 hover:bg-red-50"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? 'Редактировать тариф' : 'Новый тариф'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              <div>
                <label className="label">Склад</label>
                <select name="warehouse_id" value={form.warehouse_id} onChange={handleChange} className="input" required>
                  <option value="">Выберите склад</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.countries?.code})</option>)}
                </select>
              </div>

              <div>
                <label className="label">Название тарифа</label>
                <input name="name" type="text" className="input" placeholder="Стандарт 0–5 кг"
                  value={form.name} onChange={handleChange} required />
              </div>

              {/* Weight range */}
              <div>
                <label className="label">Диапазон веса (кг)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input name="weight_from" type="number" step="0.001" min="0" className="input"
                      placeholder="0.000" value={form.weight_from} onChange={handleChange} required />
                    <p className="text-xs text-gray-400 mt-1">От (кг)</p>
                  </div>
                  <div>
                    <input name="weight_to" type="number" step="0.001" min="0" className="input"
                      placeholder="пусто = ∞" value={form.weight_to} onChange={handleChange} />
                    <p className="text-xs text-gray-400 mt-1">До (кг), пусто = без ограничения</p>
                  </div>
                </div>
              </div>

              {/* Calculation type */}
              <div>
                <label className="label">Тип расчёта</label>
                <div className="space-y-2">
                  {[
                    { value: 'flat', title: 'Единая ставка', desc: 'Весь вес × цена/кг (напр. 7 кг × $4 = $28)' },
                    { value: 'progressive', title: 'Ступенчатый', desc: 'Каждый кг по своей ставке (5×$6 + 2×$4 = $38)' },
                  ].map(opt => (
                    <label key={opt.value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="calculation_type" value={opt.value}
                        checked={form.calculation_type === opt.value} onChange={handleChange}
                        className="mt-0.5 accent-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{opt.title}</p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Цена за кг</label>
                  <input name="price_per_kg" type="number" step="0.001" min="0" className="input"
                    placeholder="8.000" value={form.price_per_kg} onChange={handleChange} required />
                </div>
                <div>
                  <label className="label">Валюта</label>
                  <select name="currency" value={form.currency} onChange={handleChange} className="input">
                    <option value="USD">USD</option><option value="EUR">EUR</option><option value="AZN">AZN</option>
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
                  <input name="min_charge" type="number" step="0.001" min="0" className="input"
                    placeholder="0" value={form.min_charge} onChange={handleChange} required />
                </div>
              </div>

              {/* Trigger */}
              <div>
                <label className="label">Событие-триггер</label>
                <select name="trigger_id" value={form.trigger_id} onChange={handleChange} className="input">
                  <option value="">Без триггера</option>
                  {triggers.filter(t => t.is_active).map(t => (
                    <option key={t.id} value={t.id}>{t.name_ru}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Момент когда тариф фиксируется на посылке</p>
              </div>

              {/* Date range */}
              <div>
                <label className="label">Период действия тарифа</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input name="date_from" type="date" className="input"
                      value={form.date_from} onChange={handleChange} />
                    <p className="text-xs text-gray-400 mt-1">С (дата)</p>
                  </div>
                  <div>
                    <input name="date_to" type="date" className="input"
                      value={form.date_to} onChange={handleChange} />
                    <p className="text-xs text-gray-400 mt-1">По (дата)</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Оставьте пустым если тариф действует бессрочно</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_active" checked={form.is_active}
                  onChange={handleChange} className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm font-medium text-gray-700">Активен</span>
              </label>

              {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Отмена</button>
                <button type="submit" className="btn-primary flex-1" disabled={loading || success}>
                  {success ? <><CheckCircle2 size={16}/> Сохранено</> :
                   loading ? <><Loader2 size={16} className="animate-spin"/> Сохранение...</> :
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
