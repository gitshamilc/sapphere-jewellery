// Initialize Supabase Client
const { createClient } = window.supabase || {};

export const supabase = createClient
  ? createClient(window.CONFIG.SUPABASE_URL, window.CONFIG.SUPABASE_ANON_KEY)
  : null;
