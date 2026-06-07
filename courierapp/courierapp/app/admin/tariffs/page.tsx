import { createClient } from '@/lib/supabase/server'
import TariffsClient from './TariffsClient'

export default async function TariffsPage() {
  const supabase = createClient()

  const [{ data: tariffs }, { data: warehousesRaw }] = await Promise.all([
    supabase
      .from('tariffs')
      .select('*, warehouses(name, countries(name_ru, code))')
      .order('created_at', { ascending: false }),
    supabase
      .from('warehouses')
      .select('id, name, countries(name_ru, code)')
      .eq('is_active', true)
      .eq('is_origin', true)
      .order('name'),
  ])

  const warehouses = (warehousesRaw ?? []).map((w: any) => ({
    id: w.id,
    name: w.name,
    countries: Array.isArray(w.countries) ? w.countries[0] : w.countries,
  }))

  return <TariffsClient tariffs={tariffs ?? []} warehouses={warehouses} />
}
