import { precoMarmitaPorFaixa, type TamanhoMarmita } from "./combo-rules.ts";
import type { montarFatosIA } from "./whatsapp-ia-facts.ts";

export type FatosComerciaisIA = ReturnType<typeof montarFatosIA>;
const formatar = (v: number) => new Intl.NumberFormat("pt-BR", {style:"currency",currency:"BRL"}).format(v);
const normalizar = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
const reQuantidade = /(\d{1,3})\s*(?:marmitas?|refeic(?:oes|ao)|unidades?|pratos?|sopas?|un\b)/g;

function faixa(qtd: number): string {
  return qtd>=20?"20 ou mais":qtd>=10?"10 a 19":qtd>=5?"5 a 9":"1 a 4";
}
function precoPorTamanho(t: TamanhoMarmita,fatos:FatosComerciaisIA,qtd:number) {
  return precoMarmitaPorFaixa(t,qtd,0,fatos.tabelaPrecosMarmitas);
}
function extrairTamanho(t:string):TamanhoMarmita|null {
  const m=t.match(/\b(200|300|400)\s*g\b/);
  return m ? (m[1]+"g" as TamanhoMarmita) : null;
}
function listarFaixas(tam:TamanhoMarmita,fatos:FatosComerciaisIA) {
  const tb=fatos.tabelaPrecosMarmitas[tam];
  return "Para marmitas de *"+tam+"*, a tabela atual é:\n"+
    "• 1 a 4 unidades: *"+formatar(tb.unit)+"* cada\n"+
    "• 5 a 9 unidades: *"+formatar(tb.t5)+"* cada\n"+
    "• 10 a 19 unidades: *"+formatar(tb.t10)+"* cada\n"+
    "• 20 ou mais: *"+formatar(tb.t20)+"* cada.\n"+
    "A faixa depende do total de itens. Frete e adicionais são calculados à parte no checkout. 💚";
}
function sufixoComercial() {
  return "\nOs valores são uma estimativa das marmitas avulsas, sem frete, adicionais ou cashback. A confirmação do pedido é feita pela equipe ou no checkout.";
}

