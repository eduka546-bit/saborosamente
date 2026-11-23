/** Valida que a consulta de pedido no WhatsApp pertence ao número remetente.
 * Não usa nome, CPF ou protocolo isoladamente como prova de identidade.
 */
export function normalizarTelefoneBrasileiro(valor: unknown): string | null {
  const digitos = String(valor ?? "").replace(/\D/g, "");
  const local = digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13)
    ? digitos.slice(2) : digitos;
  if (!/^\d{10,11}$/.test(local)) return null;
  return local;
}

export function telefonesDoMesmoContato(a: unknown, b: unknown): boolean {
  const x = normalizarTelefoneBrasileiro(a);
  const y = normalizarTelefoneBrasileiro(b);
  if (!x || !y) return false;
  if (x === y) return true;
  // Compatibilidade exclusivamente com o 9º dígito de celular, mesmo DDD.
  const maior = x.length > y.length ? x : y;
  const menor = x.length > y.length ? y : x;
  return maior.length === 11 && menor.length === 10 && maior.slice(0,2) === menor.slice(0,2) &&
    maior[2] === "9" && maior.slice(3) === menor.slice(2);
}

export function pedidosVisiveisAoContato<T extends { id?: string; telefone_cliente?: string | null }>(
  pedidos: T[], remetente: string, protocolo?: string,
): T[] {
  const numerosCorretos = pedidos.filter(p => telefonesDoMesmoContato(p.telefone_cliente, remetente));
  if (!protocolo) return numerosCorretos;
  const codigo = protocolo.replace(/[^a-fA-F0-9]/g, "").toLowerCase();
  if (codigo.length < 6 || codigo.length > 36) return [];
  return numerosCorretos.filter(p => String(p.id || "").toLowerCase().startsWith(codigo));
}
