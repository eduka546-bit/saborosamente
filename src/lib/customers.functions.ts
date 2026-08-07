import { createServerFn } from "@tanstack/react-start";
import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import fs from 'fs';

export const importExistingCustomers = createServerFn({ method: "POST" })
  .handler(async () => {
    try {
      const supabase = getSupabaseAdmin();
      const rawData = fs.readFileSync('/tmp/customers_to_import.json', 'utf8');
      const data = JSON.parse(rawData);
      
      const results = {
        success: 0,
        errors: 0,
        details: [] as string[]
      };

      // Process in small chunks to avoid timeout and memory issues
      // Also fetch all users once to avoid listing them 450 times
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
        perPage: 1000
      });

      if (listError) throw listError;

      const existingUsersMap = new Map(users.map(u => [u.email?.toLowerCase(), u.id]));

      for (const customer of data) {
        try {
          if (!customer.email || customer.email.trim() === "" || customer.email === "\u00a0") {
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
            // Update existing profile
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
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
            } else {
              results.success++;
            }
          } else {
            // Create new user
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
              // Profile is usually created by trigger, but we update it to ensure data consistency
              const { error: profileError } = await supabase
                .from('profiles')
                .update({
                  cpf: cleanCpf,
                  bairro: cleanBairro,
                  nome: cleanNome,
                  telefone: cleanTelefone,
                  email: cleanEmail
                })
                .eq('id', authUser.user.id);

              if (profileError) {
                results.errors++;
              } else {
                results.success++;
              }
            }
          }
        } catch (innerError: any) {
          results.errors++;
          results.details.push(`Unexpected error for ${customer.email}: ${innerError.message}`);
        }
      }

      return results;
    } catch (error: any) {
      console.error('Import failed:', error);
      throw new Error(error.message || 'Import failed');
    }
  });
