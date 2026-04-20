import { createClient } from "@supabase/supabase-js";

// Server-side admin client — uses the service role key.
// NEVER import this file in client components ("use client").
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);
