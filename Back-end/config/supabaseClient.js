require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if variables exist before creating the client
if (!supabaseUrl || !supabaseAnonKey) {
    console.error("ERROR: Supabase credentials missing in .env file!");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;  
