import { createClient } from "@supabase/supabase-js";

// Browser Supabase client. Only lib/store.ts should import this (CLAUDE.md: data goes through the store).
// The publishable key is safe to ship to the browser; access is guarded by Supabase Auth / RLS.
// The login session is kept in localStorage (no cookies), so it survives reloads on this browser (L-2).
// The profile row is created by the DB trigger `on_auth_user_created` on first login.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      flowType: "pkce",
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  },
);
