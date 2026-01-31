import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Création lazy du client pour éviter les erreurs au build
let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('SUPABASE CONFIG ERROR:')
      console.error('- URL:', supabaseUrl ? 'SET' : 'MISSING')
      console.error('- ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING')
      throw new Error('Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.')
    }
    console.log('Supabase client initialized with URL:', supabaseUrl)
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabase
}
