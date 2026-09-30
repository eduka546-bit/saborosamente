import { createServerFn } from "@tanstack/react-start";

/**
 * Fluxo legado desativado por segurança.
 *
 * A importação atual de clientes é feita pela Edge Function "importar-cliente",
 * que valida a sessão e a role de administrador antes de qualquer operação.
 */
export const importExistingCustomers = createServerFn({ method: "POST" }).handler(async () => {
  throw new Error("Fluxo legado de importação desativado.");
});
