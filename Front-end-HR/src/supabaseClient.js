// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and Key
const supabaseUrl = 'https://wtdfrdmnpnrqljtqukyd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0ZGZyZG1ucG5ycWxqdHF1a3lkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI0Mzk4NywiZXhwIjoyMDg1ODE5OTg3fQ.FF0ose-bIcBeAuGxNAF-EzMPW8cFesh8uNa4HYihZZ0';

export const supabase = createClient(supabaseUrl, supabaseKey);