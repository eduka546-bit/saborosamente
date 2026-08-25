import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Gift, Copy, Share2, Check, Users, TrendingUp, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/indicar")({
  head: () => ({
    meta: [
      { title: "Indique e Ganhe | Saborosamente" },
      {
        name: "description",
        content: "Indique amigos e ganhe cashback a cada pedido feito pela sua indicação.",
      },
    ],
  }),
  component: IndicarPage,
});

function IndicarPage() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<any>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  // Gera/busca código de indicação do usuário
  const { data: profile, isLoading } = useQuery({
    queryKey: ["indicacao-profile", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, nome, codigo_indicacao")
        .eq("id", session.user.id)
        .single();
      return data;
    },
  });

  // Gera código se não tiver
  const gerarCodigoMutation = useMutation({
    mutationFn: async () => {
      const sufixo = Math.random().toString(36).slice(2, 7).toUpperCase();
      const codigo = `IND-${sufixo}`;
      const { error } = await supabase
        .from("profiles")
        .update({ codigo_indicacao: codigo })
        .eq("id", session.user.id);
      if (error) throw error;
      return codigo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["indicacao-profile"] }),
  });

  const { data: indicacoes = [] } = useQuery({
    queryKey: ["minhas-indicacoes", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("indicacoes")
        .select("*")
        .eq("indicador_user_id", session.user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    if (profile && !profile.codigo_indicacao && !isLoading) {
      gerarCodigoMutation.mutate();
    }
  }, [profile, isLoading]);

  const linkIndicacao = profile?.codigo_indicacao
    ? `${typeof window !== "undefined" ? window.location.origin : "https://saborosamente.vercel.app"}/?ref=${profile.codigo_indicacao}`
    : "";

  const copiarLink = () => {
    if (!linkIndicacao) return;
    navigator.clipboard.writeText(linkIndicacao);
    setCopiado(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopiado(false), 2000);
  };

  const compartilhar = async () => {
    if (!linkIndicacao) return;
    if (navigator.share) {
      await navigator.share({
        title: "Saborosamente — Marmitas Congeladas Artesanais",
        text: "Use meu link e ganhe desconto no primeiro pedido! 🍱",
        url: linkIndicacao,
      });
    } else {
      copiarLink();
    }
  };

  const totalConvertidas = indicacoes.filter(
    (i: any) => i.status === "convertido" || i.status === "pago",
  ).length;
  const totalCashback = indicacoes.reduce(
    (s: number, i: any) => s + (Number(i.cashback_gerado) || 0),
    0,
  );

  if (!session) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center space-y-4">
        <Gift size={48} className="text-primary/30" />
        <h1 className="text-2xl font-bold">Indique e Ganhe</h1>
        <p className="text-gray-500 max-w-xs">
          Faça login para gerar seu link de indicação e ganhar cashback a cada amigo que comprar.
        </p>
        <Link
          to="/auth"
          search={{ redirect: "/indicar" }}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold text-sm hover:bg-primary/90 transition-all"
        >
          Entrar / Cadastrar
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
          <Gift size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Indique e Ganhe</h1>
        <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
          A cada amigo que fizer o primeiro pedido usando seu link, você ganha{" "}
          <strong>R$ 5,00</strong> de cashback automático 🎉
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border p-5 text-center">
          <p className="text-3xl font-black text-primary">{totalConvertidas}</p>
          <p className="text-xs text-gray-400 font-bold uppercase mt-1">Indicações convertidas</p>
        </div>
        <div className="bg-white rounded-2xl border p-5 text-center">
          <p className="text-3xl font-black text-green-600">
            R$ {totalCashback.toFixed(2).replace(".", ",")}
          </p>
          <p className="text-xs text-gray-400 font-bold uppercase mt-1">Cashback acumulado</p>
        </div>
      </div>

      {/* Link */}
      <div className="bg-white rounded-2xl border p-5 space-y-4 mb-6">
        <p className="font-bold text-gray-800 text-sm">Seu link de indicação</p>
        {isLoading || !profile?.codigo_indicacao ? (
          <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border rounded-xl px-3 py-2.5 text-xs font-mono text-gray-600 truncate">
              {linkIndicacao}
            </div>
            <button
              onClick={copiarLink}
              className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all shrink-0"
            >
              {copiado ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        )}
        <button
          onClick={compartilhar}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-all"
        >
          <Share2 size={16} /> Compartilhar link
        </button>
      </div>

      {/* Como funciona */}
      <div className="bg-white rounded-2xl border p-5 mb-6">
        <p className="font-bold text-gray-800 mb-4">Como funciona</p>
        <div className="space-y-3">
          {[
            { icon: Share2, texto: "Compartilhe seu link com amigos" },
            { icon: Users, texto: "Amigo faz o primeiro pedido pelo link" },
            { icon: TrendingUp, texto: "Você ganha R$ 5,00 de cashback automaticamente" },
            { icon: Gift, texto: "Use o cashback como desconto nos seus pedidos" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon size={14} className="text-primary" />
              </div>
              <p className="text-sm text-gray-700">{item.texto}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Histórico */}
      {indicacoes.length > 0 && (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="px-5 py-4 border-b">
            <p className="font-bold text-gray-800 text-sm">Histórico de Indicações</p>
          </div>
          <div className="divide-y">
            {(indicacoes as any[]).map((ind) => (
              <div key={ind.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{ind.indicado_telefone}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(ind.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      ind.status === "convertido" || ind.status === "pago"
                        ? "bg-green-50 text-green-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {ind.status === "convertido" || ind.status === "pago"
                      ? "✓ Convertido"
                      : "Aguardando"}
                  </span>
                  {ind.cashback_gerado > 0 && (
                    <p className="text-xs text-green-600 font-bold mt-0.5">
                      +R$ {Number(ind.cashback_gerado).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
