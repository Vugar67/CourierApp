import { createClient } from '@/lib/supabase/server'
import WarehousesClient from './WarehousesClient'

export default async function WarehousesPage() {
  const supabase = createClient()

  const [{ data: warehouses }, { data: countries }] = await Promise.all([
    supabase
      .from('warehouses')
      .select('*, countries(name_ru, code)')
      .order('created_at', { ascending: false }),
    supabase
      .from('countries')
      .select('*')
      .eq('is_active', true)
      .order('name_ru'),
  ])

  return <WarehousesClient warehouses={warehouses ?? []} countries={countries ?? []} />
}