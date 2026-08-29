import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, GripVertical, ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type MenuItem = {
  id: string;
  secao: string;
  secao_ordem: number;
  ordem: number;
  item_id: string;
  titulo: string;
  descricao: string | null;
  acao: string;
  resposta_chave: string | null;
  ativo: boolean;
};

const ACAO_LABEL: Record<string, string> = {
  resposta_fixa: "Resposta fixa",
  transfere_humano: "Transfere p/ atendente",
  envia_cardapio: "Envia cardápio",
  envia_site: "Envia link do site",
};

export function MenuChatbotEditor() {
  const queryClient = useQueryClient();
  const [itens, setItens] = useState<MenuItem[]>([]);

  const { isLoading } = useQuery({
    queryKey: ["chatbot-menu"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chatbot_menu")
        .select(
          "id, secao, secao_ordem, ordem, item_id, titulo, descricao, acao, resposta_chave, ativo",
        )
        .order("secao_ordem")
        .order("ordem");
      if (error) throw error;
      setItens((data as MenuItem[]) ?? []);
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: MenuItem) => {
      const { error } = await supabase
        .from("chatbot_menu")
        .update({
          titulo: item.titulo,
          descricao: item.descricao,
          ativo: item.ativo,
          ordem: item.ordem,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-menu"] });
      toast.success("Item do menu salvo! Já vale no WhatsApp.");
    },
    onError: (e: Error) => toast.error("Erro ao salvar: " + e.message),
  });

  const update = (idx: number, campo: keyof MenuItem, valor: string | boolean | number) => {
    const next = [...itens];
    next[idx] = { ...next[idx], [campo]: valor };
    setItens(next);
  };

  // Agrupa por seção preservando a ordem de secao_ordem.
  const secoes = Array.from(new Set(itens.map((i) => i.secao)));
  const ativosCount = itens.filter((i) => i.ativo).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-[#5850ec] flex items-center gap-2">
          <ListTree size={20} /> Menu do Chatbot
        </h2>
        <span
          className={`text-xs font-semibold ${ativosCount > 10 ? "text-red-600" : "text-gray-400"}`}
        >
          {ativosCount}/10 itens ativos
        </span>
      </div>
      <p className="text-gray-500 text-sm mb-4">
        Edite o menu que o assistente do WhatsApp mostra. Mudanças valem na hora, sem deploy. O
        WhatsApp aceita no máximo 10 itens ativos no total.
      </p>

      {ativosCount > 10 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-700">
          Você tem mais de 10 itens ativos. O WhatsApp só mostra os 10 primeiros — desative alguns.
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <Loader2 className="animate-spin mr-2" size={18} /> Carregando...
        </div>
      ) : (
        <div className="space-y-5">
          {secoes.map((secao) => (
            <div key={secao}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                {secao}
              </h3>
              <div className="space-y-2">
                {itens
                  .map((item, idx) => ({ item, idx }))
                  .filter(({ item }) => item.secao === secao)
                  .map(({ item, idx }) => (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-3 ${
                        item.ativo
                          ? "border-gray-200 bg-white"
                          : "border-gray-100 bg-gray-50 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <GripVertical size={14} className="text-gray-300 shrink-0" />
                        <Input
                          value={item.titulo}
                          onChange={(e) => update(idx, "titulo", e.target.value)}
                          className="font-semibold text-gray-800"
                          maxLength={24}
                          placeholder="Título (máx 24 caracteres)"
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={item.ativo}
                            onCheckedChange={(v) => update(idx, "ativo", v)}
                          />
                        </div>
                      </div>
                      <Input
                        value={item.descricao ?? ""}
                        onChange={(e) => update(idx, "descricao", e.target.value)}
                        className="text-sm mb-2"
                        maxLength={72}
                        placeholder="Descrição (aparece embaixo do título)"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-gray-400">
                          Ação: {ACAO_LABEL[item.acao] ?? item.acao}
                          {item.acao === "resposta_fixa" && item.resposta_chave
                            ? " — edite o texto em Respostas do Chatbot"
                            : ""}
                        </span>
                        <Button
                          onClick={() => saveMutation.mutate(item)}
                          disabled={saveMutation.isPending}
                          size="sm"
                          className="bg-[#5850ec] text-white"
                        >
                          {saveMutation.isPending ? (
                            <Loader2 size={14} className="animate-spin mr-1" />
                          ) : (
                            <Save size={14} className="mr-1" />
                          )}{" "}
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
