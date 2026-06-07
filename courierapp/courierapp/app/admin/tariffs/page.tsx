import { createClient } from '@/lib/supabase/server'
import TariffsClient from './TariffsClient'

export default async function TariffsPage() {
  const supabase = createClient()

  const [{ data: tariffs }, { data: warehouses }] = await Promise.all([
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

  return <TariffsClient tariffs={tariffs ?? []} warehouses={warehouses ?? []} />
}