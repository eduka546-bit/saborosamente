import { useState, useRef, useEffect } from "react";
import {
  MessageCircle, GitBranch, Clock, Tag, ShoppingBag,
  ArrowRight, X, ChevronDown, ChevronRight, ArrowUp
} from "lucide-react";

interface No {
  id: string;
  tipo: string;
  titulo: string;
  config: any;
  proximo_id?: string;
  proximo_sim_id?: string;
  proximo_nao_id?: string;
}

interface FlowDiagramProps {
  nos: No[];
  onUpdate?: (nos: No[]) => void;
  editavel?: boolean;
}

const NO_ICONS: Record<string, any> = {
  mensagem: MessageCircle,
  menu: GitBranch,
  condicao: GitBranch,
  aguardar: Clock,
  tag: Tag,
  transferir: ArrowRight,
  encerrar: X,
};

const NO_CORES: Record<string, string> = {
  mensagem: "bg-blue-50 border-blue-200 text-blue-700",
  menu: "bg-indigo-50 border-indigo-200 text-indigo-700",
  condicao: "bg-yellow-50 border-yellow-200 text-yellow-700",
  aguardar: "bg-gray-50 border-gray-200 text-gray-700",
  tag: "bg-pink-50 border-pink-200 text-pink-700",
  transferir: "bg-orange-50 border-orange-200 text-orange-700",
  encerrar: "bg-red-50 border-red-200 text-red-700",
};

function construirArvore(nos: No[]): Map<string, No> {
  const mapa = new Map();
  nos.forEach(no => mapa.set(no.id, no));
  return mapa;
}

function encontrarProximoNo(noAtual: No, mapa: Map<string, No>, decisao?: "sim" | "nao"): No | null {
  let proxId: string | undefined;

  if (noAtual.tipo === "condicao" && decisao) {
    proxId = decisao === "sim" ? noAtual.proximo_sim_id : noAtual.proximo_nao_id;
  } else {
    proxId = noAtual.proximo_id;
  }

  return proxId ? mapa.get(proxId) ?? null : null;
}

export function FlowDiagram({ nos, onUpdate, editavel = false }: FlowDiagramProps) {
  const [expandido, setExpandido] = useState<Set<string>>(new Set(nos.slice(0, 1).map(n => n.id)));
  const svgRef = useRef<SVGSVGElement>(null);
  const nodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const mapa = construirArvore(nos);

  // Encontrar nó inicial (primeiro sem referência de entrada)
  const noInicial = nos.length > 0 ? nos[0] : null;

  const renderizarNo = (noAtual: No | null, nivel: number = 0, profundidade: number = 0, ramo?: "sim" | "nao"): JSX.Element | null => {
    if (!noAtual || profundidade > 10) return null; // Proteção contra loops infinitos

    const estouNoExpandido = expandido.has(noAtual.id);
    const IconComponent = NO_ICONS[noAtual.tipo] || MessageCircle;
    const corClasse = NO_CORES[noAtual.tipo] || "bg-gray-50 border-gray-200";

    let proximoNoSim: No | null = null;
    let proximoNaoSim: No | null = null;

    if (noAtual.tipo === "condicao") {
      proximoNoSim = encontrarProximoNo(noAtual, mapa, "sim");
      proximoNaoSim = encontrarProximoNo(noAtual, mapa, "nao");
    } else {
      proximoNoSim = encontrarProximoNo(noAtual, mapa);
    }

    return (
      <div key={`${noAtual.id}-${ramo || "base"}`} className="flex flex-col items-center gap-2">
        {/* Nó atual */}
        <div
          ref={el => {
            if (el) nodesRef.current?.set(noAtual.id, el);
          }}
          className={`rounded-lg border-2 px-4 py-3 min-w-[180px] cursor-pointer transition-all hover:shadow-md ${corClasse}`}
          onClick={() => {
            setExpandido(prev => {
              const novo = new Set(prev);
              if (novo.has(noAtual.id)) {
                novo.delete(noAtual.id);
              } else {
                novo.add(noAtual.id);
              }
              return novo;
            });
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <IconComponent size={16} />
            <span className="font-bold text-sm">{noAtual.titulo}</span>
            {(noAtual.tipo === "condicao" || (noAtual.tipo === "mensagem" && noAtual.config.texto)) && (
              estouNoExpandido ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            )}
          </div>

          {/* Preview do conteúdo */}
          {estouNoExpandido && (
            <div className="text-xs mt-2 pt-2 border-t opacity-75">
              {noAtual.tipo === "mensagem" && (
                <p className="line-clamp-2">{noAtual.config.texto || "(mensagem vazia)"}</p>
              )}
              {noAtual.tipo === "aguardar" && (
                <p>{noAtual.config.valor || 1} {noAtual.config.unidade || "horas"}</p>
              )}
              {noAtual.tipo === "tag" && (
                <p>Tag: <strong>{noAtual.config.tag || "(vazia)"}</strong></p>
              )}
              {noAtual.tipo === "condicao" && (
                <p>Se {noAtual.config.campo} = {noAtual.config.valor}</p>
              )}
            </div>
          )}
        </div>

        {/* Ramificações */}
        {estouNoExpandido && (
          <>
            {noAtual.tipo === "condicao" ? (
              // Ramificação SIM/NÃO
              <div className="grid grid-cols-2 gap-4 mt-2">
                {/* Ramo SIM */}
                <div className="flex flex-col items-center">
                  <div className="text-xs font-bold text-green-600 mb-1">✅ SIM</div>
                  <div className="border-l-2 border-t-2 border-green-200 w-12 h-8" />
                  <div className="border-l-2 border-green-200 h-2" />
                  {proximoNoSim ? (
                    renderizarNo(proximoNoSim, nivel + 1, profundidade + 1, "sim")
                  ) : (
                    <div className="text-xs text-gray-400 italic px-3 py-2">Sem próximo nó</div>
                  )}
                </div>

                {/* Ramo NÃO */}
                <div className="flex flex-col items-center">
                  <div className="text-xs font-bold text-red-600 mb-1">❌ NÃO</div>
                  <div className="border-r-2 border-t-2 border-red-200 w-12 h-8" />
                  <div className="border-r-2 border-red-200 h-2" />
                  {proximoNaoSim ? (
                    renderizarNo(proximoNaoSim, nivel + 1, profundidade + 1, "nao")
                  ) : (
                    <div className="text-xs text-gray-400 italic px-3 py-2">Sem próximo nó</div>
                  )}
                </div>
              </div>
            ) : (
              // Fluxo linear
              <>
                {proximoNoSim ? (
                  <>
                    <ArrowUp size={16} className="text-gray-300" />
                    {renderizarNo(proximoNoSim, nivel + 1, profundidade + 1)}
                  </>
                ) : noAtual.tipo !== "encerrar" && (
                  <div className="text-xs text-gray-400 italic">Fim do fluxo</div>
                )}
              </>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6 overflow-auto">
      {nos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <GitBranch size={32} className="mb-2 opacity-30" />
          <p className="text-sm">Nenhum nó no fluxo</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {noInicial && renderizarNo(noInicial)}
          
          <div className="mt-4 pt-4 border-t text-xs text-gray-500">
            <p className="text-center">
              Clique nos nós para expandir/recolher e ver detalhes
            </p>
          </div>
        </div>
      )}

      <svg ref={svgRef} className="hidden" style={{ position: "absolute", top: 0, left: 0 }} />
    </div>
  );
}
