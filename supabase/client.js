// Initialize Supabase client for SAPPHERE
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.4/+esm";

const url = (window.CONFIG && window.CONFIG.SUPABASE_URL) || '';
const key = (window.CONFIG && window.CONFIG.SUPABASE_ANON_KEY) || '';

const isPlaceholder = !url || url.includes("YOUR_") || !key || key.includes("YOUR_");

export const supabase = isPlaceholder ? null : createClient(url, key);

