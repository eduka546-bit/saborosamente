import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { emailMarketingAdmin } from "@/lib/email-marketing.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, Users, Send, Clock, Eye, RefreshCw, ShieldCheck, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/email-marketing")({
  component: EmailMarketingPage,
  ssr: false,
});

type Aba = "criar" | "contatos" | "historico";
type Broadcast = { id: string; name?: string; subject?: string; status?: string; created_at?: string; scheduled_at?: string; sent_at?: string };
type Contact = { id: string; email: string; first_name?: string; last_name?: string; unsubscribed?: boolean };

const INITIAL = {
  nome: "", assunto: "", previa: "", mensagem: "",
  botaoTexto: "Fazer meu pedido", botaoUrl: "https://saborosamente.com",
  imagemUrl: "",
};

async function token() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error("Sua sessão expirou. Faça login novamente.");
  return data.session.access_token;
}

const dataBr = (data?: string) =>
  data ? new Date(data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

const statusLabel: Record<string, string> = {
  draft: "Rascunho", scheduled: "Agendada", queued: "Na fila",
  sent: "Enviada", sending: "Enviando", failed: "Falhou", cancelled: "Cancelada",
};

function EmailMarketingPage() {
  const queryClient = useQueryClient();
  const [aba, setAba] = useState<Aba>("criar");
  const [form, setForm] = useState(INITIAL);
  const [nomeContato, setNomeContato] = useState("");
  const [emailContato, setEmailContato] = useState("");
  const [consentimento, setConsentimento] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [agendar, setAgendar] = useState("");
  const [detalhes, setDetalhes] = useState<any>(null);
  const [busca, setBusca] = useState("");

  const overview = useQuery({
    queryKey: ["email-marketing-overview"],
    queryFn: async () => emailMarketingAdmin({ data: { action: "overview", token: await token() } }),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  const info = overview.data as any;
  const contatos = (info?.contacts ?? []) as Contact[];
  const campanhas = (info?.broadcasts ?? []) as Broadcast[];
  const contatosAtivos = contatos.filter(c => !c.unsubscribed).length;

  async function executar(fn: () => Promise<unknown>, ok: string) {
    if (ocupado) return;
    setOcupado(true);
    try {
      await fn();
      toast.success(ok);
      await queryClient.invalidateQueries({ queryKey: ["email-marketing-overview"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível concluir a operação.");
    } finally {
      setOcupado(false);
    }
  }

  const adicionarContato = (e: FormEvent) => {
    e.preventDefault();
    if (!consentimento) return toast.error("Confirme a autorização de marketing antes de adicionar.");
    void executar(async () => {
      await emailMarketingAdmin({
        data: { action: "add_contact", token: await token(), nome: nomeContato, email: emailContato, consentConfirmed: true },
      });
      setNomeContato(""); setEmailContato(""); setConsentimento(false);
    }, "Contato inscrito na lista de e-mail.");
  };

  const criarRascunho = (e: FormEvent) => {
    e.preventDefault();
    void executar(async () => {
      const result = await emailMarketingAdmin({
        data: { action: "create_draft", token: await token(), ...form },
      });
      if (result.action === "create_draft") {
        setForm(INITIAL);
        setAba("historico");
      }
    }, "Rascunho criado no Resend, ainda não enviado.");
  };

  const enviar = (campanha: Broadcast) => {
    if (contatosAtivos === 0) return toast.error("Adicione primeiro contatos que autorizaram receber e-mails.");
    if (info?.contactsMore) return toast.error("A lista ultrapassa 100 contatos: revise a audiência no Resend antes do envio.");
    if (!window.confirm(
      `Confirma ${agendar ? "AGENDAR" : "ENVIAR"} a campanha "${campanha.name || campanha.subject}" para até ${contatosAtivos} contato(s) inscrito(s)?\n\nEssa ação pode gerar disparos reais pelo Resend.`
    )) return;
    void executar(async () => {
      await emailMarketingAdmin({
        data: {
          action: "send", id: campanha.id, token: await token(), confirmed: true,
          ...(agendar ? { scheduledAt: new Date(agendar).toISOString() } : {}),
        },
      });
      setAgendar("");
    }, agendar ? "Campanha agendada no Resend." : "Envio iniciado no Resend.");
  };

  const verDetalhes = (campanha: Broadcast) => {
    void executar(async () => {
      const result = await emailMarketingAdmin({
        data: { action: "details", id: campanha.id, token: await token() },
      });
      if (result.action === "details") setDetalhes(result.broadcast);
    }, "Detalhes atualizados.");
  };

  const campo = (key: keyof typeof INITIAL, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="mx-auto min-h-screen max-w-[1450px] space-y-6 p-4 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#064D2F]"><Mail className="h-6 w-6" /><h1 className="text-2xl font-black md:text-3xl">E-mail Marketing</h1></div>
          <p className="mt-1 text-sm text-gray-600">Campanhas de e-mail independentes do WhatsApp, integradas ao Resend.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => overview.refetch()} disabled={overview.isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${overview.isFetching ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {overview.isError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Não foi possível carregar os dados do Resend: {overview.error instanceof Error ? overview.error.message : "tente novamente."}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Contatos inscritos", val: contatosAtivos, icon: Users },
          { label: "Rascunhos", val: campanhas.filter(c => c.status === "draft").length, icon: Mail },
          { label: "Campanhas enviadas", val: campanhas.filter(c => c.status === "sent").length, icon: Send },
          { label: "Agendadas", val: campanhas.filter(c => c.status === "scheduled").length, icon: Clock },
        ].map(({label,val,icon:Icon}) => (
          <div key={label} className="rounded-2xl border border-[#dae7d8] bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#58715d]"><Icon size={15} />{label}</div>
            <p className="mt-3 text-3xl font-black text-[#064D2F]">{val}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {([
          ["criar", "Criar campanha", Plus],
          ["contatos", "Lista de e-mails", Users],
          ["historico", "Histórico e envios", Clock],
        ] as const).map(([id, nome, Icon]) => (
          <button key={id} type="button" onClick={() => setAba(id)}
            className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${aba === id ? "bg-[#064D2F] text-white" : "bg-white text-[#315640] hover:bg-[#eaf2e4]"}`}>
            <Icon size={16} />{nome}
          </button>
        ))}
      </div>

      {aba === "criar" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <form onSubmit={criarRascunho} className="space-y-4 rounded-2xl border bg-white p-5">
            <div><h2 className="text-lg font-bold text-[#064D2F]">Nova campanha</h2><p className="text-sm text-gray-500">Crie e revise o e-mail antes de disparar. Salvar não envia nada.</p></div>
            <label className="block space-y-1 text-sm font-semibold">Nome interno da campanha
              <Input required minLength={3} placeholder="Ex.: Promoção de fim de mês" value={form.nome} onChange={e => campo("nome",e.target.value)} />
            </label>
            <label className="block space-y-1 text-sm font-semibold">Assunto do e-mail
              <Input required minLength={3} maxLength={180} placeholder="Tem novidade saborosa esperando você!" value={form.assunto} onChange={e => campo("assunto",e.target.value)} />
            </label>
            <label className="block space-y-1 text-sm font-semibold">Texto de prévia (opcional)
              <Input maxLength={180} placeholder="Aparece ao lado do assunto na caixa de entrada" value={form.previa} onChange={e => campo("previa",e.target.value)} />
            </label>
            <label className="block space-y-1 text-sm font-semibold">Mensagem
              <Textarea required rows={7} minLength={8} placeholder="Escreva a mensagem. Separe parágrafos com uma linha vazia." value={form.mensagem} onChange={e => campo("mensagem",e.target.value)} />
            </label>
            <label className="block space-y-1 text-sm font-semibold">URL da imagem (opcional)
              <Input type="url" placeholder="https://..." value={form.imagemUrl} onChange={e => campo("imagemUrl",e.target.value)} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-sm font-semibold">Texto do botão
                <Input value={form.botaoTexto} onChange={e => campo("botaoTexto",e.target.value)} />
              </label>
              <label className="block space-y-1 text-sm font-semibold">Destino do botão
                <Input type="url" value={form.botaoUrl} onChange={e => campo("botaoUrl",e.target.value)} />
              </label>
            </div>
            <Button disabled={ocupado || !form.assunto || !form.mensagem} className="w-full bg-[#064D2F] hover:bg-[#003923]" type="submit">
              {ocupado ? "Salvando..." : "Salvar rascunho (sem enviar)"}
            </Button>
          </form>
          <div className="space-y-3">
            <h2 className="font-bold text-[#064D2F]">Prévia do e-mail</h2>
            <div className="overflow-hidden rounded-2xl border border-[#dce6d4] bg-white shadow-sm">
              <div className="bg-[#064D2F] p-7 text-center text-white"><div className="text-2xl font-black">SaborosaMente</div><div className="mt-1 text-xs text-[#dbeac9]">Sabor e praticidade para seu dia a dia</div></div>
              {form.imagemUrl.startsWith("https://") && (
                <img src={form.imagemUrl} className="h-48 w-full object-cover" alt="Prévia da imagem da campanha" />
              )}
              <div className="space-y-5 p-7">
                <h3 className="text-2xl font-black leading-tight text-[#064D2F]">{form.assunto || "Assunto da sua campanha"}</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#405143]">{form.mensagem || "A mensagem do seu e-mail aparecerá aqui."}</p>
                {form.botaoTexto && form.botaoUrl && <div><span className="inline-block rounded-lg bg-[#8BB924] px-5 py-3 text-sm font-bold text-[#003923]">{form.botaoTexto}</span></div>}
              </div>
              <div className="bg-[#f2f6ec] p-5 text-center text-xs text-gray-600">Você recebe novidades da SaborosaMente.<p className="mt-2 underline">Cancelar inscrição</p></div>
            </div>
            <p className="text-xs text-gray-500">Visual ilustrativo. O e-mail real utiliza HTML compatível com aplicativos de e-mail e inclui cancelamento automático.</p>
          </div>
        </div>
      )}

      {aba === "contatos" && (
        <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
          <form onSubmit={adicionarContato} className="h-fit space-y-4 rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-bold text-[#064D2F]">Adicionar contato autorizado</h2>
            <label className="block space-y-1 text-sm font-semibold">Nome
              <Input required minLength={2} value={nomeContato} onChange={e => setNomeContato(e.target.value)} placeholder="Nome do cliente" />
            </label>
            <label className="block space-y-1 text-sm font-semibold">E-mail
              <Input required type="email" value={emailContato} onChange={e => setEmailContato(e.target.value)} placeholder="cliente@email.com" />
            </label>
            <label className="flex items-start gap-2 text-xs leading-relaxed text-gray-700">
              <input className="mt-1 h-4 w-4 accent-[#064D2F]" type="checkbox" checked={consentimento} onChange={e => setConsentimento(e.target.checked)} />
              Confirmo que esta pessoa autorizou receber e-mails promocionais da SaborosaMente.
            </label>
            <Button type="submit" disabled={ocupado || !consentimento} className="w-full bg-[#064D2F] hover:bg-[#003923]">Adicionar à lista</Button>
            <div className="flex gap-2 rounded-xl bg-[#f2f6ec] p-3 text-xs leading-relaxed text-[#315640]">
              <ShieldCheck size={19} className="shrink-0" />
              A autorização por WhatsApp não vale automaticamente para e-mail. Clientes cadastrados no site não são inscritos sem consentimento.
            </div>
          </form>
          <section className="rounded-2xl border bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-[#064D2F]">Contatos do E-mail Marketing</h2>
              <span className="text-xs text-gray-500">{contatosAtivos} inscritos</span>
            </div>
            <Input className="mt-4" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail" />
            <div className="mt-4 divide-y">
              {contatos.filter(c => `${c.first_name || ""} ${c.last_name || ""} ${c.email}`.toLowerCase().includes(busca.toLowerCase())).map(c => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div><p className="font-semibold text-gray-900">{[c.first_name,c.last_name].filter(Boolean).join(" ") || "Sem nome"}</p><p className="break-all text-sm text-gray-500">{c.email}</p></div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${c.unsubscribed ? "bg-gray-100 text-gray-600" : "bg-green-50 text-green-700"}`}>{c.unsubscribed ? "Cancelou" : "Inscrito"}</span>
                </div>
              ))}
              {contatos.length === 0 && <p className="py-8 text-center text-sm text-gray-500">Nenhum contato de marketing cadastrado ainda.</p>}
            </div>
            {info?.contactsMore && <p className="mt-3 text-xs text-amber-700">Exibindo os primeiros 100 contatos; consulte o Resend para a lista completa.</p>}
          </section>
        </div>
      )}

      {aba === "historico" && (
        <section className="space-y-4 rounded-2xl border bg-white p-5">
          <div><h2 className="text-lg font-bold text-[#064D2F]">Campanhas de e-mail</h2><p className="text-sm text-gray-500">Histórico separado das campanhas de WhatsApp. Envio somente após sua confirmação.</p></div>
          <div className="space-y-3">
            {campanhas.map(c => (
              <div key={c.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><p className="font-semibold text-gray-900">{c.name || c.subject}</p><p className="mt-1 text-xs text-gray-500">{c.subject} · Criada em {dataBr(c.created_at)}</p></div>
                  <span className="rounded-full bg-[#eff5e9] px-3 py-1 text-xs font-bold text-[#064D2F]">{statusLabel[c.status || ""] || c.status || "—"}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => verDetalhes(c)} disabled={ocupado}><Eye className="mr-1 h-4 w-4" /> Detalhes</Button>
                  {c.status === "draft" && (
                    <Button type="button" size="sm" disabled={ocupado || !contatosAtivos} onClick={() => enviar(c)} className="bg-[#064D2F] hover:bg-[#003923]">
                      <Send className="mr-1 h-4 w-4" /> {agendar ? "Agendar envio" : "Enviar agora"}
                    </Button>
                  )}
                </div>
                {c.status === "draft" && (
                  <label className="mt-3 block max-w-sm space-y-1 text-xs font-medium text-gray-600">
                    Agendar para (opcional; data e hora locais)
                    <Input type="datetime-local" value={agendar} onChange={e => setAgendar(e.target.value)} />
                  </label>
                )}
                {c.scheduled_at && <p className="mt-2 text-xs text-gray-500">Agendada: {dataBr(c.scheduled_at)}</p>}
              </div>
            ))}
            {campanhas.length === 0 && <p className="py-8 text-center text-sm text-gray-500">Nenhuma campanha de e-mail criada ainda.</p>}
          </div>
          {detalhes && (
            <div className="rounded-xl border border-[#cfe0d1] bg-[#f6faf5] p-4">
              <div className="flex justify-between gap-3"><h3 className="font-bold text-[#064D2F]">{detalhes.name || detalhes.subject}</h3><button type="button" className="text-sm underline" onClick={() => setDetalhes(null)}>Fechar</button></div>
              <p className="mt-2 text-sm text-gray-600">Status: {statusLabel[detalhes.status] || detalhes.status}</p>
              {(["sent", "delivered", "opened", "clicked"] as const).some(k => typeof detalhes[k] === "number") && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(["sent","delivered","opened","clicked"] as const).map(k => <div key={k} className="rounded-lg bg-white p-3 text-sm"><div className="text-xs capitalize text-gray-500">{k}</div><strong>{detalhes[k] ?? "—"}</strong></div>)}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
