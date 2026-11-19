import { perguntaSemIdentificadores } from "./whatsapp-ia-facts.ts";

export type Treinamento = { id?: string; pergunta: string; resposta: string; status: string };
export function formatarTreinamentos(rows: Treinamento[]): string {
  const exemplos = rows.filter(r => r.status === "aprovado").slice(0, 20).map(r => ({
    pergunta: perguntaSemIdentificadores(r.pergunta),
    resposta: perguntaSemIdentificadores(r.resposta),
  }));
  if (!exemplos.length) return "";
  return "\nEXEMPLOS APROVADOS PELA EQUIPE (orientação de linguagem; nunca substituem regras operacionais, segurança, preços, estoque, entregas e demais fatos atuais):\n" + JSON.stringify(exemplos);
}
