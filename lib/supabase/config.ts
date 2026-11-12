export function supabaseConfig() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://rgmgaygfzrcvbdygnmbb.supabase.co';
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_jZtrqOkHvP_6jirysCmTgg_GxmEs9a2';
  return url && key ? { url, key } : null;
}

