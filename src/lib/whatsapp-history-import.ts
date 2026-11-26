/** Leitor local do .txt exportado pelo WhatsApp Business (sem mídia).
 * Não envia o arquivo completo para nenhum serviço: apenas mensagens
 * revisadas pelo administrador são encaminhadas ao servidor.
 */
export type LinhaExportadaWhatsApp = { remetente:string; timestamp:string; texto:string };
export type MensagemHistoricaImportada = {
  role:"user"|"assistant";content:string;timestamp:string;manual:boolean;source:"business_app_export";
};
export type ResultadoLeituraWhatsApp = {
  mensagens:LinhaExportadaWhatsApp[];participantes:string[];ignoradas:number;
};
const LIMITE_MENSAGENS=10_000;
const LIMITE_TEXTO=10_000;
const pad=(n:number)=>String(n).padStart(2,"0");

function validarData(dia:number,mes:number,ano:number):boolean{
  const d=new Date(Date.UTC(ano,mes-1,dia));
  return d.getUTCFullYear()===ano&&d.getUTCMonth()===mes-1&&d.getUTCDate()===dia&&ano>=2000&&ano<=2100;
}
function lerCabecalho(linha:string):LinhaExportadaWhatsApp|null{
  const limpa=linha.replace(/^[\u200e\u200f\ufeff]+/,"");
  const partes=
    limpa.match(/^\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\]\s*(?:-\s*)?([^:]+):\s*(.*)$/)||
    limpa.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s+-\s+([^:]+):\s*(.*)$/);
  if(!partes)return null;
  const dia=Number(partes[1]),mes=Number(partes[2]),a=Number(partes[3]);
  const ano=a<100?2000+a:a,h=Number(partes[4]),m=Number(partes[5]),seg=Number(partes[6]||0);
  if(!validarData(dia,mes,ano)||h>23||m>59||seg>59)return null;
  const remetente=partes[7].replace(/[\u200e\u200f]/g,"").trim();
  if(!remetente||remetente.length>160)return null;
  // Exportações recentes brasileiras: hora local de São Paulo (UTC-03).
  const iso=ano+"-"+pad(mes)+"-"+pad(dia)+"T"+pad(h)+":"+pad(m)+":"+pad(seg)+"-03:00";
  const data=new Date(iso);
  if(!Number.isFinite(data.getTime()))return null;
  return {remetente,timestamp:data.toISOString(),texto:partes[8]||""};
}
export function lerExportacaoWhatsApp(texto:string):ResultadoLeituraWhatsApp{
  if(typeof texto!=="string"||texto.length>20*1024*1024)
    throw new Error("Arquivo muito grande; exporte a conversa sem mídia (limite 20 MB).");
  const mensagens:LinhaExportadaWhatsApp[]=[];
  let atual:LinhaExportadaWhatsApp|null=null;
  let ignoradas=0;
  for(const linha of texto.replace(/^\ufeff/,"").split(/\r?\n/)){
    const nova=lerCabecalho(linha);
    if(nova){
      if(atual)mensagens.push(atual);
      atual={...nova};
      if(mensagens.length>=LIMITE_MENSAGENS)
        throw new Error("Mais de 10 mil mensagens. Divida a importação.");
    }else if(atual){
      // Preserva quebras de linha, sem criar mensagens fictícias.
      atual.texto+="\n"+linha;
    }else if(linha.trim())ignoradas++;
  }
  if(atual)mensagens.push(atual);
  const validas=mensagens.map(m=>({...m,texto:m.texto.trim()}))
    .filter(m=>m.texto.length>0&&m.texto.length<=LIMITE_TEXTO);
  ignoradas+=mensagens.length-validas.length;
  return {mensagens:validas,participantes:[...new Set(validas.map(m=>m.remetente))],ignoradas};
}
export function prepararMensagensWhatsApp(
  resultado:ResultadoLeituraWhatsApp,nomeEmpresa:string,
):MensagemHistoricaImportada[]{
  if(!resultado.participantes.includes(nomeEmpresa))
    throw new Error("Selecione quem representa a SaborosaMente no arquivo.");
  if(resultado.participantes.length>2)
    throw new Error("O arquivo parece ser de um grupo. Importe apenas conversas individuais.");
  return resultado.mensagens.map(m=>({
    role:m.remetente===nomeEmpresa?"assistant":"user",
    content:m.texto,timestamp:m.timestamp,
    manual:m.remetente===nomeEmpresa,source:"business_app_export",
  }));
}
