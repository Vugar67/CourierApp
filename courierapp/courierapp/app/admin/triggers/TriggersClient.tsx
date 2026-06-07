'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Zap, X, Loader2, CheckCircle2, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Trigger {
  id: string
  code: string
  name_ru: string
  name_az: string
  name_en: string
  description_ru: string | null
  is_system: boolean
  is_active: boolean
  sort_order: number
}

const emptyForm = {
  code: '',
  name_ru: '',
  name_az: '',
  name_en: '',
  description_ru: '',
  is_active: true,
  sort_order: '10',
}

export default function TriggersClient({ triggers: initial }: { triggers: Trigger[] }) {
  const supabase = createClient()
  const [triggers, setTriggers] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Trigger | null>(null)
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

  function openEdit(t: Trigger) {
    setEditing(t)
    setForm({
      code:          t.code,
      name_ru:       t.name_ru,
      name_az:       t.name_az,
      name_en:       t.name_en,
      description_ru:t.description_ru ?? '',
      is_active:     t.is_active,
      sort_order:    String(t.sort_order),
    })
    setError(null)
    setSuccess(false)
    setShowModal(true)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
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
      code:          form.code.toLowerCase().replace(/\s+/g, '_'),
      name_ru:       form.name_ru,
      name_az:       form.name_az,
      name_en:       form.name_en,
      description_ru:form.description_ru || null,
      is_active:     form.is_active,
      sort_order:    parseInt(form.sort_order) || 10,
      is_system:     false,
    }

    if (editing) {
      const { error: err } = await supabase
        .from('tariff_triggers')
        .update({ ...payload, code: editing.is_system ? editing.code : payload.code })
        .eq('id', editing.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase.from('tariff_triggers').insert(payload)
      if (err) { setError(err.message); setLoading(false); return }
    }

    const { data } = await supabase.from('tariff_triggers').select('*').order('sort_order')
    setTriggers(data ?? [])
    setSuccess(true)
    setLoading(false)
    setTimeout(() => setShowModal(false), 800)
  }

  async function handleToggle(t: Trigger) {
    if (t.is_system) return
    await supabase.from('tariff_triggers').update({ is_active: !t.is_active }).eq('id', t.id)
    setTriggers(prev => prev.map(x => x.id === t.id ? { ...x, is_active: !x.is_active } : x))
  }

  async function handleDelete(t: Trigger) {
    if (t.is_system) return
    if (!confirm('Удалить триггер?')) return
    await supabase.from('tariff_triggers').delete().eq('id', t.id)
    setTriggers(prev => prev.filter(x => x.id !== t.id))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Справочник триггеров</h1>
          <p className="text-gray-500 text-sm mt-0.5">События для применения тарифов</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Добавить триггер
        </button>
      </div>

      {/* Info */}
      <div className="card p-4 mb-6 bg-amber-50 border-amber-100">
        <p className="text-sm text-amber-800 font-medium mb-1">Как работают триггеры</p>
        <p className="text-xs text-amber-700">
          Триггер определяет в какой момент жизни посылки фиксируется тариф.
          Системные триггеры нельзя удалить или изменить код — только название и описание.
        </p>
      </div>

      <div className="space-y-2">
        {triggers.map(t => (
          <div key={t.id} className={`card p-4 flex items-center justify-between ${!t.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.is_system ? 'bg-blue-50' : 'bg-purple-50'}`}>
                {t.is_system
                  ? <Lock size={16} className="text-blue-600" />
                  : <Zap size={16} className="text-purple-600" />
                }
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{t.name_ru}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-mono">{t.code}</span>
                  {t.is_system && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Системный</span>
                  )}
                  {!t.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Неактивен</span>
                  )}
                </div>
                {t.description_ru && (
                  <p className="text-xs text-gray-500 mt-0.5">{t.description_ru}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5 font-mono">
                  {t.name_az} · {t.name_en}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => openEdit(t)}
                className="btn-ghost p-2"
                title="Редактировать"
              >
                <Pencil size={15} />
              </button>
              {!t.is_system && (
                <>
                  <button
                    onClick={() => handleToggle(t)}
                    className={`btn-ghost p-2 text-xs ${t.is_active ? 'hover:text-amber-600' : 'hover:text-green-600'}`}
                    title={t.is_active ? 'Деактивировать' : 'Активировать'}
                  >
                    {t.is_active ? '⏸' : '▶'}
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="btn-ghost p-2 hover:text-red-600 hover:bg-red-50"
                    title="Удалить"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">
                {editing ? (editing.is_system ? 'Редактировать системный триггер' : 'Редактировать триггер') : 'Новый триггер'}
              </h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Code — только для несистемных */}
              {(!editing || !editing.is_system) && (
                <div>
                  <label className="label">Код триггера</label>
                  <input name="code" type="text" className="input font-mono"
                    placeholder="custom_event"
                    value={form.code} onChange={handleChange} required
                    disabled={!!editing}
                  />
                  <p className="text-xs text-gray-400 mt-1">Латиница, цифры и подчёркивание. Не изменяется после создания.</p>
                </div>
              )}

              {editing?.is_system && (
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-xs text-blue-700">
                    <strong>Системный триггер.</strong> Код изменить нельзя: <span className="font-mono">{editing.code}</span>
                  </p>
                </div>
              )}

              <div>
                <label className="label">Название (RU)</label>
                <input name="name_ru" type="text" className="input" placeholder="Приёмка на складе"
                  value={form.name_ru} onChange={handleChange} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Название (AZ)</label>
                  <input name="name_az" type="text" className="input" placeholder="Anbarda qəbul"
                    value={form.name_az} onChange={handleChange} required />
                </div>
                <div>
                  <label className="label">Название (EN)</label>
                  <input name="name_en" type="text" className="input" placeholder="Warehouse received"
                    value={form.name_en} onChange={handleChange} required />
                </div>
              </div>

              <div>
                <label className="label">Описание (RU)</label>
                <textarea name="description_ru" className="input resize-none" rows={2}
                  placeholder="Когда применяется этот триггер..."
                  value={form.description_ru} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Порядок сортировки</label>
                  <input name="sort_order" type="number" min="0" className="input"
                    value={form.sort_order} onChange={handleChange} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="is_active" checked={form.is_active}
                      onChange={handleChange} className="w-4 h-4 rounded accent-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Активен</span>
                  </label>
                </div>
              </div>

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
