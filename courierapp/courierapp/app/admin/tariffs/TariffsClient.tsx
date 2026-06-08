'use client'

import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, DollarSign, X, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const COUNTRY_ORDER = ['US', 'CA', 'DE', 'ES', 'GB', 'TR', 'CN', 'AZ']
const COUNTRY_NAMES: Record<string, string> = { US:'США', CA:'Канада', DE:'Германия', GB:'Великобритания', ES:'Испания', TR:'Турция', CN:'Китай', AZ:'Азербайджан' }
const CURRENCY_SYMBOLS: Record<string, string> = { USD:'$', EUR:'€', GBP:'£', AZN:'₼' }
const ALL_CATEGORIES = [
  { value: 'standard',  label: 'Standart',             emoji: '📦' },
  { value: 'liquid',    label: 'Maye (жидкость)',       emoji: '💧' },
  { value: 'fragile',   label: 'Qırılgan (хрупкое)',    emoji: '🫙' },
  { value: 'oversized', label: 'Həcmli (негабарит)',    emoji: '📐' },
]

interface Warehouse { id: string; name: string; countries?: { name_ru: string; code: string } }
interface Trigger { id: string; code: string; name_ru: string; is_active: boolean }
interface Tariff {
  id: string; warehouse_id: string; name: string; price_per_kg: number
  volumetric_divisor: number; min_charge: number; currency: string; is_active: boolean
  weight_from: number; weight_to: number | null; calculation_type: string
  trigger_id: string | null; date_from: string | null; date_to: string | null
  price_type: string; price_azn: number | null; cargo_category: string
  warehouses?: { name: string; countries?: { name_ru: string; code: string } }
  tariff_triggers?: { name_ru: string; code: string }
}

