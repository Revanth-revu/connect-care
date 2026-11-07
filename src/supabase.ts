import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Supabase env vars missing. Create .env with VITE_SUPABASE_URL and ' +
    'VITE_SUPABASE_ANON_KEY, then restart `npm run dev`.'
  )
}
if (!/^https?:\/\//.test(url)) {
  throw new Error(`VITE_SUPABASE_URL must include a protocol: got "${url}"`)
}

export const supabase = createClient(url, anonKey)