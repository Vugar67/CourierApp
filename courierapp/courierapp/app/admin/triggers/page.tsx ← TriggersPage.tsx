import { createClient } from '@/lib/supabase/server'
import TriggersClient from './TriggersClient'

export default async function TriggersPage() {
  const supabase = createClient()
  const { data: triggers } = await supabase
    .from('tariff_triggers')
    .select('*')
    .order('sort_order')

  return <TriggersClient triggers={triggers ?? []} />
}
