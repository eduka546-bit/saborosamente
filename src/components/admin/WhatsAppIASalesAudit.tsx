import { useEffect, useState } from "react";
import { CheckCircle2, Download, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CENARIOS_VENDA } from "@/lib/whatsapp-ia-sales-scenarios";

type Resposta = {
  runId: string;id:number;categoria:string;pergunta:string;resposta:string;
  alertas:string[];status:string;revisao:"pendente"|"correta"|"incorreta";observacoes:string;
};
async function carregarRespostas():Promise<Resposta[]> {
  const api=supabase as any;
  const {data:lotes,error:e1}=await api.from("whatsapp_ia_audit_runs")
    .select("id,primeiro_id,estado").eq("rodada",6).eq("estado","concluido")
    .order("primeiro_id",{ascending:true}).limit(20);
  if(e1)throw e1;
  if((lotes??[]).length!==10)throw new Error("A rodada de 100 simulações ainda não foi concluída. Atualize a página.");
  const ids=lotes.map((l:any)=>l.id);
  const {data:rows,error:e2}=await api.from("whatsapp_ia_audit_results")
    .select("run_id,cenario_id,categoria,pergunta,resposta,alertas,status,erro,revisao,observacoes")
    .in("run_id",ids).order("cenario_id",{ascending:true}).range(0,199);
  if(e2)throw e2;
  const respostas:Resposta[]=(rows??[]).map((r:any)=>({
    runId:String(r.run_id),id:Number(r.cenario_id),
    categoria:String(r.categoria),pergunta:String(r.pergunta),
    resposta:String(r.resposta??r.erro??""),alertas:Array.isArray(r.alertas)?r.alertas.map(String):[],
    status:String(r.status),revisao:["correta","incorreta"].includes(r.revisao)?r.revisao:"pendente",
    observacoes:String(r.observacoes??""),
  }));
  respostas.sort((a,b)=>a.id-b.id);
  if(respostas.length!==100 || new Set(respostas.map(r=>r.id)).size!==100 ||
    respostas[0]?.id!==1 || respostas[99]?.id!==100)
    throw new Error("O servidor retornou "+respostas.length+" resultados, e não as 100 simulações completas.");
  return respostas;
}
function exportar(respostas:Resposta[]) {
  const dados={geradoEm:new Date().toISOString(),
    aviso:"As respostas simuladas não foram enviadas a clientes; casos sem alerta ainda exigem revisão humana.",
    resultados:respostas};
  const blob=new Blob([JSON.stringify(dados,null,2)],{type:"application/json;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download="auditoria-ia-vendas-saborosamente.json";
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export function WhatsAppIASalesAudit({dark}:{dark:boolean}) {
  const [respostas,setRespostas]=useState<Resposta[]>([]);
  const [carregando,setCarregando]=useState(true);
  const [erro,setErro]=useState("");
  const [busca,setBusca]=useState("");
  const [categoria,setCategoria]=useState("todos");
  const [filtro,setFiltro]=useState("todos");
  const [mensagem,setMensagem]=useState("");
  useEffect(()=>{
    let ativo=true;
    void carregarRespostas().then(r=>{if(ativo){setRespostas(r);setErro("");}})
      .catch(e=>{if(ativo)setErro(e instanceof Error?e.message:"Não foi possível consultar a auditoria.");})
      .finally(()=>{if(ativo)setCarregando(false);});
    return ()=>{ativo=false;};
  },[]);
  const recarregar=async()=>{
    setCarregando(true);setErro("");setMensagem("");
    try{setRespostas(await carregarRespostas());}
    catch(e){setErro(e instanceof Error?e.message:"Falha ao carregar os resultados.");}
    finally{setCarregando(false);}
  };
  const revisar=async(r:Resposta,valor:Resposta["revisao"])=>{
    const antigo=r.revisao;
    setRespostas(v=>v.map(x=>x.id===r.id?{...x,revisao:valor}:x));
    const {error}=await (supabase as any).from("whatsapp_ia_audit_results")
      .update({revisao:valor}).eq("run_id",r.runId).eq("cenario_id",r.id);
    if(error){
      setRespostas(v=>v.map(x=>x.id===r.id?{...x,revisao:antigo}:x));
      setMensagem("Não consegui salvar a revisão. Confirme o acesso administrativo.");
    }
  };
  const salvarNota=async(r:Resposta,nota:string)=>{
    const {error}=await (supabase as any).from("whatsapp_ia_audit_results")
      .update({observacoes:nota.slice(0,1000)}).eq("run_id",r.runId).eq("cenario_id",r.id);
    if(error)setMensagem("Não consegui salvar a observação. Tente novamente.");
  };
  const categorias=[...new Set(CENARIOS_VENDA.map(c=>c.categoria))];
  const q=busca.trim().toLocaleLowerCase("pt-BR");
  const visiveis=respostas.filter(r=>(categoria==="todos"||r.categoria===categoria) &&
    (filtro==="todos"||filtro==="pendentes"&&r.revisao==="pendente"||
      filtro==="incorretos"&&r.revisao==="incorreta"||filtro==="alertas"&&r.alertas.length>0) &&
    (!q || [String(r.id),r.categoria,r.pergunta,r.resposta].some(x=>x.toLocaleLowerCase("pt-BR").includes(q))));
  const aprovados=respostas.filter(r=>r.revisao==="correta").length;
  const incorretos=respostas.filter(r=>r.revisao==="incorreta").length;
  const alertas=respostas.filter(r=>r.alertas.length>0).length;
  return <section className={"space-y-3 rounded-xl border p-3 text-sm "+(dark?"border-[#3b4a54] bg-[#182229] text-white":"border-gray-200 bg-white text-gray-900")}>
    <div className="flex flex-wrap items-center gap-2">
      <ShieldCheck size={18} className="text-[#00a884]"/>
      <h3 className="font-bold">Auditoria de 100 simulações reais de venda</h3>
      <button type="button" onClick={()=>void recarregar()} disabled={carregando}
        className="ml-auto inline-flex items-center gap-1 rounded-lg border border-current/20 px-2 py-1 text-xs disabled:opacity-50">
        <RefreshCw size={13}/>{carregando?"Carregando...":"Atualizar"}
      </button>
    </div>
    <p className="text-xs opacity-75">Respostas geradas pela OpenAI e verificadas com catálogo e preços reais em cenários fictícios. Nenhuma mensagem foi enviada. Pendências podem significar que a IA pediu informações adicionais corretamente, não necessariamente um erro.</p>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {[
        ["Resultados",respostas.length],["Com pendências",alertas],["Aprovados por você",aprovados],["Marcados incorretos",incorretos],
      ].map(([titulo,valor])=><div key={String(titulo)} className="rounded-lg border border-current/15 p-2">
        <p className="text-[11px] opacity-70">{titulo}</p><p className="text-xl font-bold">{valor}</p>
      </div>)}
    </div>
    {erro&&<p role="alert" className="rounded-lg border border-amber-500/50 p-2 text-xs text-amber-600">{erro}</p>}
    {mensagem&&<p className="text-xs text-orange-500">{mensagem}</p>}
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Categoria de vendas" value={categoria} onChange={e=>setCategoria(e.target.value)}
        className="min-w-0 rounded-lg border border-current/20 bg-transparent p-2 text-xs">
        <option className="text-black" value="todos">Todos os temas</option>
        {categorias.map(c=><option key={c} value={c} className="text-black">{c}</option>)}
      </select>
      <select aria-label="Filtrar revisão das vendas" value={filtro} onChange={e=>setFiltro(e.target.value)}
        className="rounded-lg border border-current/20 bg-transparent p-2 text-xs">
        <option className="text-black" value="todos">Todas</option>
        <option className="text-black" value="pendentes">Não revisadas</option>
        <option className="text-black" value="incorretos">Incorretas</option>
        <option className="text-black" value="alertas">Com pendências</option>
      </select>
      <input type="search" value={busca} onChange={e=>setBusca(e.target.value)}
        aria-label="Buscar perguntas de vendas" placeholder="Buscar pergunta ou número"
        className="min-w-0 flex-1 rounded-lg border border-current/20 bg-transparent p-2 text-xs"/>
      <button type="button" disabled={!respostas.length} onClick={()=>exportar(respostas)}
        className="inline-flex items-center gap-1 rounded-lg border border-current/20 px-2 py-2 text-xs disabled:opacity-40">
        <Download size={14}/> Exportar
      </button>
    </div>
    <div className="flex flex-wrap justify-between gap-2 rounded-lg border border-current/15 p-2 text-xs">
      <strong>Mostrando {visiveis.length} de {respostas.length} respostas — 001 a 100</strong>
      {(busca||categoria!=="todos"||filtro!=="todos")&&<button type="button"
        className="font-semibold text-[#00a884] underline"
        onClick={()=>{setBusca("");setCategoria("todos");setFiltro("todos");}}>Mostrar todas</button>}
    </div>
    {!respostas.length&&!carregando&&!erro&&<p className="text-xs">Não há respostas salvas.</p>}
    <div className="space-y-2">
      {visiveis.map(r=><details key={r.id} className="rounded-lg border border-current/15 p-3">
        <summary className="cursor-pointer text-xs font-semibold">
          #{String(r.id).padStart(3,"0")} · {r.categoria} · {r.revisao==="correta"?"Aprovada":r.revisao==="incorreta"?"Incorreta":"A revisar"}
          {r.status==="erro"?" · Falha técnica":""}
          <span className="mt-1 block font-normal opacity-80">{r.pergunta}</span>
        </summary>
        <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-[#00a884]/10 p-2 text-xs">{r.resposta||"(sem resposta)"}</p>
        {r.alertas.map((a,i)=><p key={i} className="mt-1 text-xs text-amber-600">⚠ {a}</p>)}
        <label htmlFor={"sales-review-note-"+r.id} className="mt-3 block text-[11px] opacity-70">Observações e correções</label>
        <textarea id={"sales-review-note-"+r.id} rows={2} maxLength={1000}
          value={r.observacoes} onChange={e=>setRespostas(v=>v.map(x=>x.id===r.id?{...x,observacoes:e.target.value}:x))}
          onBlur={e=>void salvarNota(r,e.target.value)} placeholder="O que você gostaria de mudar?"
          className="mt-1 w-full resize-y rounded border border-current/20 bg-transparent p-2 text-xs"/>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={()=>void revisar(r,"correta")}
            className="inline-flex items-center gap-1 rounded-lg border border-green-600 px-2 py-1 text-xs text-green-600">
            <CheckCircle2 size={13}/> Correta
          </button>
          <button type="button" onClick={()=>void revisar(r,"incorreta")}
            className="rounded-lg border border-orange-500 px-2 py-1 text-xs text-orange-500">Incorreta</button>
          <button type="button" onClick={()=>void revisar(r,"pendente")}
            className="rounded-lg border border-current/20 px-2 py-1 text-xs">Pendente</button>
        </div>
      </details>)}
    </div>
  </section>;
}
