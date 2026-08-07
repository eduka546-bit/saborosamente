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
        // 1. Create User in Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: customer.email,
          password: customer.cpf, // Password is CPF as requested
          email_confirm: true,
          user_metadata: {
            nome: customer.nome,
            telefone: customer.telefone
          }
        });

        if (authError) {
          // If user already exists, we might want to just update the profile
          if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
             // Try to find the user by email to get their ID
             const { data: existingUsers } = await supabase.auth.admin.listUsers();
             const existingUser = existingUsers.users.find(u => u.email === customer.email);
             
             if (existingUser) {
               // Update profile
               const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                  id: existingUser.id,
                  nome: customer.nome,
                  cpf: customer.cpf,
                  telefone: customer.telefone,
                  bairro: customer.bairro
                });
                
               if (profileError) {
                 results.errors++;
                 results.details.push(`Error updating profile for ${customer.email}: ${profileError.message}`);
               } else {
                 results.success++;
               }
               continue;
             }
          }
          
          results.errors++;
          results.details.push(`Error creating auth user ${customer.email}: ${authError.message}`);
          continue;
        }

        if (authUser.user) {
          // Profile should be created by trigger, but we want to ensure CPF and Bairro are set
          // since the trigger only sets name and phone
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              cpf: customer.cpf,
              bairro: customer.bairro
            })
            .eq('id', authUser.user.id);

          if (profileError) {
            results.errors++;
            results.details.push(`Error updating profile for ${customer.email}: ${profileError.message}`);
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
