import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
import fs from "fs";
//#region node_modules/.nitro/vite/services/ssr/assets/customers.functions-CV3oMCvg.js
var getSupabaseAdmin = () => {
	const supabaseUrl = process.env.VITE_SUPABASE_URL;
	const supabaseServiceKey = process.env.SB_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !supabaseServiceKey) throw new Error("Configuração administrativa do Supabase ausente (VITE_SUPABASE_URL ou SB_SERVICE_ROLE_KEY). Certifique-se de que a SB_SERVICE_ROLE_KEY foi adicionada aos segredos do projeto.");
	return createClient(supabaseUrl, supabaseServiceKey, { auth: {
		autoRefreshToken: false,
		persistSession: false
	} });
};
var importExistingCustomers_createServerFn_handler = createServerRpc({
	id: "6a7ae2fd0cd2162f830f5a5a36f264444da7b45171dcefb9358a1d0ccfeb5a12",
	name: "importExistingCustomers",
	filename: "src/lib/customers.functions.ts"
}, (opts) => importExistingCustomers.__executeServer(opts));
var importExistingCustomers = createServerFn({ method: "POST" }).handler(importExistingCustomers_createServerFn_handler, async () => {
	try {
		const supabase = getSupabaseAdmin();
		const rawData = fs.readFileSync("/tmp/customers_to_import.json", "utf8");
		const data = JSON.parse(rawData);
		const results = {
			success: 0,
			errors: 0,
			details: []
		};
		const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1e3 });
		if (listError) throw listError;
		const existingUsersMap = new Map(users.map((u) => [u.email?.toLowerCase(), u.id]));
		for (const customer of data) try {
			if (!customer.email || customer.email.trim() === "" || customer.email === "\xA0") {
				results.errors++;
				continue;
			}
			const cleanEmail = customer.email.trim().toLowerCase();
			const cleanCpf = String(customer.cpf || "").replace(/\D/g, "");
			const cleanTelefone = String(customer.telefone || "").trim().replace(/\u00a0/g, "");
			const cleanBairro = String(customer.bairro || "").trim().replace(/\u00a0/g, "");
			const cleanNome = String(customer.nome || "").trim().replace(/\u00a0/g, "") || "Cliente Importado";
			const existingUserId = existingUsersMap.get(cleanEmail);
			if (existingUserId) {
				const { error: profileError } = await supabase.from("profiles").upsert({
					id: existingUserId,
					nome: cleanNome,
					cpf: cleanCpf,
					telefone: cleanTelefone,
					bairro: cleanBairro,
					email: cleanEmail
				});
				if (profileError) {
					results.errors++;
					results.details.push(`Error updating ${cleanEmail}: ${profileError.message}`);
				} else results.success++;
			} else {
				const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
					email: cleanEmail,
					password: cleanCpf || "123456",
					email_confirm: true,
					user_metadata: {
						nome: cleanNome,
						telefone: cleanTelefone
					}
				});
				if (authError) {
					results.errors++;
					results.details.push(`Error creating ${cleanEmail}: ${authError.message}`);
				} else if (authUser.user) {
					const { error: profileError } = await supabase.from("profiles").update({
						cpf: cleanCpf,
						bairro: cleanBairro,
						nome: cleanNome,
						telefone: cleanTelefone,
						email: cleanEmail
					}).eq("id", authUser.user.id);
					if (profileError) results.errors++;
					else results.success++;
				}
			}
		} catch (innerError) {
			results.errors++;
			results.details.push(`Unexpected error for ${customer.email}: ${innerError.message}`);
		}
		return results;
	} catch (error) {
		console.error("Import failed:", error);
		throw new Error(error.message || "Import failed");
	}
});
//#endregion
export { importExistingCustomers_createServerFn_handler };
