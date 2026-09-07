import { createClient } from '@supabase/supabase-js'

export const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY && !String(import.meta.env.VITE_SUPABASE_ANON_KEY).includes('PASTE_'))
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://pmvadmfisugdycswrtsp.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-anon-key',
)
