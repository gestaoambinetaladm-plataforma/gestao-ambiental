import { createClient } from '@supabase/supabase-js'

// Cliente admin — usa service role key, bypassa RLS
// NUNCA expor no frontend — apenas server-side
export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
