import { supabase } from "@/integrations/supabase/client";

export interface AuditEntrada {
  userId: string;
  userEmail: string;
  acao: string; // "criar_produto", "editar_cupom", "deletar_pedido", etc
  tabela: string; // "produtos", "cupons", "pedidos", etc
  registroId?: string;
  dadosAntes?: Record<string, any>;
  dadosDepois?: Record<string, any>;
  status?: "success" | "falhou" | "negado";
  erroMensagem?: string;
}

/**
 * Registra uma ação de auditoria
 * Automaticamente obtém IP address e user agent
 */
export async function registrarAuditoria(entrada: AuditEntrada) {
  try {
    // Obtém IP address do cliente
    let ipAddress: string | null = null;
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      ipAddress = data.ip;
    } catch (e) {
      console.warn("Não foi possível obter IP address:", e);
    }

    // User agent
    const userAgent = navigator.userAgent;

    // Remove dados sensíveis (senhas, tokens, etc)
    const dadosAntes = entrada.dadosAntes ? sanitizarDados(entrada.dadosAntes) : null;
    const dadosDepois = entrada.dadosDepois ? sanitizarDados(entrada.dadosDepois) : null;

    // Registra no banco
    const { data, error } = await supabase.rpc("registrar_auditoria", {
      p_user_id: entrada.userId,
      p_user_email: entrada.userEmail,
      p_acao: entrada.acao,
      p_tabela: entrada.tabela,
      p_registro_id: entrada.registroId || null,
      p_dados_antes: dadosAntes,
      p_dados_depois: dadosDepois,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_status: entrada.status || "success",
      p_erro_mensagem: entrada.erroMensagem || null,
    });

    if (error) {
      console.error("Erro ao registrar auditoria:", error);
      return null;
    }

    return data;
  } catch (e) {
    console.error("Erro geral ao registrar auditoria:", e);
    return null;
  }
}

/**
 * Remove dados sensíveis antes de registrar no log
 */
function sanitizarDados(dados: Record<string, any>): Record<string, any> {
  const sanitizado = { ...dados };

  // Palavras-chave sensíveis para remover
  const chavesSeqsiveis = [
    "senha",
    "password",
    "token",
    "secret",
    "api_key",
    "chave",
    "cpf",
    "cartao",
    "card",
    "numero",
    "numero_cartao",
    "cvv",
  ];

  for (const chave of chavesSeqsiveis) {
    // Remove exatamente
    delete sanitizado[chave];

    // Remove chaves que contenham a palavra
    Object.keys(sanitizado).forEach((k) => {
      if (k.toLowerCase().includes(chave.toLowerCase())) {
        delete sanitizado[k];
      }
    });
  }

  return sanitizado;
}

/**
 * Tipos de auditoria pré-configuradas
 */
export const AUDIT_ACTIONS = {
  // Produtos
  CRIAR_PRODUTO: "criar_produto",
  EDITAR_PRODUTO: "editar_produto",
  DELETAR_PRODUTO: "deletar_produto",
  DUPLICAR_PRODUTO: "duplicar_produto",

  // Cupons
  CRIAR_CUPOM: "criar_cupom",
  EDITAR_CUPOM: "editar_cupom",
  DELETAR_CUPOM: "deletar_cupom",
  ATIVAR_CUPOM: "ativar_cupom",
  DESATIVAR_CUPOM: "desativar_cupom",

  // Pedidos
  MUDAR_STATUS_PEDIDO: "mudar_status_pedido",
  CANCELAR_PEDIDO: "cancelar_pedido",
  DELETAR_PEDIDO: "deletar_pedido",
  CONFIRMAR_RASCUNHO: "confirmar_rascunho",

  // Clientes
  EDITAR_CLIENTE: "editar_cliente",
  DELETAR_CLIENTE: "deletar_cliente",

  // Configurações
  EDITAR_CONFIGURACAO: "editar_configuracao",
  LIMPAR_STORAGE: "limpar_storage",
  LIMPAR_BANCO_DADOS: "limpar_banco_dados",

  // Admin
  CRIAR_USUARIO_ADMIN: "criar_usuario_admin",
  REMOVER_USUARIO_ADMIN: "remover_usuario_admin",
  ATIVAR_2FA: "ativar_2fa",
  DESATIVAR_2FA: "desativar_2fa",
} as const;

/**
 * Busca audit log com filtros
 */
export async function buscarAuditLog(filtros?: {
  acao?: string;
  userId?: string;
  tabela?: string;
  dias?: number;
  limite?: number;
}) {
  let query = supabase.from("audit_log_view").select("*");

  if (filtros?.acao) {
    query = query.eq("acao", filtros.acao);
  }

  if (filtros?.userId) {
    query = query.eq("user_id", filtros.userId);
  }

  if (filtros?.tabela) {
    query = query.eq("tabela", filtros.tabela);
  }

  if (filtros?.dias) {
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - filtros.dias);
    query = query.gte("created_at", dataInicio.toISOString());
  }

  query = query.order("created_at", { ascending: false });

  if (filtros?.limite) {
    query = query.limit(filtros.limite);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao buscar audit log:", error);
    return [];
  }

  return data || [];
}

/**
 * Resumo de atividades por usuário nos últimos dias
 */
export async function resumoAtividadePorUsuario(dias: number = 7) {
  const { data, error } = await supabase.rpc("resumo_atividade_por_usuario", {
    p_dias: dias,
  });

  if (error) {
    console.error("Erro ao buscar resumo:", error);
    return [];
  }

  return data || [];
}

/**
 * Atividades suspeitas (muitas falhas, IPs diferentes, etc)
 */
export async function detectarAtividadesSuspeitas() {
  const { data: logRecente, error } = await supabase
    .from("audit_log_view")
    .select("*")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false });

  if (error || !logRecente) {
    console.error("Erro ao buscar atividades recentes:", error);
    return [];
  }

  const suspeitas: any[] = [];

  // Conta tentativas falhas por usuário
  const falhasPorUsuario: Record<string, number> = {};
  const ipsPorUsuario: Record<string, Set<string>> = {};

  (logRecente as any[]).forEach((entrada) => {
    // Tentativas falhas
    if (entrada.status === "falhou") {
      falhasPorUsuario[entrada.user_email] = (falhasPorUsuario[entrada.user_email] || 0) + 1;
    }

    // IPs diferentes
    if (entrada.ip_address) {
      if (!ipsPorUsuario[entrada.user_email]) {
        ipsPorUsuario[entrada.user_email] = new Set();
      }
      ipsPorUsuario[entrada.user_email].add(entrada.ip_address);
    }
  });

  // Marca atividades suspeitas
  for (const [email, falhas] of Object.entries(falhasPorUsuario)) {
    if (falhas > 5) {
      suspeitas.push({
        tipo: "muitas_falhas",
        usuario: email,
        detalhes: `${falhas} tentativas falhas nas últimas 24h`,
        severidade: "media",
      });
    }
  }

  for (const [email, ips] of Object.entries(ipsPorUsuario)) {
    if (ips.size > 3) {
      suspeitas.push({
        tipo: "ips_diferentes",
        usuario: email,
        detalhes: `Acessos de ${ips.size} IPs diferentes nas últimas 24h`,
        severidade: "baixa",
      });
    }
  }

  return suspeitas;
}