const emptyForm = {
  warehouse_id: '', name: '', price_per_kg: '', volumetric_divisor: '5000',
  min_charge: '0', currency: 'USD', is_active: true,
  weight_from: '0', weight_to: '', calculation_type: 'flat',
  trigger_id: '', date_from: '', date_to: '',
  price_type: 'fixed', price_azn: '', cargo_category: 'standard',
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
  const [filterCountry, setFilterCountry] = useState('US')
  const [filterCategory, setFilterCategory] = useState('all')

  // Countries sorted by COUNTRY_ORDER
  const countries = useMemo(() => {
    const seen = new Set()
    const list = warehouses.filter(w => {
      const code = w.countries?.code
      if (!code || seen.has(code)) return false
      seen.add(code); return true
    }).map(w => ({ code: w.countries!.code, name: w.countries!.name_ru }))
    return list.sort((a, b) => {
      const ai = COUNTRY_ORDER.indexOf(a.code)
      const bi = COUNTRY_ORDER.indexOf(b.code)
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
  }, [warehouses])

  // Categories available for selected country
  const availableCategories = useMemo(() => {
    const cats = new Set(
      tariffs
        .filter(t => t.warehouses?.countries?.code === filterCountry)
        .map(t => t.cargo_category)
    )
    return ALL_CATEGORIES.filter(c => cats.has(c.value))
  }, [tariffs, filterCountry])

  // Reset category filter when country changes
  function handleCountryChange(code: string) {
    setFilterCountry(code)
    setFilterCategory('all')
  }

  // Filtered + sorted tariffs
  const filtered = useMemo(() => {
    return tariffs
      .filter(t => t.warehouses?.countries?.code === filterCountry)
      .filter(t => filterCategory === 'all' || t.cargo_category === filterCategory)
      .sort((a, b) => (a.weight_from ?? 0) - (b.weight_from ?? 0))
  }, [tariffs, filterCountry, filterCategory])

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
      price_type: t.price_type ?? 'fixed',
      price_azn: t.price_azn != null ? String(t.price_azn) : '',
      cargo_category: t.cargo_category ?? 'standard',
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
      price_type: form.price_type,
      price_azn: form.price_azn ? parseFloat(form.price_azn) : null,
      cargo_category: form.cargo_category,
    }
    if (editing) {
      const { error: err } = await supabase.from('tariffs').update(payload).eq('id', editing.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase.from('tariffs').insert(payload)
      if (err) { setError(err.message); setLoading(false); return }
    }
    const { data } = await supabase.from('tariffs')
      .select('*, warehouses(name, countries(name_ru, code)), tariff_triggers(name_ru, code)')
      .order('weight_from')
    setTariffs(data ?? []); setSuccess(true); setLoading(false)
    setTimeout(() => setShowModal(false), 800)
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить тариф?')) return
    await supabase.from('tariffs').delete().eq('id', id)
    setTariffs(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Тарифы</h1>
          <p className="text-gray-500 text-sm mt-0.5">Настройка стоимости доставки по направлениям</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Добавить тариф</button>
      </div>

      {/* Country tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-3 sticky top-0 z-10 bg-gray-50 pt-2 -mx-6 px-6">
        {countries.map(c => (
          <button key={c.code}
            onClick={() => handleCountryChange(c.code)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
              filterCountry === c.code
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600'
            }`}
          >
            <img src={`https://flagcdn.com/20x15/${c.code.toLowerCase()}.png`} width="20" height="15" alt={c.code} className="rounded-sm" />
            <span>{COUNTRY_NAMES[c.code] ?? c.name}</span>
          </button>
        ))}
      </div>

      {/* Category tabs — shown only if more than 1 category exists for this country */}
      {availableCategories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 sticky top-12 z-10 bg-gray-50 -mx-6 px-6">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              filterCategory === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            Все категории
          </button>
          {availableCategories.map(c => (
            <button key={c.value}
              onClick={() => setFilterCategory(c.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                filterCategory === c.value
                  ? 'bg-gray-800 text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              <span>{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="card p-3 mb-4 bg-blue-50 border-blue-100">
        <p className="text-xs text-blue-700">
          При наступлении триггера система ищет подходящие тарифы по дате и весу и применяет <strong>минимальный</strong>. После фиксации тариф меняется только вручную.
          <span className="ml-2 text-blue-500">{filtered.length} тарифов</span>
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <DollarSign size={24} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Тарифов нет</p>
          <button onClick={openCreate} className="btn-primary mt-4 mx-auto"><Plus size={16}/> Добавить</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Название','Категория','Вес (кг)','Тип цены','Цена','AZN ₼','Расчёт','Триггер','Период','Статус',''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-3 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const sym = CURRENCY_SYMBOLS[t.currency] ?? t.currency
                  const cat = ALL_CATEGORIES.find(c => c.value === t.cargo_category)
                  return (
                    <tr key={t.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i === filtered.length-1 ? 'border-0':''}`}>
                      <td className="px-3 py-2.5 text-sm font-medium text-gray-900">{t.name}</td>
                      <td className="px-3 py-2.5">
                        <span className={`badge text-xs ${
                          t.cargo_category === 'liquid' ? 'bg-blue-50 text-blue-700' :
                          t.cargo_category === 'fragile' ? 'bg-orange-50 text-orange-700' :
                          t.cargo_category === 'oversized' ? 'bg-purple-50 text-purple-700' :
                          'bg-gray-100 text-gray-600'}`}>
                          {cat?.emoji} {cat?.label ?? t.cargo_category}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-sm font-mono text-gray-600 whitespace-nowrap">
                        {t.weight_from ?? 0} — {t.weight_to != null ? t.weight_to : '∞'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`badge text-xs ${t.price_type === 'per_kg' ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700'}`}>
                          {t.price_type === 'per_kg' ? 'За кг' : 'Фиксир.'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">{sym}{t.price_per_kg}</span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {t.price_azn != null ? <span className="text-sm font-bold text-gray-900">₼{t.price_azn}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="badge text-xs bg-gray-100 text-gray-600">
                          {t.calculation_type === 'progressive' ? 'Ступенч.' : 'Единая'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {t.tariff_triggers
                          ? <span className="badge bg-amber-50 text-amber-700 text-xs">{t.tariff_triggers.name_ru}</span>
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-400 font-mono whitespace-nowrap">
                        {t.date_from ?? '—'}<br/>{t.date_to ?? '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`badge ${t.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {t.is_active ? 'Активен' : 'Нет'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(t)} className="btn-ghost p-1.5"><Pencil size={13}/></button>
                          <button onClick={() => handleDelete(t.id)} className="btn-ghost p-1.5 hover:text-red-600 hover:bg-red-50"><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
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
                  {[...warehouses].sort((a, b) => {
                    const ai = COUNTRY_ORDER.indexOf(a.countries?.code ?? '')
                    const bi = COUNTRY_ORDER.indexOf(b.countries?.code ?? '')
                    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
                  }).map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.countries?.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Название тарифа</label>
                  <input name="name" type="text" className="input" placeholder="Standart" value={form.name} onChange={handleChange} required />
                </div>
                <div>
                  <label className="label">Категория груза</label>
                  <select name="cargo_category" value={form.cargo_category} onChange={handleChange} className="input">
                    {ALL_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Диапазон веса (кг)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input name="weight_from" type="number" step="0.001" min="0" className="input" placeholder="0.001" value={form.weight_from} onChange={handleChange} required />
                    <p className="text-xs text-gray-400 mt-1">От (кг)</p>
                  </div>
                  <div>
                    <input name="weight_to" type="number" step="0.001" min="0" className="input" placeholder="пусто = ∞" value={form.weight_to} onChange={handleChange} />
                    <p className="text-xs text-gray-400 mt-1">До (кг)</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Тип цены</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ value: 'fixed', label: 'Фиксированная', desc: 'За весь диапазон' }, { value: 'per_kg', label: 'За каждый кг', desc: 'Цена × вес' }].map(opt => (
                    <label key={opt.value} className="flex items-start gap-2 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="price_type" value={opt.value} checked={form.price_type === opt.value} onChange={handleChange} className="mt-0.5 accent-blue-600" />
                      <div><p className="text-sm font-medium text-gray-900">{opt.label}</p><p className="text-xs text-gray-400">{opt.desc}</p></div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Цена</label>
                  <input name="price_per_kg" type="number" step="0.001" min="0" className="input" placeholder="5.750" value={form.price_per_kg} onChange={handleChange} required />
                </div>
                <div>
                  <label className="label">Валюта</label>
                  <select name="currency" value={form.currency} onChange={handleChange} className="input">
                    <option value="USD">USD $</option><option value="EUR">EUR €</option>
                    <option value="GBP">GBP £</option><option value="AZN">AZN ₼</option>
                  </select>
                </div>
                <div>
                  <label className="label">AZN ₼</label>
                  <input name="price_azn" type="number" step="0.001" min="0" className="input" placeholder="9.790" value={form.price_azn} onChange={handleChange} />
                </div>
              </div>
              <div>
                <label className="label">Тип расчёта</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ value: 'flat', title: 'Единая ставка', desc: '7 кг × $4 = $28' }, { value: 'progressive', title: 'Ступенчатый', desc: '5×$6 + 2×$4 = $38' }].map(opt => (
                    <label key={opt.value} className="flex items-start gap-2 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="calculation_type" value={opt.value} checked={form.calculation_type === opt.value} onChange={handleChange} className="mt-0.5 accent-blue-600" />
                      <div><p className="text-sm font-medium text-gray-900">{opt.title}</p><p className="text-xs text-gray-400">{opt.desc}</p></div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Объёмный делитель</label><input name="volumetric_divisor" type="number" min="1" className="input" placeholder="5000" value={form.volumetric_divisor} onChange={handleChange} required /></div>
                <div><label className="label">Минимальная сумма</label><input name="min_charge" type="number" step="0.001" min="0" className="input" placeholder="0" value={form.min_charge} onChange={handleChange} required /></div>
              </div>
              <div>
                <label className="label">Событие-триггер</label>
                <select name="trigger_id" value={form.trigger_id} onChange={handleChange} className="input">
                  <option value="">Без триггера</option>
                  {triggers.filter(t => t.is_active).map(t => <option key={t.id} value={t.id}>{t.name_ru}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Период действия</label>
                <div className="grid grid-cols-2 gap-3">
                  <div><input name="date_from" type="date" className="input" value={form.date_from} onChange={handleChange} /><p className="text-xs text-gray-400 mt-1">С</p></div>
                  <div><input name="date_to" type="date" className="input" value={form.date_to} onChange={handleChange} /><p className="text-xs text-gray-400 mt-1">По</p></div>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm font-medium text-gray-700">Активен</span>
              </label>
              {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Отмена</button>
                <button type="submit" className="btn-primary flex-1" disabled={loading || success}>
                  {success ? <><CheckCircle2 size={16}/> Сохранено</> : loading ? <><Loader2 size={16} className="animate-spin"/> Сохранение...</> : editing ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
