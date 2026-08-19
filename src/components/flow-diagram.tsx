import { useState, useRef } from "react";
import {
  MessageCircle, GitBranch, Clock, Tag,
  ArrowRight, X, ChevronDown, ChevronRight, ArrowUp, GripVertical
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
  const svgRef = useRef<SVGSVGElement>(null);

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

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6 overflow-auto">
      {nos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <GitBranch size={32} className="mb-2 opacity-30" />
          <p className="text-sm">Nenhum nó no fluxo</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={nos.map(n => n.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col items-center gap-2">
              {nos.map((no, idx) => (
                <div key={no.id} className="w-full flex flex-col items-center">
                  <NoDraggable
                    no={no}
                    onToggleExpand={(id) => {
                      setExpandido(prev => {
                        const novo = new Set(prev);
                        if (novo.has(id)) {
                          novo.delete(id);
                        } else {
                          novo.add(id);
                        }
                        return novo;
                      });
                    }}
                    isExpanded={expandido.has(no.id)}
                  />
                  {idx < nos.length - 1 && (
                    <div className="flex justify-center my-1">
                      <ArrowUp size={16} className="text-gray-300 rotate-180" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="mt-4 pt-4 border-t text-xs text-gray-500">
        <p className="text-center">
          🎯 Arraste os nós pelas laterais para reordenar · Clique para expandir
        </p>
      </div>

      <svg ref={svgRef} className="hidden" style={{ position: "absolute", top: 0, left: 0 }} />
    </div>
  );
}
