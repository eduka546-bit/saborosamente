import { useState } from "react";
import { History, FileUp, Loader2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  lerExportacaoWhatsApp, prepararMensagensWhatsApp,
  type ResultadoLeituraWhatsApp,
} from "@/lib/whatsapp-history-import";

type Props = {
  conversaId:string;
  contato:string;
  telefone:string;
  dark:boolean;
};

export function WhatsAppHistoricoImport({conversaId,contato,telefone,dark}:Props){
  const queryClient=useQueryClient();
  const [aberto,setAberto]=useState(false);
  const [arquivo,setArquivo]=useState("");
  const [dados,setDados]=useState<ResultadoLeituraWhatsApp|null>(null);
  const [empresa,setEmpresa]=useState("");
  const [confirmado,setConfirmado]=useState(false);
  const [erro,setErro]=useState("");
  const [lendo,setLendo]=useState(false);
  const [importando,setImportando]=useState(false);
  const [processadas,setProcessadas]=useState(0);

  const escolherArquivo=async(file:File|undefined)=>{
    setDados(null);setEmpresa("");setConfirmado(false);setErro("");setProcessadas(0);
    if(!file)return;
    if(!/\.txt$/i.test(file.name)||file.size>20*1024*1024){
      setErro("Selecione a exportação .txt do WhatsApp, sem mídia, de até 20 MB.");
      return;
    }
    setLendo(true);
    try{
      const texto=await file.text();
      const lido=lerExportacaoWhatsApp(texto);
      if(!lido.mensagens.length)throw new Error(
        "Não encontrei mensagens reconhecíveis. Exporte uma conversa individual sem mídia."
      );
      if(lido.participantes.length>2)throw new Error(
        "Foram encontrados mais de dois remetentes. Não importe arquivos de grupos."
      );
      setArquivo(file.name);setDados(lido);
    }catch(e){setErro(e instanceof Error?e.message:"Não foi possível ler o arquivo.");}
    finally{setLendo(false);}
  };

  const importar=async()=>{
    if(!dados||!empresa||!confirmado||importando)return;
    setErro("");setImportando(true);setProcessadas(0);
    try{
      const mensagens=prepararMensagensWhatsApp(dados,empresa);
      for(let inicio=0;inicio<mensagens.length;inicio+=150){
        const lote=mensagens.slice(inicio,inicio+150);
        const {data,error}=await supabase.functions.invoke("whatsapp-historico-importar",{
          body:{conversaId,confirmado:true,mensagens:lote},
        });
        if(error||!data?.success)throw new Error(
          data?.error||error?.message||"Falha ao salvar parte do histórico."
        );
        setProcessadas(Math.min(inicio+150,mensagens.length));
      }
      await Promise.all([
        queryClient.invalidateQueries({queryKey:["whatsapp-historico",conversaId]}),
        queryClient.invalidateQueries({queryKey:["whatsapp-conversas"]}),
      ]);
      toast.success("Histórico importado. As mensagens antigas foram arquivadas sem enviar nada ao cliente.");
      setAberto(false);setDados(null);setArquivo("");setEmpresa("");setConfirmado(false);
    }catch(e){
      setErro((e instanceof Error?e.message:"Falha na importação.")+
        " Os lotes já salvos serão reconhecidos sem duplicar caso tente novamente.");
    }finally{setImportando(false);}
  };
  const estilo=dark?"bg-[#202c33] text-[#e9edef] border-[#35454f]":"bg-white text-[#202c33] border-slate-200";
  return <>
    <button type="button" onClick={()=>setAberto(true)}
      title="Recuperar conversas antigas do WhatsApp Business por exportação de chat"
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold hover:bg-black/10">
      <History size={15}/> Histórico antigo
    </button>
    {aberto && <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-3"
      role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!importando)setAberto(false);}}>
      <section role="dialog" aria-modal="true" aria-label="Importar histórico do WhatsApp"
        className={"w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-xl border p-4 shadow-xl "+estilo}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-base font-bold"><History size={18}/> Importar histórico antigo</h3>
          <button type="button" aria-label="Fechar" disabled={importando} onClick={()=>setAberto(false)}
            className="rounded p-1.5 hover:bg-black/10 disabled:opacity-50"><X size={18}/></button>
        </div>
        <p className="mt-3 text-xs leading-relaxed opacity-80">
          A importação automática depende de a Meta enviar o histórico antigo. Caso isso não tenha acontecido,
          abra esta conversa no WhatsApp Business, escolha <strong>Exportar conversa → Sem mídia</strong> e selecione
          o arquivo <strong>.txt</strong> abaixo. O arquivo original não é armazenado no servidor.
        </p>
        <p className="mt-2 rounded-lg border border-current/20 px-3 py-2 text-xs">
          <strong>Conversa selecionada:</strong> {contato||"Contato"} · {telefone}
        </p>
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#00a884]/60 px-3 py-4 text-xs font-semibold text-[#00a884]">
          <FileUp size={16}/>
          {lendo?"Lendo arquivo...":arquivo||"Selecionar exportação .txt (sem mídia)"}
          <input className="sr-only" type="file" accept=".txt,text/plain" disabled={importando||lendo}
            onChange={e=>void escolherArquivo(e.target.files?.[0])}/>
        </label>
        {dados && <>
          <p className="mt-3 text-xs font-medium">
            Encontradas <strong>{dados.mensagens.length.toLocaleString("pt-BR")} mensagens</strong>.
            {dados.ignoradas>0?" "+dados.ignoradas+" linha(s)/mensagem(ns) não reconhecidas.":""}
          </p>
          <label htmlFor="remetente-empresa-whatsapp" className="mt-3 block text-xs font-semibold">
            Qual remetente representa a SaborosaMente neste arquivo?
          </label>
          <select id="remetente-empresa-whatsapp" value={empresa} disabled={importando}
            onChange={e=>{setEmpresa(e.target.value);setConfirmado(false);}}
            className={"mt-1 w-full rounded-lg border p-2 text-sm "+estilo}>
            <option value="">Selecione o remetente da loja</option>
            {dados.participantes.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
          <div className="mt-3 space-y-1 rounded-lg border border-current/15 p-2 text-xs">
            <strong>Prévia do arquivo</strong>
            {[...dados.mensagens.slice(0,2),...dados.mensagens.slice(-2)].map((m,i)=>
              <p key={i} className="break-words">
                {new Date(m.timestamp).toLocaleDateString("pt-BR")} · <b>{m.remetente}:</b> {m.texto.slice(0,100)}
              </p>)}
          </div>
          <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed">
            <input type="checkbox" checked={confirmado} disabled={importando}
              onChange={e=>setConfirmado(e.target.checked)} className="mt-0.5"/>
            Confirmo que este arquivo pertence à conversa indicada acima, escolhi corretamente o remetente
            da loja e autorizo arquivar estas mensagens. Nenhuma resposta será enviada ao cliente.
          </label>
        </>}
        {importando && <p className="mt-3 text-xs font-semibold text-[#00a884]">
          Arquivando mensagens: {processadas} de {dados?.mensagens.length??0}...
        </p>}
        {erro && <p role="alert" className="mt-3 rounded-lg bg-red-500/10 p-2 text-xs text-red-500">{erro}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" disabled={importando} onClick={()=>setAberto(false)}
            className="rounded-lg border border-current/20 px-3 py-2 text-xs">Cancelar</button>
          <button type="button" disabled={!dados||!empresa||!confirmado||importando||lendo}
            onClick={()=>void importar()}
            className="flex items-center gap-2 rounded-lg bg-[#008069] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
            {importando&&<Loader2 size={14} className="animate-spin"/>}
            Arquivar histórico nesta conversa
          </button>
        </div>
      </section>
    </div>}
  </>;
}
