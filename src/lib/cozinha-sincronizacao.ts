import { nomesCozinhaCorrespondem, quantidadeBrutaPorRendimento } from './cozinha-planejamento';

type Linha = Record<string, any>;
export type CatalogoFicha = { preparacoes: Linha[]; ingredientes: Linha[]; bases: Map<string, Linha[]> };
const tamanhos = [150, 200, 300, 400];
const campo = (t: number) => t === 150 ? 'gramas_personalizada' : `gramas_${t}`;
const numero = (v: unknown) => Math.max(0, Number(v) || 0);
const normalizar = (s: unknown) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export const chaveComponente = (l: Linha) => l.preparacao_id ? `p:${l.preparacao_id}` : l.ingrediente_id ? `i:${l.ingrediente_id}` : '';

function identificar(nome: string, linhas: Linha[], c: CatalogoFicha): Linha | undefined {
  const catalogo = [...c.preparacoes.map(p => ({ nome: p.nome, preparacao_id: p.id })), ...c.ingredientes.map(i => ({ nome: i.nome, ingrediente_id: i.id }))];
  const exatos = catalogo.filter(x => normalizar(x.nome) === normalizar(nome));
  if (exatos.length === 1) return exatos[0];
  const vinculados = new Set(linhas.map(chaveComponente));
  const candidatos = catalogo.filter(x => vinculados.has(chaveComponente(x)) && nomesCozinhaCorrespondem(nome, x.nome));
  // Nunca escolher arbitrariamente entre dois preparos com palavras parecidas.
  return candidatos.length === 1 ? candidatos[0] : undefined;
}

export function sincronizarMontagem(linhas: Linha[], montagem: Linha[], c: CatalogoFicha) {
  const grupos = new Map<string, { ref: Linha; pesos: Record<number, number> }>();
  const pendencias: string[] = [];
  for (const m of montagem) {
    if (!tamanhos.some(t => numero(m[`gramas_${t}`]) > 0)) continue;
    const ref = identificar(m.nome, linhas, c);
    if (!ref) { pendencias.push(`Vincule um ingrediente ou preparação com o nome "${m.nome}".`); continue; }
    const key = chaveComponente(ref);
    const grupo = grupos.get(key) || { ref, pesos: {} };
    for (const t of tamanhos) grupo.pesos[t] = (grupo.pesos[t] || 0) + numero(m[`gramas_${t}`]);
    grupos.set(key, grupo);
  }
  const resultado: Linha[] = [];
  for (const [key, grupo] of grupos) {
    const anterior = linhas.find(l => chaveComponente(l) === key);
    const linha: Linha = { ...anterior, ingrediente_id: grupo.ref.ingrediente_id || null, preparacao_id: grupo.ref.preparacao_id || null, rendimento_quebra: 1, operacao_producao: 'direto', fator_producao: 1, ordem: resultado.length };
    for (const t of tamanhos) linha[campo(t)] = grupo.pesos[t];
    resultado.push(linha);
  }
  // Linhas QB e água de cocção continuam separadas, sem entrar no peso servido.
  for (const l of linhas) {
    if (grupos.has(chaveComponente(l))) continue;
    const ing = c.ingredientes.find(i => i.id === l.ingrediente_id);
    const auxiliar = !tamanhos.some(t => numero(l[campo(t)]) > 0) || (normalizar(ing?.nome) === 'agua' && /coc|coz|descart/i.test(l.observacao || ''));
    if (auxiliar) {
      const copia = { ...l };
      if (normalizar(ing?.nome) === 'agua' && /coc|coz|descart/i.test(l.observacao || '')) {
        const massas = resultado.filter(r => /espaguete|talharim|macarrao/.test(normalizar(c.ingredientes.find(i => i.id === r.ingrediente_id)?.nome)));
        if (massas.length) for (const t of tamanhos) copia[campo(t)] = massas.reduce((s, r) => s + quantidadeBrutaPorRendimento(numero(r[campo(t)]), c.ingredientes.find(i => i.id === r.ingrediente_id) || {}) / 100, 0);
      }
      resultado.push(copia);
    }
    else if (pendencias.length) resultado.push({ ...l });
  }
  return { linhas: resultado, montagem, pendencias };
}

