import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, MessageCircleQuestion, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/config/respostas")({
  component: AdminConfigRespostasPage,
});

type Resposta = {
  id: string;
  chave: string;
  titulo: string;
  conteudo: string;
  ativo: boolean;
  ordem: number;
};

function AdminConfigRespostasPage() {
  const queryClient = useQueryClient();
  const [itens, setItens] = useState<Resposta[]>([]);

  const { isLoading } = useQuery({
    queryKey: ["agente-respostas-fixas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agente_respostas_fixas")
        .select("id, chave, titulo, conteudo, ativo, ordem")
        .order("ordem");
      if (error) throw error;
      setItens((data as Resposta[]) ?? []);
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: Resposta) => {
      const { error } = await supabase
        .from("agente_respostas_fixas")
        .update({
          titulo: item.titulo,
          conteudo: item.conteudo,
          ativo: item.ativo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agente-respostas-fixas"] });
      toast.success("Resposta salva! Já vale no WhatsApp.");
    },
    onError: (e: Error) => toast.error("Erro ao salvar: " + e.message),
  });

  const update = (idx: number, field: keyof Resposta, value: string | boolean) => {
    const next = [...itens];
    next[idx] = { ...next[idx], [field]: value };
    setItens(next);
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#5850ec] flex items-center gap-2">
          <MessageCircleQuestion size={24} /> Respostas do Chatbot
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Edite as respostas fixas que o assistente do WhatsApp envia nas dúvidas frequentes. As
          alterações valem imediatamente, sem precisar de deploy.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="animate-spin mr-2" size={20} /> Carregando...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Aviso sobre a dúvida de entrega (automática) */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <Truck size={18} className="text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-800">
              A dúvida de <strong>Entrega e frete</strong> é automática: o chatbot lista as cidades
              e valores direto da sua tabela de taxas de entrega. Para alterá-la, use a tela{" "}
              <em>Entrega (Bairros / Taxas / Área)</em>.
            </p>
          </div>

          {itens.map((item, idx) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 gap-3">
                <Input
                  value={item.titulo}
                  onChange={(e) => update(idx, "titulo", e.target.value)}
                  className="font-semibold text-gray-800"
                  placeholder="Título da dúvida"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-500">{item.ativo ? "Ativa" : "Inativa"}</span>
                  <Switch checked={item.ativo} onCheckedChange={(v) => update(idx, "ativo", v)} />
                </div>
              </div>

              <Textarea
                value={item.conteudo}
                onChange={(e) => update(idx, "conteudo", e.target.value)}
                rows={7}
                className="text-sm"
                placeholder="Texto da resposta que o cliente recebe no WhatsApp"
              />

              <div className="flex justify-end mt-3">
                <Button
                  onClick={() => saveMutation.mutate(item)}
                  disabled={saveMutation.isPending}
                  className="bg-[#5850ec] text-white"
                  size="sm"
                >
                  {saveMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}{" "}
                  Salvar
                </Button>
              </div>
            </div>
          ))}

          {itens.length === 0 && (
            <p className="text-center text-gray-400 py-10">Nenhuma resposta cadastrada ainda.</p>
          )}
        </div>
      )}
    </div>
  );
}
