'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, UserPlus, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    password: '',
    password_confirm: '',
  })
  const [showPwd, setShowPwd]       = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.password !== form.password_confirm) {
      setError('Пароли не совпадают')
      return
    }
    if (form.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
        },
      },
    })

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('Этот email уже зарегистрирован')
      } else {
        setError('Ошибка регистрации. Попробуйте ещё раз.')
      }
      setLoading(false)
      return
    }

    if (data.user) {
      // Create profile
      await supabase.from('profiles').upsert({
        id: data.user.id,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone || null,
        role: 'client',
        language: 'ru',
      })

      // Create deposit account
      await supabase.from('client_deposit').upsert({
        client_id: data.user.id,
        balance: 0,
        currency: 'USD',
      })
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="card-md p-8 text-center animate-slide-up">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-text mb-2">Почти готово!</h2>
        <p className="text-sm text-text-muted mb-6">
          Мы отправили письмо на <strong>{form.email}</strong>.<br />
          Подтвердите email чтобы завершить регистрацию.
        </p>
        <Link href="/auth/login" className="btn-primary w-full justify-center">
          Перейти ко входу
        </Link>
      </div>
    )
  }

  return (
    <div className="card-md p-8 animate-slide-up">
      <h1 className="text-2xl font-bold text-text mb-1">Создать аккаунт</h1>
      <p className="text-sm text-text-muted mb-7">Заполните данные для регистрации</p>

      <form onSubmit={handleRegister} className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="first_name">Имя</label>
            <input
              id="first_name" name="first_name" type="text"
              className="input" placeholder="Иван"
              value={form.first_name} onChange={handleChange} required
            />
          </div>
          <div>
            <label className="label" htmlFor="last_name">Фамилия</label>
            <input
              id="last_name" name="last_name" type="text"
              className="input" placeholder="Иванов"
              value={form.last_name} onChange={handleChange} required
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="label" htmlFor="phone">Телефон</label>
          <input
            id="phone" name="phone" type="tel"
            className="input" placeholder="+994 50 000 00 00"
            value={form.phone} onChange={handleChange}
          />
        </div>

        {/* Email */}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email" name="email" type="email"
            className="input" placeholder="you@example.com"
            value={form.email} onChange={handleChange} required
          />
        </div>

        {/* Password */}
        <div>
          <label className="label" htmlFor="password">Пароль</label>
          <div className="relative">
            <input
              id="password" name="password"
              type={showPwd ? 'text' : 'password'}
              className="input pr-10" placeholder="Минимум 6 символов"
              value={form.password} onChange={handleChange} required
            />
            <button
              type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <label className="label" htmlFor="password_confirm">Повторите пароль</label>
          <input
            id="password_confirm" name="password_confirm"
            type={showPwd ? 'text' : 'password'}
            className="input" placeholder="••••••••"
            value={form.password_confirm} onChange={handleChange} required
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>

      <p className="text-center text-sm text-text-muted mt-6">
        Уже есть аккаунт?{' '}
        <Link href="/auth/login" className="text-brand-600 hover:text-brand-700 font-semibold">
          Войти
        </Link>
      </p>
    </div>
  )
}
