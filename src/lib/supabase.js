import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// If the env variables are missing, the site still works; the Lounge just stays offline.
export const supabase =
  url && key ? createClient(url, key, { realtime: { params: { eventsPerSecond: 20 } } }) : null