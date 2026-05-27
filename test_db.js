import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) { console.log('No keys'); process.exit(0); }
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('profiles').select('id, username, avatar_url').limit(1);
  console.log("Data:", data);
  console.log("Error:", error);
}

test();
