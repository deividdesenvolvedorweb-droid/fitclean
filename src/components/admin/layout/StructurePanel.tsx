import { useRef, useState, useCallback } from "react";
import { GalleryHorizontal, Type, ImageIcon, ShoppingBag, FolderTree, Minus, Play, Columns, Box, Share2, Images, Film, Heading, MousePointerClick, SeparatorHorizontal, ChevronDown, LayoutList, Timer, GripVertical, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraftBlock {
  id: string;
  type: string;
  config: Record<string, any>;
  sort_order: number;
  active: boolean;
}

const ICONS: Record<string, any> = {
  banner_slider: GalleryHorizontal, heading: Heading, text: Type, button: MousePointerClick,
  image: ImageIcon, products: ShoppingBag, categories: FolderTree, spacer: Minus,
  divider: SeparatorHorizontal, video: Play, container: Columns, icon_box: Box,
  social_icons: Share2, image_carousel: Images, video_carousel: Film,
  accordion: ChevronDown, tabs: LayoutList, countdown: Timer, section: LayoutTemplate,
};

const LABELS: Record<string, string> = {
  banner_slider: "Banner / Slider", heading: "Título", text: "Texto", button: "Botão",
  image: "Imagem", products: "Produtos", categories: "Categorias", spacer: "Espaçador",
  divider: "Divisor", video: "Vídeo", container: "Container", icon_box: "Caixa de Ícone",
  social_icons: "Redes Sociais", image_carousel: "Carrossel Imagens", video_carousel: "Carrossel Vídeos",
  accordion: "Acordeão", tabs: "Abas", countdown: "Contagem Regressiva", section: "Seção",
};

interface StructurePanelProps {
  blocks: DraftBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

export function StructurePanel({ blocks = [], selectedId, onSelect, onReorder }: StructurePanelProps) {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragRef.current = index;
    setDragIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIdx(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = dragRef.current;
    if (fromIndex !== null && fromIndex !== toIndex && onReorder) {
      onReorder(fromIndex, toIndex);
    }
    setDragIdx(null);
    setOverIdx(null);
    dragRef.current = null;
  }, [onReorder]);

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setOverIdx(null);
    dragRef.current = null;
  }, []);

  // Group blocks into rows for visual display
  const rows: { rowId: string; blocks: { block: DraftBlock; globalIndex: number }[] }[] = [];
  safeBlocks.forEach((block, index) => {
    const rowId = block.config?._row;
    if (rowId) {
      const existing = rows.find(r => r.rowId === rowId);
      if (existing) {
        existing.blocks.push({ block, globalIndex: index });
        return;
      }
    }
    rows.push({ rowId: rowId || block.id, blocks: [{ block, globalIndex: index }] });
  });

  return (
    <div className="p-3 space-y-1">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">Estrutura da Página</h3>
      {safeBlocks.length === 0 && (
        <p className="text-xs text-muted-foreground px-2">Nenhum bloco adicionado</p>
      )}
      {rows.map((row, rowIndex) => {
        const isMultiCol = row.blocks.length > 1;

        if (!isMultiCol) {
          const { block, globalIndex } = row.blocks[0];
          return (
            <SingleBlockItem
              key={block.id}
              block={block}
              index={globalIndex}
              selectedId={selectedId}
              onSelect={onSelect}
              onReorder={onReorder}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              handleDragEnd={handleDragEnd}
              dragIdx={dragIdx}
              overIdx={overIdx}
            />
          );
        }

        // Multi-column row
        return (
          <div key={row.rowId} className="border border-dashed border-primary/30 rounded-md p-1.5 space-y-0.5 bg-primary/5">
            <span className="text-[9px] font-bold text-primary/60 uppercase tracking-wider px-1">Linha ({row.blocks.length} colunas)</span>
            {row.blocks.map(({ block, globalIndex }) => (
              <SingleBlockItem
                key={block.id}
                block={block}
                index={globalIndex}
                selectedId={selectedId}
                onSelect={onSelect}
                onReorder={onReorder}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                handleDragEnd={handleDragEnd}
                dragIdx={dragIdx}
                overIdx={overIdx}
                inRow
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function SingleBlockItem({ block, index, selectedId, onSelect, onReorder, handleDragStart, handleDragOver, handleDrop, handleDragEnd, dragIdx, overIdx, inRow }: {
  block: DraftBlock; index: number; selectedId: string | null; onSelect: (id: string) => void;
  onReorder?: (from: number, to: number) => void;
  handleDragStart: (e: React.DragEvent, i: number) => void;
  handleDragOver: (e: React.DragEvent, i: number) => void;
  handleDrop: (e: React.DragEvent, i: number) => void;
  handleDragEnd: () => void;
  dragIdx: number | null; overIdx: number | null; inRow?: boolean;
}) {
  const Icon = ICONS[block.type] || Type;
  const label = block.config?.title || LABELS[block.type] || block.type;
  const isSelected = block.id === selectedId;
  const isDragging = dragIdx === index;
  const isOver = overIdx === index && dragIdx !== index;

  return (
    <div key={block.id}>
      <button
        draggable={!!onReorder}
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        onClick={() => onSelect(block.id)}
        className={cn(
          "w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors text-left",
          isSelected
            ? "bg-primary/10 text-primary border border-primary/30"
            : "hover:bg-accent text-foreground",
          !block.active && "opacity-40",
          isDragging && "opacity-30",
          isOver && "border-t-2 border-t-primary"
        )}
      >
        {onReorder && <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground cursor-grab" />}
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate flex-1">{label}</span>
        {inRow && <span className="text-[9px] text-primary/50 shrink-0">{block.config?._col_width}</span>}
        <span className="text-[10px] text-muted-foreground shrink-0">#{index + 1}</span>
      </button>

      {(block.type === "container" || block.type === "section") && Array.isArray(block.config?.children) && block.config.children.length > 0 && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-2">
          {(() => {
            const raw = block.config.children as any[];
            // Support nested arrays and flat objects
            const items: any[] = raw.length > 0 && Array.isArray(raw[0])
              ? raw.flat()
              : raw;
            return items.map((child: any, childIdx: number) => {
              if (!child || !child.type) return null;
              const ChildIcon = ICONS[child.type] || Type;
              return (
                <div key={childIdx} className="flex items-center gap-2 px-2 py-1 text-[11px] text-muted-foreground">
                  <ChildIcon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{child.config?.title || LABELS[child.type] || child.type}</span>
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}
