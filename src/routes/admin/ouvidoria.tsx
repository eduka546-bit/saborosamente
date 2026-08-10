import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageSquare, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/ouvidoria")({
  component: AdminOuvidoriaPage,
});

function AdminOuvidoriaPage() {
  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["ouvidoria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ouvidoria")
        .select("*, profiles(nome, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ouvidoria").update({ status: "resolvido" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ouvidoria"] });
      toast.success("Marcado como resolvido!");
    },
  });

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Ouvidoria</h1>
        <p className="text-gray-500 text-sm mt-1">Mensagens e reclamações dos clientes.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5850ec]" size={32} /></div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed p-20 text-center">
          <MessageSquare size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400">Nenhuma mensagem na ouvidoria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((msg: any) => (
            <div key={msg.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-bold text-gray-900">{msg.profiles?.nome ?? msg.nome ?? "Anônimo"}</p>
                    <Badge className={msg.status === "resolvido" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                      {msg.status === "resolvido" ? "Resolvido" : "Pendente"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                    <Clock size={12} /> {format(new Date(msg.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  {msg.assunto && <p className="text-sm font-semibold text-gray-700 mb-1">{msg.assunto}</p>}
                  <p className="text-sm text-gray-600 leading-relaxed">{msg.mensagem ?? msg.texto ?? "—"}</p>
                </div>
                {msg.status !== "resolvido" && (
                  <Button size="sm" onClick={() => resolveMutation.mutate(msg.id)} className="bg-green-600 hover:bg-green-700 text-white shrink-0">
                    <CheckCircle2 size={14} className="mr-1" /> Resolver
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
