import { createClient } from "@supabase/supabase-js";

// Ce client utilise la clé SECRÈTE (service role) et ne doit JAMAIS être
// importé dans un composant "use client" — uniquement dans les routes API
// (app/api/.../route.js), qui s'exécutent côté serveur.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
