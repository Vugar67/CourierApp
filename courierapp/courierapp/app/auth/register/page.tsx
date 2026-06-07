'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const PASSPORT_SERIES = ['AA', 'AB', 'AZE', 'MYI', 'DYI']
const PHONE_OPERATORS = ['50', '51', '55', '60', '70', '77', '99']
const GENDERS = [
  { value: 'male', label_az: 'Kişi', label_ru: 'Мужской' },
  { value: 'female', label_az: 'Qadın', label_ru: 'Женский' },
]

interface City { id: string; name_ru: string; name_az: string }
interface Branch { id: string; name: string; address: string }

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [showPwd, setShowPwd] = useState(false)
  const [showPwd2, setShowPwd2] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cities, setCities] = useState<City[]>([])
  const [branches, setBranches] = useState<Branch[]>([])

  const [form, setForm] = useState({
    // Step 1
    client_type: 'individual',
    first_name: '', last_name: '',
    email: '', phone_operator: '50', phone_number: '',
    birth_date: '', language: 'az',
    city_id: '', gender: 'male',
    branch_id: '', referral_code: '',
    // Step 2
    passport_series: '', passport_number: '',
    fin_code: '', address: '',
    password: '', password_confirm: '',
    confirm_method: 'email',
  })

  async function loadCities() {
    if (cities.length > 0) return
    const { data } = await supabase.from('cities').select('*').eq('is_active', true).order('sort_order')
    setCities(data ?? [])
  }

  async function loadBranches() {
    if (branches.length > 0) return
    const { data } = await supabase.from('branches').select('*').eq('is_active', true).order('name')
    setBranches(data ?? [])
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  function validateFin(fin: string) {
    return /^[A-Z0-9]{7}$/.test(fin.toUpperCase())
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.first_name || !form.last_name) { setError('Введите имя и фамилию'); return }
    if (!form.email) { setError('Введите email'); return }
    if (!form.phone_number) { setError('Введите номер телефона'); return }
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.passport_series) { setError('Выберите серию паспорта'); return }
    if (!form.passport_number) { setError('Введите номер паспорта'); return }
    if (!form.fin_code) { setError('Введите FIN код'); return }
    if (!validateFin(form.fin_code)) { setError('FIN код должен содержать 7 символов (буквы и цифры)'); return }
    if (form.password.length < 6) { setError('Пароль минимум 6 символов'); return }
    if (form.password !== form.password_confirm) { setError('Пароли не совпадают'); return }

    setLoading(true)

    const phone = `+994${form.phone_operator}${form.phone_number}`

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.first_name,
          last_name: form.last_name,
          phone,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message.includes('already registered')
        ? 'Этот email уже зарегистрирован'
        : signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        first_name: form.first_name,
        last_name: form.last_name,
        phone,
        role: 'client',
        language: form.language as any,
        birth_date: form.birth_date || null,
        gender: form.gender,
        city_id: form.city_id || null,
        branch_id: form.branch_id || null,
        passport_series: form.passport_series,
        passport_number: form.passport_number,
        fin_code: form.fin_code.toUpperCase(),
        address: form.address || null,
        referral_code: form.referral_code || null,
        client_type: form.client_type,
      })

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
        <h2 className="text-xl font-bold text-gray-900 mb-2">Qeydiyyat tamamlandı!</h2>
        <p className="text-sm text-gray-500 mb-2">
          {form.confirm_method === 'email'
            ? `${form.email} ünvanına təsdiq məktubu göndərildi.`
            : `+994${form.phone_operator}${form.phone_number} nömrəsinə SMS göndərildi.`}
        </p>
        <p className="text-sm text-gray-500 mb-6">Hesabınızı təsdiqləyin və daxil olun.</p>
        <Link href="/auth/login" className="btn-primary w-full justify-center">Daxil ol</Link>
      </div>
    )
  }

  return (
    <div className="card-md animate-slide-up overflow-hidden">
      {/* Steps indicator */}
      <div className="flex border-b border-gray-100">
        {[1, 2].map(s => (
          <div key={s} className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
            step === s ? 'text-brand-600 border-b-2 border-brand-600' :
            step > s ? 'text-green-600' : 'text-gray-400'
          }`}>
            {step > s ? '✓ ' : ''}{s === 1 ? 'Şəxsi məlumatlar' : 'Sənədlər'}
          </div>
        ))}
      </div>

      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Qeydiyyat</h1>

        {/* Client type toggle */}
        {step === 1 && (
          <div className="flex rounded-xl border border-gray-200 overflow-hidden mb-5 mt-4">
            {[
              { value: 'individual', label: 'Fiziki şəxs' },
              { value: 'company', label: 'Hüquqi şəxs' },
            ].map(opt => (
              <button key={opt.value} type="button"
                onClick={() => setForm(prev => ({ ...prev, client_type: opt.value }))}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  form.client_type === opt.value
                    ? 'bg-amber-400 text-white'
                    : 'text-amber-500 hover:bg-amber-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Ad *</label>
                <input name="first_name" type="text" className="input" placeholder="Vugar"
                  value={form.first_name} onChange={handleChange} required />
              </div>
              <div>
                <label className="label text-xs">Soyad *</label>
                <input name="last_name" type="text" className="input" placeholder="Novruzov"
                  value={form.last_name} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Email *</label>
                <input name="email" type="email" className="input" placeholder="siz@mail.com"
                  value={form.email} onChange={handleChange} required />
              </div>
              <div>
                <label className="label text-xs">Telefon *</label>
                <div className="flex gap-1">
                  <div className="flex items-center px-2 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-600 shrink-0">
                    +994
                  </div>
                  <select name="phone_operator" value={form.phone_operator} onChange={handleChange}
                    className="input w-16 px-2 shrink-0">
                    {PHONE_OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                  <input name="phone_number" type="tel" className="input" placeholder="2254090"
                    value={form.phone_number} onChange={handleChange} required />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Doğum günü</label>
                <input name="birth_date" type="date" className="input"
                  value={form.birth_date} onChange={handleChange} />
              </div>
              <div>
                <label className="label text-xs">Dil</label>
                <select name="language" value={form.language} onChange={handleChange} className="input">
                  <option value="az">AZ</option>
                  <option value="ru">RU</option>
                  <option value="en">EN</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Şəhər</label>
                <select name="city_id" value={form.city_id} onChange={handleChange}
                  className="input" onFocus={loadCities}>
                  <option value="">Seç</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name_az}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Cins</label>
                <select name="gender" value={form.gender} onChange={handleChange} className="input">
                  {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label_az}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Filial</label>
                <select name="branch_id" value={form.branch_id} onChange={handleChange}
                  className="input" onFocus={loadBranches}>
                  <option value="">Seç</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Referal Kodu</label>
                <input name="referral_code" type="text" className="input" placeholder="XXXX"
                  value={form.referral_code} onChange={handleChange} />
              </div>
            </div>

            {error && <div className="p-3 bg-red-50 rounded-xl text-sm text-red-600">{error}</div>}

            <button type="submit" className="btn-primary w-full mt-2">
              İrəli <ArrowRight size={16} />
            </button>

            <p className="text-center text-sm text-gray-500">
              Hesabınız var?{' '}
              <Link href="/auth/login" className="text-brand-600 font-semibold">Daxil ol</Link>
            </p>
          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Pasport seriyası *</label>
                <select name="passport_series" value={form.passport_series} onChange={handleChange}
                  className="input" required>
                  <option value="">Seç</option>
                  {PASSPORT_SERIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Pasport nömrəsi *</label>
                <input name="passport_number" type="text" className="input"
                  placeholder="Şəxsiyyət vəsiqəsinin nömrəsini daxil edin"
                  value={form.passport_number} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Pasport FIN *</label>
                <input name="fin_code" type="text" className="input uppercase"
                  placeholder="7 simvol" maxLength={7}
                  value={form.fin_code} onChange={handleChange} required />
              </div>
              <div>
                <label className="label text-xs">Ünvan</label>
                <input name="address" type="text" className="input"
                  placeholder="Ünvanınızı daxil edin"
                  value={form.address} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Şifrə *</label>
                <div className="relative">
                  <input name="password" type={showPwd ? 'text' : 'password'}
                    className="input pr-10" placeholder="Şifrənizi daxil edin"
                    value={form.password} onChange={handleChange} required />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label text-xs">Təkrar şifrə *</label>
                <div className="relative">
                  <input name="password_confirm" type={showPwd2 ? 'text' : 'password'}
                    className="input pr-10" placeholder="Təkrar şifrənizi daxil edin"
                    value={form.password_confirm} onChange={handleChange} required />
                  <button type="button" onClick={() => setShowPwd2(!showPwd2)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwd2 ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Confirm method */}
            <div>
              <label className="label text-xs">Təsdiq üsulu</label>
              <div className="flex gap-4">
                {[
                  { value: 'sms', label: 'SMS təsdiq' },
                  { value: 'email', label: 'Email təsdiq' },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="confirm_method" value={opt.value}
                      checked={form.confirm_method === opt.value}
                      onChange={handleChange}
                      className="accent-brand-600" />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && <div className="p-3 bg-red-50 rounded-xl text-sm text-red-600">{error}</div>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)}
                className="btn-secondary flex-1">
                <ArrowLeft size={16} /> Geriyə qayıt
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Gözləyin...' : 'Qeydiyyatdan keçin'}
              </button>
            </div>

            <p className="text-center text-sm text-gray-500">
              Hesabınız var?{' '}
              <Link href="/auth/login" className="text-brand-600 font-semibold">Daxil ol</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
