import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Save, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/config/origem")({
  component: AdminConfigOrigemPage,
});

function AdminConfigOrigemPage() {
  const queryClient = useQueryClient();
  const [origens, setOrigens] = useState<string[]>([]);
  const [nova, setNova] = useState("");

  const { isLoading } = useQuery({
    queryKey: ["config-origem"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("como_nos_conheceu")
        .maybeSingle();
      if (Array.isArray(data?.como_nos_conheceu)) setOrigens(data.como_nos_conheceu as string[]);
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .update({ como_nos_conheceu: origens } as any)
        .neq("id", "");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-origem"] });
      toast.success("Opções salvas!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const add = () => {
    if (!nova.trim()) return;
    setOrigens([...origens, nova.trim()]);
    setNova("");
  };

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Como nos Conheceu</h1>
        <p className="text-gray-500 text-sm mt-1">
          Opções exibidas no cadastro / checkout para o cliente indicar como encontrou a loja.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="space-y-2">
            {origens.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma opção cadastrada.</p>
            )}
            {origens.map((o, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="flex-1 text-sm text-gray-800">{o}</span>
                <button
                  onClick={() => setOrigens(origens.filter((_, idx) => idx !== i))}
                  className="text-gray-300 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={nova}
              onChange={(e) => setNova(e.target.value)}
              placeholder="Nova opção (ex: Instagram)"
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <Button variant="outline" onClick={add} className="shrink-0">
              <Plus size={16} />
            </Button>
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full bg-[#5850ec] text-white"
          >
            {saveMutation.isPending ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Save size={16} className="mr-2" />
            )}{" "}
            Salvar
          </Button>
        </div>
      )}
    </div>
  );
}
