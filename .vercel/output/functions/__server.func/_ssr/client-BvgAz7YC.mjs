import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client-BvgAz7YC.js
var supabase = createClient("https://lxcgbrovdmpjatywweiv.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Y2dicm92ZG1wamF0eXd3ZWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzU2MDksImV4cCI6MjEwMTAxMTYwOX0.IjYsxY8uFKWKiv7sdvejZ5KMqgdlZFV-efLtfbBPsWg", { auth: {
	persistSession: true,
	autoRefreshToken: true,
	detectSessionInUrl: true,
	storageKey: "sb-lxcgbrovdmpjatywweiv-auth-token",
	storage: typeof window !== "undefined" ? window.localStorage : void 0
} });
//#endregion
export { supabase as t };
