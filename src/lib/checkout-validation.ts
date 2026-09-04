import { z } from "zod";

export const checkoutSchema = z
  .object({
    nome: z.string().trim().min(3, "Informe seu nome completo").max(80),
    email: z.string().trim().email("E-mail inválido").max(120),
    telefone: z.string().trim().min(10, "Telefone com DDD").max(20),
    cep: z.string().trim().optional(),
    endereco: z.string().trim().min(5, "Informe rua e número").max(160),
    complemento: z.string().trim().max(80).optional(),
    cidade: z.string().trim().min(2, "Informe a cidade").max(80),
    pagamento: z.enum(["pix", "cartao", "alimentacao", "mercadopago", "dinheiro"]),
    troco: z.string().trim().optional(),
    observacoes: z.string().trim().max(300).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.pagamento === "dinheiro" && data.troco && Number.isNaN(Number(data.troco))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe um valor numérico para o troco", path: ["troco"] });
    }
  });

export type CheckoutForm = z.infer<typeof checkoutSchema>;
