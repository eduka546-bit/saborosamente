/**
 * QZ Tray helper — impressão direta via TCP/porta 9100
 *
 * QZ Tray é um app gratuito que roda no Windows/Mac/Linux e faz a ponte
 * entre o browser e a impressora de rede. Download: https://qz.io/download
 *
 * Fluxo:
 * 1. QZ Tray fica rodando em segundo plano no computador
 * 2. Esta lib conecta via WebSocket (ws://localhost:8181)
 * 3. Envia os dados ESC/POS em texto puro para a impressora via TCP
 */

declare const qz: any;

const QZ_CDN = "/qz-tray.js"; // servido localmente via public/
const QZ_WS = "wss://localhost:8181";

let qzLoaded = false;
let qzConnected = false;

// ── Carrega o script QZ do CDN (uma vez) ──────────────────────────────────────
async function loadQzScript(): Promise<void> {
  if (qzLoaded) return;
  return new Promise((resolve, reject) => {
    const existing = document.getElementById("qz-tray-script");
    if (existing) {
      qzLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = "qz-tray-script";
    script.src = QZ_CDN;
    script.onload = () => {
      qzLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Não foi possível carregar o script QZ Tray do CDN."));
    document.head.appendChild(script);
  });
}

// ── Conecta ao QZ Tray (ws local) ────────────────────────────────────────────
export async function conectarQZ(): Promise<boolean> {
  try {
    await loadQzScript();

    if (typeof qz === "undefined") return false;

    // Desativa verificação de certificado para uso local
    qz.security.setCertificatePromise((_resolve: any, _reject: any) => {
      _resolve(
        "-----BEGIN CERTIFICATE REQUEST-----\nMIIByjCCATMCAQAwgYkx...\n-----END CERTIFICATE REQUEST-----",
      );
    });
    qz.security.setSignatureAlgorithm("SHA512");
    qz.security.setSignaturePromise((_hash: any) => {
      return (_resolve: any, _reject: any) => _resolve(); // sem assinatura em dev
    });

    if (qz.websocket.isActive()) {
      qzConnected = true;
      return true;
    }

    await qz.websocket.connect({ host: "localhost", port: { secure: [8181], insecure: [8182] } });
    qzConnected = true;
    return true;
  } catch (e: any) {
    qzConnected = false;
    console.warn("QZ Tray não está rodando:", e?.message ?? e);
    return false;
  }
}

// ── Verifica se QZ está disponível ───────────────────────────────────────────
export async function qzDisponivel(): Promise<boolean> {
  try {
    await loadQzScript();
    if (typeof qz === "undefined") return false;
    if (qz.websocket.isActive()) return true;
    return await conectarQZ();
  } catch {
    return false;
  }
}

// ── Gera conteúdo ESC/POS a partir do objeto de pedido ───────────────────────
export function gerarConteudoComanda(order: any, colunas = 32): string {
  // Texto ASCII evita símbolos quebrados em impressoras com página de código
  // diferente da usada pelo navegador/QZ Tray.
  const ascii = (value: unknown) => String(value ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
  const wrap = (value: unknown, prefix = "") => {
    const words = ascii(value).split(" ");
    const lines: string[] = [];
    let line = prefix;
    for (let word of words) {
      if (!word) continue;
      if (line.trim() && line.length + word.length + 1 > colunas) {
        lines.push(line);
        line = "  ";
      }
      while (word.length > colunas - line.length - (line.trim() ? 1 : 0)) {
        const size = colunas - line.length - (line.trim() ? 1 : 0);
        if (size <= 0) { lines.push(line); line = "  "; continue; }
        line += (line.trim() ? " " : "") + word.slice(0, size);
        word = word.slice(size);
        lines.push(line);
        line = "  ";
      }
      line += (line.trim() ? " " : "") + word;
    }
    return [...lines, line].filter((part) => part.trim()).join("\n");
  };
  const c = (value: unknown) => {
    const t = ascii(value).slice(0, colunas);
    return " ".repeat(Math.max(0, Math.floor((colunas - t.length) / 2))) + t;
  };
  const r = (label: string, value: string) => {
    const l = ascii(label);
    const v = ascii(value);
    return l + " ".repeat(Math.max(1, colunas - l.length - v.length)) + v;
  };
  const SEP = "-".repeat(colunas);

  const date = new Date(order.created_at);
  const dateStr = date.toLocaleDateString("pt-BR");
  const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const seq = order.id.slice(-6).toUpperCase();
  const isDelivery = order.metodo_entrega === "entrega";
  const itens: any[] = order.itens ?? [];
  const subtotal = itens.reduce((s: number, i: any) => s + i.preco_unitario * i.quantidade, 0);
  const desconto = order.desconto_aplicado ?? 0;
  const entrega = order.taxa_entrega ?? 0;
  const acrescimo = Math.max(0, Number(order.valor_total ?? 0) - (subtotal + entrega - desconto));

  const itensLines = itens
    .map((item: any) => {
      const tot = item.preco_unitario * item.quantidade;
      return [
        wrap(`${item.quantidade}x ${item.nome}`),
        r("", `R$ ${tot.toFixed(2)}`),
        ...(item.observacao ? [wrap(`Obs: ${item.observacao}`, "  ")] : []),
      ].join("\n");
    })
    .join("\n");

  const linhas = [
    c("SABOROSAMENTE"),
    c("CNPJ: 52.596.019/0001-46"),
    SEP,
    c(`PEDIDO #${seq}`),
    c(`${dateStr}  ${timeStr}`),
    SEP,
    "CLIENTE:",
    wrap(order.nome_cliente ?? "Balcao"),
    ...(order.telefone_cliente ? [wrap(order.telefone_cliente)] : []),
    SEP,
    c(isDelivery ? "** DELIVERY **" : "** RETIRADA **"),
    ...(isDelivery && order.endereco_rua
      ? [
          "ENTREGA:",
          wrap(`${order.endereco_rua}${order.endereco_numero ? ", " + order.endereco_numero : ""}`),
          wrap(`${order.endereco_bairro ?? ""}  ${order.endereco_cidade ?? ""}`),
        ]
      : []),
    SEP,
    "ITENS:",
    SEP,
    itensLines,
    SEP,
    r("Subtotal:", `R$ ${subtotal.toFixed(2)}`),
    r("Frete:", entrega > 0 ? `R$ ${entrega.toFixed(2)}` : "GRATIS"),
    ...(desconto > 0 ? [r(`Desconto:`, `- R$ ${desconto.toFixed(2)}`)] : []),
    ...(acrescimo > 0 ? [r("Acrescimo:", `R$ ${acrescimo.toFixed(2)}`)] : []),
    SEP,
    r("TOTAL:", `R$ ${order.valor_total.toFixed(2)}`),
    SEP,
    "PAGAMENTO:",
    wrap(order.metodo_pagamento ?? "Nao informado"),
    ...(order.troco ? [wrap(`Troco p/ R$ ${order.troco}`)] : []),
    ...(order.observacao ? ["OBS:", wrap(order.observacao)] : []),
    SEP,
    c("Obrigado pela preferencia!"),
    c("@saborosamente.sbs"),
    "\n\n\n", // alimenta o papel
  ];

  // Inicializa a POS e ativa impressão enfatizada para melhorar a leitura
  // dos caracteres na impressão direta. Desativa antes de terminar a comanda.
  return "\x1b@\x1bE\x01" + linhas.filter((l) => l != null).join("\n") + "\x1bE\x00";
}

// ── Impressão principal — QZ Tray TCP ou fallback window.print ───────────────
export async function imprimirComanda(
  order: any,
  config: { ip: string; porta?: string | number; copias?: number; papel?: string },
): Promise<{ ok: boolean; metodo: "qz" | "popup" }> {
  const disponivelQZ = await qzDisponivel();

  if (disponivelQZ) {
    try {
      const conteudo = gerarConteudoComanda(order, config.papel === "58mm" ? 32 : 42);
      const copias = Number(config.copias ?? 1);

      const printerConfig = qz.configs.create(
        `\\\\${config.ip}`, // nome da impressora de rede no Windows
        {
          raw: true,
          copies: copias,
          scaleContent: false,
        },
      );

      // Fallback: se não achar por nome de rede, tenta TCP direto
      await qz.print(printerConfig, [{ type: "raw", format: "plain", data: conteudo }]);
      return { ok: true, metodo: "qz" };
    } catch (e: any) {
      console.warn("QZ falhou, usando popup:", e?.message);
      // Cai no fallback abaixo
    }
  }

  // Fallback: popup com window.print
  imprimirPopup(order);
  return { ok: true, metodo: "popup" };
}

// ── Impressão TCP direto (sem nome de impressora, usa IP:porta) ──────────────
export async function imprimirTCP(
  order: any,
  ip: string,
  porta: number = 9100,
  copias: number = 1,
  papel = "80mm",
): Promise<boolean> {
  const disponivelQZ = await qzDisponivel();
  if (!disponivelQZ) return false;

  try {
    const colunas = papel === "58mm" ? 32 : 42;
    const conteudo = gerarConteudoComanda(order, colunas);

    const cfg = qz.configs.create(
      { host: ip, port: porta, type: "raw" },
      { copies: copias, raw: true },
    );

    await qz.print(cfg, [{ type: "raw", format: "plain", data: conteudo }]);
    return true;
  } catch (e: any) {
    console.error("Erro na impressão TCP:", e?.message ?? e);
    return false;
  }
}

// ── Fallback: popup com window.print ─────────────────────────────────────────
export function imprimirPopup(order: any) {
  // Importa e chama a função existente
  import("@/components/thermal-receipt").then(({ printReceipt }) => {
    printReceipt(order);
  });
}
