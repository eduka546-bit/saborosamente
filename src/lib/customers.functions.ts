import { createServerFn } from "@tanstack/react-start";
import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import fs from 'fs';
import { z } from 'zod';

export const importExistingCustomers = createServerFn({ method: "POST" })
  .handler(async () => {
    try {
      const supabase = getSupabaseAdmin();
      const data = JSON.parse(fs.readFileSync('/tmp/customers_to_import.json', 'utf8'));
      
      const results = {
        success: 0,
        errors: 0,
        details: [] as string[]
      };

      for (const customer of data) {
        // Skip invalid customers (missing email or empty email)
        if (!customer.email || customer.email.trim() === "" || customer.email === "\u00a0") {
          results.errors++;
          results.details.push(`Skipping customer ${customer.nome || 'unnamed'}: Invalid email`);
          continue;
        }

        const cleanEmail = customer.email.trim();
        // Convert CPF to string and remove non-digits
        const cleanCpf = String(customer.cpf).replace(/\D/g, "");
        const cleanTelefone = String(customer.telefone).trim().replace(/\u00a0/g, "");
        const cleanBairro = String(customer.bairro).trim().replace(/\u00a0/g, "");
        const cleanNome = String(customer.nome).trim().replace(/\u00a0/g, "") || "Cliente Importado";

        // 1. Create User in Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: cleanEmail,
          password: cleanCpf || "123456", // Fallback password if CPF is missing
          email_confirm: true,
          user_metadata: {
            nome: cleanNome,
            telefone: cleanTelefone
          }
        });

        if (authError) {
          // If user already exists, we update the profile
          if (authError.message.toLowerCase().includes('already registered') || authError.message.toLowerCase().includes('already exists')) {
             // Optimized: instead of listing 1000 users in a loop, we skip auth creation and go straight to profile update
             // We can find the user by email using a specific query if needed, or just attempt an upsert if we had the ID.
             // Since we don't have the ID yet, we fetch JUST this user.
             const { data: userData, error: fetchError } = await supabase.auth.admin.listUsers({
               perPage: 1,
               page: 1
             });
             
             // Actually, Supabase doesn't support filtering listUsers by email directly easily without a lot of metadata.
             // But we can just use the profiles table if it's already linked or just skip auth for now and update profile if it exists.
             // Let's use a better approach: try to find by email in profiles first if auth fails.
             const { data: existingProfile } = await supabase
               .from('profiles')
               .select('id')
               .eq('email', cleanEmail)
               .single();

             if (existingProfile) {
                const { error: profileError } = await supabase
                 .from('profiles')
                 .update({
                   nome: cleanNome,
                   cpf: cleanCpf,
                   telefone: cleanTelefone,
                   bairro: cleanBairro
                 })
                 .eq('id', existingProfile.id);
                 
                if (profileError) {
                  results.errors++;
                  results.details.push(`Error updating profile for ${cleanEmail}: ${profileError.message}`);
                } else {
                  results.success++;
                }
                continue;
             }
          }
          
          results.errors++;
          results.details.push(`Error creating auth user ${cleanEmail}: ${authError.message}`);
          continue;
        }

        if (authUser.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              cpf: cleanCpf,
              bairro: cleanBairro,
              nome: cleanNome,
              telefone: cleanTelefone
            })
            .eq('id', authUser.user.id);

          if (profileError) {
            results.errors++;
            results.details.push(`Error updating profile for ${cleanEmail}: ${profileError.message}`);
          } else {
            results.success++;
          }
        }
      }

      return results;
    } catch (error: any) {
      console.error('Import failed:', error);
      throw new Error(error.message || 'Import failed');
    }
  });