export function sincronizarIngredientes(anteriores: Linha[], novas: Linha[], montagem: Linha[], c: CatalogoFicha) {
  let proxima = montagem.map(m => ({ ...m }));
  for (const antiga of anteriores) {
    if (novas.some(l => chaveComponente(l) === chaveComponente(antiga))) continue;
    proxima = proxima.filter(m => chaveComponente(identificar(m.nome, anteriores, c) || {}) !== chaveComponente(antiga));
  }
  for (const l of novas) {
    const key = chaveComponente(l);
    if (!key) continue;
    let indices = proxima.map((m, i) => chaveComponente(identificar(m.nome, novas, c) || {}) === key ? i : -1).filter(i => i >= 0);
    if (!indices.length && tamanhos.some(t => numero(l[campo(t)]) > 0)) {
      const item = l.preparacao_id ? c.preparacoes.find(p => p.id === l.preparacao_id) : c.ingredientes.find(i => i.id === l.ingrediente_id);
      if (!item || normalizar(item.nome) === 'agua') continue;
      indices = [proxima.length]; proxima.push({ nome: item.nome, gramas_150: 0, gramas_200: 0, gramas_300: 0, gramas_400: 0 });
    }
    for (const t of tamanhos) {
      const total = indices.reduce((s, i) => s + numero(proxima[i][`gramas_${t}`]), 0);
      const base = numero(l[campo(t)]), fator = numero(l.fator_producao ?? 1);
      const alvo = l.operacao_producao === 'acrescentar' ? base * (1 + fator) : l.operacao_producao === 'dividir' ? base / Math.max(.000001, fator) : base;
      if (Math.abs(alvo - total) < .0000001) continue;
      let distribuido = 0;
      indices.forEach((i, j) => {
        const peso = j === indices.length - 1 ? alvo - distribuido : Math.round(alvo * (total > 0 ? numero(proxima[i][`gramas_${t}`]) / total : 1 / indices.length) * 1e6) / 1e6;
        proxima[i][`gramas_${t}`] = peso; distribuido += peso;
      });
    }
  }
  return sincronizarMontagem(novas, proxima, c);
}

// Insumos crus de entrada das preparações já incluem sua perda no rendimento.
export function comprasFicha(linhas: Linha[], tamanho: number, c: CatalogoFicha) {
  const totais = new Map<string, number>();
  const pendencias: string[] = [];
  const add = (id: string, q: number) => totais.set(id, (totais.get(id) || 0) + q);
  const expandir = (id: string, peso: number, vistos = new Set<string>()) => {
    const p = c.preparacoes.find(p => p.id === id);
    if (vistos.has(id) || !p || !(numero(p.rendimento_final_g) > 0)) { pendencias.push(`Rendimento ou vínculo inválido: ${p?.nome || id}`); return; }
    if (!(c.bases.get(id) || []).length) pendencias.push(`Ingredientes não cadastrados: ${p.nome}`);
    for (const b of c.bases.get(id) || []) {
      const q = numero(b.quantidade) * peso / numero(p.rendimento_final_g);
      if (b.preparacao_componente_id) expandir(b.preparacao_componente_id, q, new Set(vistos).add(id));
      else if (b.ingrediente_id) add(b.ingrediente_id, q);
    }
  };
  for (const l of linhas) {
    const peso = numero(l[campo(tamanho)]);
    if (!peso) continue;
    if (l.preparacao_id) {
      const p = c.preparacoes.find(p => p.id === l.preparacao_id);
      const porContagem = normalizar(p?.nome) === 'massa panqueca';
      expandir(l.preparacao_id, porContagem ? numero(p?.rendimento_final_g) * ({200:1,300:2,400:3}[tamanho as 200|300|400] || 1) / 30 : peso);
    }
    else if (l.ingrediente_id) add(l.ingrediente_id, quantidadeBrutaPorRendimento(peso, c.ingredientes.find(i => i.id === l.ingrediente_id) || {}));
  }
  return { totais, pendencias };
}
