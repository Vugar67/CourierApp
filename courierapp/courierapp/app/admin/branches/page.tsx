import { createClient } from '@/lib/supabase/server'
import BranchesClient from './BranchesClient'

export default async function BranchesPage() {
  const supabase = createClient()
  const { data: branches } = await supabase
    .from('branches')
    .select('*')
    .order('sort_order')

  return <BranchesClient branches={branches ?? []} />
}
