require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = String(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
).trim();
const supabaseAnonKey = String(
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
).trim();

// Check if variables exist before creating the client
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase credentials missing. Set SUPABASE_URL and SUPABASE_ANON_KEY in Back-end/.env'
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;
