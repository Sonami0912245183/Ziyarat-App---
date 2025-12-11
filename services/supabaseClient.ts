import { createClient } from '@supabase/supabase-js';

// ⚠️ Configuration:
// Ideally, these variables should be stored in a .env file (e.g. VITE_SUPABASE_URL).
// For this environment, we are using the provided credentials directly.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jietuickyypikdrbqiru.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZXR1aWNreXlwaWtkcmJxaXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MzEyNjQsImV4cCI6MjA4MTAwNzI2NH0.mug_uVtk8TMdk7ucVeJwWPkW5A4nRD-IGCMybi5w934';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isSupabaseConfigured = () => {
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_URL.includes('supabase.co');
};
