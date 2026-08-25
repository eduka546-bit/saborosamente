import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/config/informativo")({
  component: AdminConfigInformativoPage,
});

function AdminConfigInformativoPage() {
  const queryClient = useQueryClient();
  const [avisos, setAvisos] = useState<any[]>([]);

  const { isLoading } = useQuery({
    queryKey: ["config-informativo"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("avisos_informativos")
        .maybeSingle();
      if (Array.isArray(data?.avisos_informativos)) setAvisos(data.avisos_informativos);
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .update({ avisos_informativos: avisos } as any)
        .neq("id", "");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-informativo"] });
      toast.success("Avisos salvos!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const addAviso = () => setAvisos([...avisos, { texto: "", ativo: true }]);
  const removeAviso = (i: number) => setAvisos(avisos.filter((_, idx) => idx !== i));
  const updateAviso = (i: number, field: string, value: any) => {
    const next = [...avisos];
    next[i] = { ...next[i], [field]: value };
    setAvisos(next);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Informativos</h1>
          <p className="text-gray-500 text-sm mt-1">
            Avisos e informativos exibidos para os clientes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addAviso} className="flex items-center gap-2">
            <Plus size={16} /> Adicionar
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-[#5850ec] text-white"
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

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <div className="space-y-3">
          {avisos.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed p-12 text-center text-gray-400">
              Nenhum aviso cadastrado.
            </div>
          )}
          {avisos.map((aviso, i) => (
            <div key={i} className="bg-white rounded-xl border p-4 flex items-center gap-3">
              <Switch checked={aviso.ativo} onCheckedChange={(v) => updateAviso(i, "ativo", v)} />
              <Input
                value={aviso.texto}
                onChange={(e) => updateAviso(i, "texto", e.target.value)}
                placeholder="Texto do aviso informativo..."
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-red-500"
                onClick={() => removeAviso(i)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
