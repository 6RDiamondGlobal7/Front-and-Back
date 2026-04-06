require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = String(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
).trim();
const supabaseKey = String(
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
).trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase credentials missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY.'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
