/**
 * Importação de clientes do Prefiro Delivery.
 *
 * O CSV exportado do Prefiro tem colunas separadas por TAB:
 * Nome | CPF | Sexo | Telefone | Email | Nascimento | Idade | Bairro |
 * Pessoal | Funcionário(a) | Newsletter | Qtd. de pedidos | Último pedido |
 * Cashback | Pontos totais
 *
 * Regras de importação:
 * - Precisa ter email E cpf (com dígitos) para ser importado
 * - Senha = CPF (só dígitos)
 * - Se já existe (mesmo email ou CPF) → pula
 * - Registros de teste (linceweb, suporte@, etc.) são ignorados
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Upload, ClipboardPaste, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/config/importar-clientes")({
  component: ImportarClientesPage,
});

interface ClienteCSV {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  bairro: string;
  cidade: string;
  // status após análise
  status: "novo" | "sem_email" | "sem_cpf" | "teste" | "duplicado";
  motivo?: string;
}

function soDigitos(s: string) {
  return (s ?? "").replace(/\D/g, "");
}

// Normaliza telefone: remove espaços e o + inicial, mantém dígitos
function normalizarTel(s: string) {
  return (s ?? "").replace(/\D/g, "");
}

// Domínios/emails de teste que devem ser ignorados
const EMAILS_TESTE = ["linceweb.com", "suporte@", "teste@", "test@", "paulo@"];

function ehTeste(email: string) {
  return EMAILS_TESTE.some((p) => email.includes(p));
}

function parsearCSV(texto: string): ClienteCSV[] {
  const linhas = texto.split(/\r?\n/).filter(Boolean);
  if (linhas.length === 0) return [];

  // Detecta se a primeira linha é cabeçalho
  const primeiraLinha = linhas[0].toLowerCase();
  const temCabecalho =
    primeiraLinha.includes("nome") ||
    primeiraLinha.includes("email") ||
    primeiraLinha.includes("cpf");
  const dados = temCabecalho ? linhas.slice(1) : linhas;

  return dados
    .map((linha) => {
      // Suporta TAB e ponto-vírgula como separadores
      const sep = linha.includes("\t") ? "\t" : ";";
      const cols = linha.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));

      // Índices baseados no formato do Prefiro Delivery
      // Nome(0) CPF(1) Sexo(2) Telefone(3) Email(4) Nasc(5) Idade(6) Bairro(7)...
      const nome = cols[0] ?? "";
      const cpf = soDigitos(cols[1] ?? "");
      const telefone = normalizarTel(cols[3] ?? "");
      const email = (cols[4] ?? "").trim().toLowerCase();
      const bairro = (cols[7] ?? "").trim();

      // Status inicial
      let status: ClienteCSV["status"] = "novo";
      let motivo: string | undefined;

      if (!email || !email.includes("@")) {
        status = "sem_email";
        motivo = "Sem email válido";
      } else if (ehTeste(email)) {
        status = "teste";
        motivo = "Registro de teste";
      } else if (!cpf || cpf.length < 11) {
        status = "sem_cpf";
        motivo = "Sem CPF válido";
      }

      return { nome, cpf, telefone, email, bairro, cidade: "São Bento do Sul", status, motivo };
    })
    .filter((c) => c.email || c.nome); // remove linhas completamente vazias
}

function ImportarClientesPage() {
  const [texto, setTexto] = useState("");
  const [clientes, setClientes] = useState<ClienteCSV[]>([]);
  const [importando, setImportando] = useState(false);
  const [progresso, setProgresso] = useState({ feito: 0, total: 0, criados: 0, pulados: 0, erros: 0 });
  const [concluido, setConcluido] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function verificarDuplicatas(lista: ClienteCSV[]): Promise<ClienteCSV[]> {
    const novos = lista.filter((c) => c.status === "novo");
    if (novos.length === 0) return lista;

    // Busca CPFs que já existem em profiles
    const cpfs = novos.map((c) => c.cpf).filter(Boolean);
    const { data: existentes } = await supabase
      .from("profiles")
      .select("cpf")
      .in("cpf", cpfs);
    const cpfsExistentes = new Set((existentes ?? []).map((p: any) => p.cpf));

    return lista.map((c) => {
      if (c.status !== "novo") return c;
      if (cpfsExistentes.has(c.cpf)) {
        return { ...c, status: "duplicado" as const, motivo: "CPF já cadastrado" };
      }
      return c;
    });
  }

  async function handleParsear() {
    if (!texto.trim()) {
      toast.error("Cole ou carregue o arquivo CSV primeiro.");
      return;
    }
    const parsed = parsearCSV(texto);
    if (parsed.length === 0) {
      toast.error("Nenhum dado encontrado. Verifique o formato do arquivo.");
      return;
    }
    const comDuplicatas = await verificarDuplicatas(parsed);
    setClientes(comDuplicatas);
    setConcluido(false);
    setProgresso({ feito: 0, total: 0, criados: 0, pulados: 0, erros: 0 });
  }

  async function handleImportar() {
    const novos = clientes.filter((c) => c.status === "novo");
    if (novos.length === 0) {
      toast.error("Nenhum cliente novo para importar.");
      return;
    }

    setImportando(true);
    setProgresso({ feito: 0, total: novos.length, criados: 0, pulados: 0, erros: 0 });

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      toast.error("Sessão expirada. Faça login novamente.");
      setImportando(false);
      return;
    }

    let criados = 0, pulados = 0, erros = 0;

    for (let i = 0; i < novos.length; i++) {
      const c = novos[i];
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/importar-cliente`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              email: c.email,
              cpf: c.cpf,
              nome: c.nome,
              telefone: c.telefone,
              bairro: c.bairro,
              cidade: c.cidade,
            }),
          },
        );
        const json = await res.json();
        if (json.ok) {
          if (json.created) criados++;
          else pulados++;
        } else {
          console.error(`Erro ${c.email}:`, json.error);
          erros++;
        }
      } catch (e) {
        console.error(`Exceção ${c.email}:`, e);
        erros++;
      }
      setProgresso({ feito: i + 1, total: novos.length, criados, pulados, erros });

      // Pequena pausa a cada 10 para não sobrecarregar a API
      if ((i + 1) % 10 === 0) await new Promise((r) => setTimeout(r, 500));
    }

    setImportando(false);
    setConcluido(true);
    toast.success(`Importação concluída! ${criados} criados, ${pulados} pulados, ${erros} erros.`);
  }

  function handleArquivo(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      setTexto((e.target?.result as string) ?? "");
      setClientes([]);
      setConcluido(false);
    };
    reader.readAsText(file, "UTF-8");
  }

  const novos = clientes.filter((c) => c.status === "novo").length;
  const ignorados = clientes.filter((c) => c.status !== "novo").length;

  const statusConfig = {
    novo: { label: "Novo", cls: "bg-green-100 text-green-700" },
    duplicado: { label: "Já existe", cls: "bg-yellow-100 text-yellow-700" },
    sem_email: { label: "Sem email", cls: "bg-red-100 text-red-600" },
    sem_cpf: { label: "Sem CPF", cls: "bg-red-100 text-red-600" },
    teste: { label: "Teste", cls: "bg-gray-100 text-gray-500" },
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Users size={22} className="text-[#5850ec]" />
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Importar Clientes</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Importe clientes do Prefiro Delivery. Login: email · Senha: CPF (só dígitos).
          </p>
        </div>
      </div>

      {/* Step 1: Upload / cola */}
      <div className="bg-white rounded-xl border p-5 space-y-4 mb-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700">1. Carregar o arquivo CSV</h2>
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleArquivo(f);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5"
            >
              <Upload size={14} /> Subir arquivo
            </Button>
          </div>
        </div>
        <textarea
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setClientes([]); }}
          placeholder="Ou cole aqui o conteúdo do CSV exportado do Prefiro Delivery..."
          className="w-full h-32 rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none outline-none focus:ring-2 focus:ring-[#5850ec]/30 font-mono"
        />
        <div className="flex gap-2">
          <Button
            onClick={handleParsear}
            disabled={!texto.trim()}
            className="bg-[#5850ec] text-white flex items-center gap-2"
          >
            <ClipboardPaste size={15} /> Analisar
          </Button>
          {clientes.length > 0 && (
            <Button variant="outline" onClick={() => { setClientes([]); setTexto(""); setConcluido(false); }}>
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Step 2: Prévia */}
      {clientes.length > 0 && (
        <div className="bg-white rounded-xl border p-5 space-y-4 mb-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-bold text-gray-700">2. Prévia da importação</h2>
            <div className="flex gap-3 text-sm">
              <span className="text-green-600 font-bold">{novos} novos</span>
              <span className="text-gray-400">{ignorados} ignorados/existentes</span>
              <span className="text-gray-400">total: {clientes.length}</span>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-xl border">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-[10px] font-bold uppercase text-gray-400">
                  <th className="py-2 px-3 text-left">Nome</th>
                  <th className="py-2 px-2 text-left">Email</th>
                  <th className="py-2 px-2 text-left">CPF</th>
                  <th className="py-2 px-2 text-left">Telefone</th>
                  <th className="py-2 px-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {clientes.map((c, i) => {
                  const sc = statusConfig[c.status];
                  return (
                    <tr key={i} className={c.status !== "novo" ? "opacity-50" : ""}>
                      <td className="py-2 px-3 font-medium text-gray-900 max-w-[140px] truncate">{c.nome || "—"}</td>
                      <td className="py-2 px-2 text-gray-600 max-w-[160px] truncate">{c.email || "—"}</td>
                      <td className="py-2 px-2 text-gray-500">{c.cpf || "—"}</td>
                      <td className="py-2 px-2 text-gray-500">{c.telefone || "—"}</td>
                      <td className="py-2 px-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.cls}`}>
                          {sc.label}
                          {c.motivo ? ` — ${c.motivo}` : ""}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {novos > 0 && !concluido && (
            <Button
              onClick={handleImportar}
              disabled={importando}
              className="w-full bg-[#086e45] text-white"
            >
              {importando ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <Users size={16} className="mr-2" />
              )}
              {importando
                ? `Importando... ${progresso.feito}/${progresso.total}`
                : `Importar ${novos} cliente(s) novo(s)`}
            </Button>
          )}
        </div>
      )}

      {/* Progresso / resultado */}
      {(importando || concluido) && (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-700">3. Progresso</h2>

          {importando && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Processando...</span>
                <span>{progresso.feito} / {progresso.total}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-[#5850ec] h-2 rounded-full transition-all"
                  style={{ width: `${progresso.total > 0 ? (progresso.feito / progresso.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {concluido && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border p-4 text-center">
                <CheckCircle2 size={24} className="text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-black text-green-600">{progresso.criados}</p>
                <p className="text-xs text-gray-400">Criados</p>
              </div>
              <div className="rounded-xl border p-4 text-center">
                <AlertCircle size={24} className="text-yellow-500 mx-auto mb-1" />
                <p className="text-2xl font-black text-yellow-500">{progresso.pulados}</p>
                <p className="text-xs text-gray-400">Já existiam</p>
              </div>
              <div className="rounded-xl border p-4 text-center">
                <XCircle size={24} className="text-red-500 mx-auto mb-1" />
                <p className="text-2xl font-black text-red-500">{progresso.erros}</p>
                <p className="text-xs text-gray-400">Erros</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
