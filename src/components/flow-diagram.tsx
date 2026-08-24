import { useState, useRef } from "react";
import {
  MessageCircle, GitBranch, Clock, Tag,
  ArrowRight, X, ChevronDown, ChevronRight, GripVertical,
  ZoomIn, ZoomOut, Maximize2
} from "lucide-react";
import {
  DndContext, DragEndEvent, closestCenter,
  PointerSensor, useSensor, useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

// ── Componente para cada nó draggable ──
function NoDraggable({ no, onToggleExpand, isExpanded }: {
  no: No;
  onToggleExpand: (id: string) => void;
  isExpanded: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: no.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const IconComponent = NO_ICONS[no.tipo] || MessageCircle;
  const corClasse = NO_CORES[no.tipo] || "bg-gray-50 border-gray-200";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border-2 px-4 py-3 min-w-[200px] transition-all hover:shadow-md ${corClasse} ${
        isDragging ? "shadow-lg ring-2 ring-[#5850ec]" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-black/5 rounded flex-shrink-0"
          title="Arrastar para reordenar"
        >
          <GripVertical size={14} className="opacity-50" />
        </button>
        <IconComponent size={16} className="flex-shrink-0" />
        <span className="font-bold text-sm flex-1 truncate">{no.titulo}</span>
        {(no.tipo === "condicao" || (no.tipo === "mensagem" && no.config.texto)) && (
          <button
            onClick={() => onToggleExpand(no.id)}
            className="cursor-pointer flex-shrink-0"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
      </div>

      {/* Preview do conteúdo */}
      {isExpanded && (
        <div className="text-xs mt-2 pt-2 border-t opacity-75">
          {no.tipo === "mensagem" && (
            <p className="line-clamp-2">{no.config.texto || "(mensagem vazia)"}</p>
          )}
          {no.tipo === "aguardar" && (
            <p>{no.config.valor || 1} {no.config.unidade || "horas"}</p>
          )}
          {no.tipo === "tag" && (
            <p>Tag: <strong>{no.config.tag || "(vazia)"}</strong></p>
          )}
          {no.tipo === "condicao" && (
            <p>Se {no.config.campo} = {no.config.valor}</p>
          )}
          {no.tipo === "menu" && (
            <p>{no.config.opcoes?.length || 0} opções</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──
export function FlowDiagram({ nos, onUpdate, editavel = false }: FlowDiagramProps) {
  const [expandido, setExpandido] = useState<Set<string>>(new Set(nos.slice(0, 1).map(n => n.id)));
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [arrastandoCanvas, setArrastandoCanvas] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panInicio = useRef({ x: 0, y: 0 });

  // Sensores para drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8, // Precisão de 8px antes de iniciar drag
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!onUpdate) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = nos.findIndex(n => n.id === active.id);
    const newIndex = nos.findIndex(n => n.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const novoArray = arrayMove(nos, oldIndex, newIndex);
      onUpdate(novoArray);
    }
  };

  const alterarZoom = (delta: number) => {
    setZoom(prev => Math.min(1.6, Math.max(0.55, Number((prev + delta).toFixed(2)))));
  };

  const iniciarPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    setArrastandoCanvas(true);
    panInicio.current = { x: event.clientX - pan.x, y: event.clientY - pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moverPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!arrastandoCanvas) return;
    setPan({ x: event.clientX - panInicio.current.x, y: event.clientY - panInicio.current.y });
  };

  const pararPan = () => setArrastandoCanvas(false);

  const indicePorId = new Map(nos.map((no, indice) => [no.id, indice]));
  const conexoes = nos.flatMap((no, indice) => {
    const destinos = [no.proximo_id, no.proximo_sim_id, no.proximo_nao_id].filter(Boolean) as string[];
    return destinos.map((destino, ramo) => ({
      de: indice,
      para: indicePorId.get(destino),
      ramo: no.tipo === "condicao" ? (ramo === 0 ? "sim" : "nao") : "",
    })).filter(conexao => conexao.para !== undefined);
  });

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b bg-white/80 px-3 py-2">
        <div>
          <p className="text-xs font-bold text-gray-700">Área de trabalho do fluxo</p>
          <p className="text-[10px] text-gray-400">Arraste o espaço para navegar e organize os nós abaixo</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => alterarZoom(-0.1)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" title="Diminuir zoom"><ZoomOut size={16} /></button>
          <span className="w-12 text-center text-xs font-semibold text-gray-500">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => alterarZoom(0.1)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" title="Aumentar zoom"><ZoomIn size={16} /></button>
          <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" title="Centralizar fluxo"><Maximize2 size={16} /></button>
        </div>
      </div>
      {nos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <GitBranch size={32} className="mb-2 opacity-30" />
          <p className="text-sm">Nenhum nó no fluxo</p>
        </div>
      ) : (
        <div
          ref={canvasRef}
          className={`relative h-[520px] overflow-hidden ${arrastandoCanvas ? "cursor-grabbing" : "cursor-grab"}`}
          onPointerDown={iniciarPan}
          onPointerMove={moverPan}
          onPointerUp={pararPan}
          onPointerCancel={pararPan}
          onWheel={event => { event.preventDefault(); alterarZoom(event.deltaY > 0 ? -0.05 : 0.05); }}
        >
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="absolute left-1/2 top-8 w-[300px] -translate-x-1/2 origin-top" style={{ transform: `translateX(calc(-50% + ${pan.x / zoom}px)) translateY(${pan.y / zoom}px) scale(${zoom})` }}>
            <svg className="pointer-events-none absolute left-0 top-0 h-full w-full overflow-visible" style={{ height: Math.max(160, nos.length * 120) }}>
              {conexoes.map((conexao, indice) => {
                const inicioY = conexao.de * 120 + 76;
                const fimY = (conexao.para ?? 0) * 120 + 4;
                return <g key={`${conexao.de}-${conexao.para}-${indice}`}><line x1="150" y1={inicioY} x2="150" y2={fimY} stroke="#94a3b8" strokeWidth="2" strokeDasharray={conexao.ramo ? "5 4" : undefined} /><text x="158" y={(inicioY + fimY) / 2} fill="#64748b" fontSize="10">{conexao.ramo}</text></g>;
              })}
            </svg>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={nos.map(n => n.id)} strategy={verticalListSortingStrategy}>
                <div className="relative flex flex-col items-center gap-8">
                  {nos.map(no => (
                    <NoDraggable key={no.id} no={no} onToggleExpand={(id) => setExpandido(prev => {
                      const novo = new Set(prev);
                      if (novo.has(id)) novo.delete(id); else novo.add(id);
                      return novo;
                    })} isExpanded={expandido.has(no.id)} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      )}

      <div className="border-t px-3 py-2 text-xs text-gray-500">
        <p className="text-center">
          🎯 Arraste os nós pela alça para reordenar · Use o zoom para revisar o fluxo completo
        </p>
      </div>
    </div>
  );
}
