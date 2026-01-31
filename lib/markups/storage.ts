import { type MarkupEntry } from "./types"

// Import dynamique pour éviter les erreurs au build
async function getSupabaseClient() {
  const { getSupabase } = await import("@/lib/supabase/client")
  return getSupabase()
}

// Convertir depuis le format Supabase vers MarkupEntry
function fromSupabase(row: any): MarkupEntry {
  return {
    id: row.id,
    datetimeLocal: row.datetime_local,
    symbol: row.symbol,
    timeframe: row.timeframe,
    strategy: row.strategy || '',
    characteristics: row.characteristics || undefined,
    tradeResult: row.trade_result || undefined,
    pips: row.pips ?? undefined,
    pipsTP1: row.pips_tp1 ?? undefined,
    resultTP1: row.result_tp1 || undefined,
    pipsTP2: row.pips_tp2 ?? undefined,
    resultTP2: row.result_tp2 || undefined,
    pipsTP3: row.pips_tp3 ?? undefined,
    resultTP3: row.result_tp3 || undefined,
    pipsSL: row.pips_sl ?? undefined,
    capitalPct: row.capital_pct ?? undefined,
    notes: row.notes || undefined,
    screenshots: row.screenshots || undefined,
    screenshotDataUrl: row.screenshot_data_url || undefined,
  }
}

// Convertir MarkupEntry vers le format Supabase
function toSupabase(entry: MarkupEntry) {
  return {
    id: entry.id,
    datetime_local: entry.datetimeLocal,
    symbol: entry.symbol,
    timeframe: entry.timeframe,
    strategy: entry.strategy || '',
    characteristics: entry.characteristics || null,
    trade_result: entry.tradeResult || null,
    pips: entry.pips ?? null,
    pips_tp1: entry.pipsTP1 ?? null,
    result_tp1: entry.resultTP1 || null,
    pips_tp2: entry.pipsTP2 ?? null,
    result_tp2: entry.resultTP2 || null,
    pips_tp3: entry.pipsTP3 ?? null,
    result_tp3: entry.resultTP3 || null,
    pips_sl: entry.pipsSL ?? null,
    capital_pct: entry.capitalPct ?? null,
    notes: entry.notes || null,
    screenshots: entry.screenshots || null,
    screenshot_data_url: entry.screenshotDataUrl || null,
  }
}

// Charger les markups depuis Supabase
export async function loadMarkupsFromStorage(): Promise<MarkupEntry[]> {
  try {
    const supabase = await getSupabaseClient()
    const { data, error } = await supabase
      .from('markups')
      .select('*')
      .order('datetime_local', { ascending: false })
    
    if (error) {
      console.error('Supabase load error:', error.message)
      return []
    }
    
    console.log(`Loaded ${data?.length || 0} entries from Supabase`)
    return (data || []).map(fromSupabase)
  } catch (err) {
    console.error('Error loading markups:', err)
    return []
  }
}

// Ajouter un markup
export async function addMarkupToStorage(entry: MarkupEntry): Promise<boolean> {
  try {
    const supabase = await getSupabaseClient()
    const { error } = await supabase
      .from('markups')
      .insert(toSupabase(entry))
    
    if (error) {
      console.error('Supabase insert error:', error.message)
      return false
    }
    console.log('Entry added to Supabase:', entry.id)
    return true
  } catch (err) {
    console.error('Error adding markup:', err)
    return false
  }
}

// Mettre à jour un markup
export async function updateMarkupInStorage(entry: MarkupEntry): Promise<boolean> {
  try {
    const supabase = await getSupabaseClient()
    const { error } = await supabase
      .from('markups')
      .update(toSupabase(entry))
      .eq('id', entry.id)
    
    if (error) {
      console.error('Supabase update error:', error.message)
      return false
    }
    console.log('Entry updated in Supabase:', entry.id)
    return true
  } catch (err) {
    console.error('Error updating markup:', err)
    return false
  }
}

// Supprimer un markup
export async function deleteMarkupFromStorage(id: string): Promise<boolean> {
  try {
    const supabase = await getSupabaseClient()
    const { error } = await supabase
      .from('markups')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Supabase delete error:', error.message)
      return false
    }
    console.log('Entry deleted from Supabase:', id)
    return true
  } catch (err) {
    console.error('Error deleting markup:', err)
    return false
  }
}