/** Respostas com cálculos verificáveis, sem permitir que o modelo invente dados comerciais. */
export function respostaComercialDeterministica(pergunta:string, fatos:FatosComerciaisIA):string|null {
  const texto=normalizar(pergunta);
  const tamanho=extrairTamanho(texto);
  const personalizada=fatos.personalizada;

  if (/\bdebito\b/.test(texto)&&/\b(acrescimo|taxa|adicional|juros|cobram)\b/.test(texto)) {
    return "Não cobramos acréscimo para pagamento no *débito ou crédito*. Cartões alimentação e refeição também são aceitos sem taxa extra. 💚";
  }
  if (/(?:parar|cancelar|deixar|nao quero).{0,35}(?:publicidade|mensagens de marketing|ofertas|promocoes|propaganda)/.test(texto)) {
    return "Claro! Para cancelar o recebimento de campanhas e ofertas no WhatsApp, responda *PARAR* nesta conversa. Assim registramos sua preferência. 💚";
  }
  // PARAR é apenas cancelamento de publicidade. Nunca orientar a usá-lo para falar com a equipe.
  if (/\b(falar com atendente|falar com alguem|falar com uma pessoa|atendimento humano|alguem da loja|preciso de atendente|quero atendente)\b/.test(texto)) {
    return "Claro! 💚 Você pode ser atendido pela nossa equipe nesta mesma conversa. Escreva *ATENDENTE* no WhatsApp para solicitar o atendimento humano; não precisa sair do chat.";
  }
  if (/\b(entrar|participar|me adicionar|receber acesso|quero acesso)\b.{0,30}\bgrupo de ofertas\b/.test(texto)) {
    return "Que bom que você quer participar! 💚 Nosso grupo de ofertas reúne promoções e novidades. Peça o link de convite à equipe por esta conversa; a participação é opcional. A palavra PARAR serve para cancelar publicidade, não para entrar no grupo.";
  }
  if (/(?:ofertas|promocoes|publicidade).{0,25}(?:todo dia|diariamente)|(?:todo dia|diariamente).{0,25}(?:ofertas|promocoes)/.test(texto)) {
    return "Temos ofertas e novidades pelo WhatsApp e pelo grupo de ofertas! 💚 A frequência varia conforme as campanhas; não prometemos mensagens diárias. A equipe pode explicar como participar, sempre respeitando sua autorização.";
  }
  if (/(\b(alergia|alergico|contaminacao cruzada)\b|tracos de gluten|tracos de lactose|totalmente seguro para)/.test(texto)) {
    return "Para sua segurança, não podemos garantir ausência de traços de alérgenos ou contaminação cruzada sem verificação da equipe. 💚 Nossa equipe pode conferir os ingredientes e os cuidados de preparo; em caso de alergia, consulte também seu profissional de saúde.";
  }
  if (/\b(sem lactose|sem gluten)\b/.test(texto) && /(tem|voces tem|quais|opcoes)/.test(texto)) {
    return "Podemos conferir opções pelos ingredientes do cardápio, mas isso não garante ausência de traços de alérgenos. 💚 Informe o prato de interesse para nossa equipe confirmar.";
  }
  if (/(?:mais leve|mais leves|menos calorias)/.test(texto) && !tamanho) {
    return "Para recomendar os pratos mais leves com precisão, preciso usar os valores nutricionais da gramatura escolhida. 💚 Você prefere *200g, 300g ou 400g*?";
  }

  if (/(?:cardapio|catalogo)/.test(texto) && /(?:nao recebi|nao chegou|atualizado no site|ver no site)/.test(texto)) {
    return "Você pode acessar nosso cardápio atualizado aqui: https://saborosamente.com 💚\nSe solicitou o PDF e ele não chegou, avise nossa equipe por esta conversa para reenviar.";
  }

  if (/personalizad/.test(texto) && /\b(hoje|amanha|prazo|quanto tempo|proxima semana|mesma semana)\b/.test(texto)) {
    const prazo=String(personalizada.avisoPrazo||"As personalizadas são produzidas sob encomenda e entregues na semana seguinte.").trim();
    const minimo=personalizada.minUnidades ? " O pedido mínimo é de *"+personalizada.minUnidades+" unidades por combinação*." : "";
    return "*Marmitas personalizadas precisam de produção antecipada.* 💚\n"+prazo+minimo+
      "\nNão consigo confirmar entrega para hoje. Nossa equipe pode conferir a programação e combinar a data correta.";
  }

  const pedeMenosKcal=/\b(menos calorias|menos kcal|mais leve|mais leves|menor caloria)\b/.test(texto);
  const pedeProteina=/\b(mais proteina|maior proteina|mais proteicas)\b/.test(texto);
  if ((pedeMenosKcal||pedeProteina)&&tamanho && !/\b(combo|pacote)\b/.test(texto)) {
    const chave=pedeMenosKcal?"kcal":"proteina";
    const opcoes=fatos.catalogo.filter(p=>p.tipo==="marmita").flatMap(p=>{
      const tam=p.tamanhos.find(v=>v.tamanho===tamanho);
      const valor=tam?.nutricao?.[chave];
      return tam && tam.disponibilidade==="em estoque" && typeof valor==="number" && Number.isFinite(valor) && valor>0
        ? [{nome:p.nome,link:p.link,valor}] : [];
    });
    if(!opcoes.length) return "Não encontrei dados nutricionais e estoque suficientes para recomendar essa gramatura com segurança. Nossa equipe pode conferir as opções para você.";
    opcoes.sort((a,b)=>pedeMenosKcal?a.valor-b.valor:b.valor-a.valor);
    const primeiros=opcoes.slice(0,3);
    const titulo=pedeMenosKcal?"menor valor calórico":"maior teor de proteína";
    const unidade=pedeMenosKcal?"kcal":"g de proteína";
    return "Entre as marmitas de *"+tamanho+"* com estoque e informação nutricional cadastrada, estas têm "+titulo+":\n"+
      primeiros.map((p,i)=>(i+1)+". *"+p.nome+"* — "+p.valor+" "+unidade+"\n"+p.link).join("\n")+
      "\nValores nutricionais cadastrados no site; não substituem orientação profissional. 💚";
  }

  if (/\b(peixe|tilapia)\b/.test(texto) && tamanho && /(tem|teria|opcao|disponivel|estoque|voces tem)/.test(texto)) {
    const encontrados=fatos.catalogo.filter(p=>p.tipo==="marmita"&&/\b(tilapia|peixe)\b/.test(normalizar(p.nome)))
      .filter(p=>p.tamanhos.some(v=>v.tamanho===tamanho&&v.disponibilidade==="em estoque"));
    if(encontrados.length) return "Sim! 💚 Temos opção de peixe de *"+tamanho+"* com estoque cadastrado:\n"+
      encontrados.slice(0,4).map(p=>"• *"+p.nome+"*\n"+p.link).join("\n")+
      "\nO estoque pode mudar até a confirmação do pedido.";
    return "Não encontrei opção de peixe de "+tamanho+" com estoque confirmado neste momento. Posso consultar nossa equipe ou sugerir alternativas.";
  }

  const cidade=[...fatos.cidades].sort((a,b)=>b.cidade.length-a.cidade.length)
    .find(c=>normalizar(c.cidade) && texto.includes(normalizar(c.cidade)));
  if (cidade && /(frete|taxa|entrega|entregam|pedido|dia|horario|promocao)/.test(texto)) {
    const ehSBS=normalizar(cidade.cidade)==="sao bento do sul";
    const perguntaPromo=/\b(promo|promocao|frete|taxa|cinco reais)\b|r\$ ?5/.test(texto);
    const dias=cidade.dias.join(", ");
    const adicional=cidade.minimoUnidades ? " Pedido mínimo: *"+cidade.minimoUnidades+" unidades*." : "";
    const fraseFrete=ehSBS
      ? " O frete promocional de *R$ 5,00* pode valer a partir de 5 marmitas elegíveis em área atendida. Confirme a taxa final no checkout."
      : " O frete promocional de R$ 5,00 é exclusivo de São Bento do Sul; em "+cidade.cidade+" a taxa depende do bairro e deve ser confirmada no checkout.";
    return "Atendemos *"+cidade.cidade+"*. 💚 "+
      (ehSBS ? "Confira as datas e faixas disponíveis no checkout." : "As entregas acontecem em *"+dias+"*.")+
      adicional+(perguntaPromo?fraseFrete:"")+
      "\nMe diga seu bairro para confirmar a taxa e a próxima data disponível. Feriados e vagas dependem da programação atual.";
  }
  if (!cidade && /(?:depois|apos).{0,20}(?:horario limite|prazo para pedir)/.test(texto)) {
    return "Depende da *cidade* e do dia da entrega. Nas rotas semanais, pedidos após o horário limite ficam para a próxima data disponível. 💚\nQual é a sua cidade e bairro?";
  }

  const consultaPreco=/(?:preco|valor|custa|custam|quanto fica|quanto ficam|desconto|faixa)/.test(texto);
  const ehComboPronto=/\bcombo(s)? pronto(s)?\b|combo pratos|combo mais leves|combo mais vendidos/.test(texto);
  const somenteSopa=/\bsopas?\b/.test(texto) && !/\b(marmita|marmitas|prato|pratos|refeicao|refeicoes)\b/.test(texto);
  if(!consultaPreco||ehComboPronto||somenteSopa) return null;
  const quantidades=[...texto.matchAll(reQuantidade)].map(m=>({q:Number(m[1]),label:m[0]})).filter(q=>q.q>0&&q.q<=200);
  const total=quantidades.reduce((n,v)=>n+v.q,0);
  const compara=/\b(igual|mesmo preco|diferenca|muda o preco|preco muda)\b/.test(texto);
  if(tamanho && compara && /\b1\b/.test(texto) && /\b20\b/.test(texto)) {
    return "Não. Para marmitas de *"+tamanho+"*, com 1 unidade o valor é *"+formatar(precoPorTamanho(tamanho,fatos,1))+
      "*; com 20 unidades fica *"+formatar(precoPorTamanho(tamanho,fatos,20))+
      "* por marmita. A tabela já considera a faixa, sem percentual adicional.";
  }
  if(/\b9\b/.test(texto)&&/\bmais um\b/.test(texto) && /preco|desconto|faixa/.test(texto)) {
    return "Sim! Ao passar de *9 para 10 unidades*, você muda da faixa de 5–9 para a de 10–19.\n"+
      (["200g","300g","400g"] as TamanhoMarmita[]).map(t=>"• *"+t+"*: "+formatar(precoPorTamanho(t,fatos,9))+" → "+formatar(precoPorTamanho(t,fatos,10))+" cada").join("\n")+
      "\nOs valores são das marmitas avulsas; sopas e complementos contam na quantidade, mas mantêm preço próprio.";
  }
  if(total>0 && /sopas?\b/.test(texto) && /\bmarmitas?\b/.test(texto) && !tamanho) {
    return "Nesse exemplo, *"+total+" unidades* entram na contagem, então vale a faixa de *"+
      faixa(total)+" unidades* para as marmitas avulsas. 💚\n"+
      "Sopas mantêm seus preços próprios. Para calcular o total, preciso saber os *sabores das sopas* e a *gramatura das marmitas*. Não vou presumir valores.";
  }
  if(/\b4 unidades\b/.test(texto)&&/desconto/.test(texto)) {
    return "Com *4 unidades* você permanece na faixa de 1–4. O preço menor começa em *5 unidades*. "+
      "As marmitas usam preços fixos por faixa, sem adicionar desconto percentual. 💚";
  }
  if(/combo/.test(texto)&&/acumular|desconto/.test(texto)) {
    return "Os *combos prontos* já têm preço próprio e não recebem desconto progressivo adicional. 💚";
  }
  if(tamanho && total>0 && total<=200) {
    const unit=precoPorTamanho(tamanho,fatos,total);
    const incluiOutros=quantidades.some(q=>/sopa/.test(q.label));
    const textoQuant=incluiOutros ? "São *"+total+" itens no total*; as marmitas entram na faixa de "+faixa(total)+"."
      : "Para *"+total+" marmita"+(total>1?"s":"")+" de "+tamanho+"*:";
    const totalTexto=incluiOutros?"":"\nSubtotal estimado das marmitas: *"+formatar(total*unit)+"*.";
    return textoQuant+"\nValor por marmita de "+tamanho+": *"+formatar(unit)+"*."+totalTexto+sufixoComercial();
  }
  if(tamanho && /\buma?\s+(?:marmita|refeicao)\b/.test(texto)) {
    return "Uma marmita de *"+tamanho+"* custa *"+formatar(precoPorTamanho(tamanho,fatos,1))+
      "* na faixa de 1–4 unidades. Há valores menores nas faixas de 5+, 10+ e 20+. 💚";
  }
  if(tamanho) return listarFaixas(tamanho,fatos);
  return null;
}
