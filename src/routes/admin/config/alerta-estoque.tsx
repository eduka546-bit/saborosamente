/**
 * Configuração do Alerta Diário de Estoque (WhatsApp).
 * Gerencia a lista de números que recebem o resumo de estoque às 19h.
 * Números são armazenados em site_settings.parametros_loja.alerta_estoque_numeros
 * como array de strings no formato E.164 sem "+" (ex.: "5547997391514").
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Loader2, Plus, Trash2, Bell, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/config/alerta-estoque")({
  component: AlertaEstoquePage,
});

// Normaliza o número pro formato E.164 sem "+".
// Aceita (47) 99739-1514, 47997391514, +5547997391514, etc.
function normalizar(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return "";
  // Se já começa com 55 e tem 12-13 dígitos, está ok.
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  // Se tem 10-11 dígitos, assume Brasil e prefixa 55.
  if (digits.length >= 10 && digits.length <= 11) return `55${digits}`;
  // Se tem 12-13 já, retorna como está.
  return digits;
}

function validar(num: string): boolean {
  // E.164 BR: 55 + DDD (2 dígitos) + número (8-9 dígitos) = 12-13 dígitos.
  return /^55\d{10,11}$/.test(num);
}

function formatarExibicao(num: string): string {
  // "5547997391514" → "55 (47) 99739-1514"
  if (num.startsWith("55") && num.length >= 12) {
    const sem55 = num.slice(2);
    const ddd = sem55.slice(0, 2);
    const tel = sem55.slice(2);
    const formatado =
      tel.length === 9
        ? `${tel.slice(0, 5)}-${tel.slice(5)}`
        : `${tel.slice(0, 4)}-${tel.slice(4)}`;
    return `+55 (${ddd}) ${formatado}`;
  }
  return num;
}

function AlertaEstoquePage() {
  const queryClient = useQueryClient();
  const [novoNumero, setNovoNumero] = useState("");

  const { data: numeros = [], isLoading } = useQuery({
    queryKey: ["config-alerta-estoque"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("parametros_loja")
        .maybeSingle();
      const lista = (data?.parametros_loja as any)?.alerta_estoque_numeros;
      return Array.isArray(lista) ? (lista as string[]) : ["5547997391514"];
    },
  });

  async function salvarLista(lista: string[]) {
    const { data } = await supabase
      .from("site_settings")
      .select("parametros_loja")
      .maybeSingle();
    const pl = (data?.parametros_loja as any) ?? {};
    const { error } = await supabase
      .from("site_settings")
      .update({ parametros_loja: { ...pl, alerta_estoque_numeros: lista } } as any)
      .neq("id", "");
    if (error) throw error;
  }

  const addMutation = useMutation({
    mutationFn: async () => {
      const num = normalizar(novoNumero);
      if (!validar(num)) {
        throw new Error(
          "Número inválido. Use o formato com DDD, ex.: 47 99739-1514.",
        );
      }
      if (numeros.includes(num)) {
        throw new Error("Este número já está na lista.");
      }
      await salvarLista([...numeros, num]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-alerta-estoque"] });
      toast.success("Número adicionado!");
      setNovoNumero("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (num: string) => {
      await salvarLista(numeros.filter((n) => n !== num));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-alerta-estoque"] });
      toast.success("Número removido.");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <Bell size={22} className="text-[#5850ec]" />
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Alerta de Estoque</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Números que recebem o resumo de estoque no WhatsApp todos os dias às 19h.
          </p>
        </div>
      </div>

      {/* Adicionar número */}
      <div className="bg-white rounded-xl border p-5 mb-5 space-y-3">
        <h2 className="text-sm font-bold text-gray-700">Adicionar número</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Phone
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              value={novoNumero}
              onChange={(e) => setNovoNumero(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addMutation.mutate();
                }
              }}
              placeholder="Ex.: 47 99739-1514"
              className="pl-8"
            />
          </div>
          <Button
            onClick={() => addMutation.mutate()}
            disabled={!novoNumero.trim() || addMutation.isPending}
            className="bg-[#5850ec] text-white shrink-0"
          >
            {addMutation.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Plus size={15} />
            )}
          </Button>
        </div>
        <p className="text-[11px] text-gray-400">
          Informe o número com DDD (sem código do país). Ex.: 47 99739-1514 ou 4799739-1514.
        </p>
      </div>

      {/* Lista atual */}
      <div className="bg-white rounded-xl border p-5 space-y-3">
        <h2 className="text-sm font-bold text-gray-700">
          Números cadastrados{" "}
          <span className="text-gray-400 font-normal">({numeros.length})</span>
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-[#5850ec]" size={24} />
          </div>
        ) : numeros.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            Nenhum número cadastrado. O alerta não será enviado.
          </p>
        ) : (
          <div className="space-y-2">
            {numeros.map((num) => (
              <div
                key={num}
                className="flex items-center justify-between rounded-xl border px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-[#5850ec]" />
                  <span className="text-sm font-semibold text-gray-800">
                    {formatarExibicao(num)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-500"
                  disabled={removeMutation.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Remover ${formatarExibicao(num)} da lista de alertas?`,
                      )
                    ) {
                      removeMutation.mutate(num);
                    }
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-400 mt-4 text-center">
        O alerta é enviado automaticamente às 19h com o resumo completo de estoque
        (marmitas, sopas e complementos), sem as bebidas.
      </p>
    </div>
  );
}
