import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_KEY;

// Determine which key to use
const keyToUse = supabaseServiceKey ?? supabaseAnonKey;

if (!supabaseUrl || !keyToUse) {
  throw new Error("❌ Missing Supabase credentials. Please check your .env file.");
}

// Explicitly assert keyToUse as string
export const supabase = createClient(supabaseUrl, keyToUse as string, {
  auth: { persistSession: false },
});
