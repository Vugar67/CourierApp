import { createClient } from '@/lib/supabase/server'
import AddressesClient from './AddressesClient'

export default async function AddressesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: warehouses }] = await Promise.all([
    supabase.from('profiles').select('personal_code, first_name, last_name').eq('id', user!.id).single(),
    supabase
      .from('warehouses')
      .select('*, countries(name_ru, name_az, name_en, code)')
      .eq('is_origin', true)
      .eq('is_active', true)
      .order('name'),
  ])

  return <AddressesClient warehouses={warehouses ?? []} profile={profile} />
}
