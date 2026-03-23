import { ReactNode, useState, useRef } from "react";
import { ChevronUp, ChevronDown, Copy, Trash2, GripVertical, Plus, Eye, EyeOff, Clipboard, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";

export type DropPosition = "above" | "below" | "left" | "right" | "inside";

interface BlockWrapperProps {
  children: ReactNode;
  isSelected: boolean;
  isInactive: boolean;
  index: number;
  total: number;
  label: string;
  blockId: string;
  blockType: string;
  onClick: () => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onCopyStyle?: () => void;
  onPasteStyle?: () => void;
  canPasteStyle?: boolean;
  previewMode: boolean;
  onDrop?: (fromBlockId: string, toBlockId: string, position: DropPosition) => void;
  onDropNewWidget?: (widgetType: string, targetBlockId: string, position: DropPosition) => void;
  isInRow?: boolean;
  colWidth?: string;
}

const BLOCK_LABELS: Record<string, string> = {
  banner_slider: "Banner / Slider", heading: "Título", text: "Texto", button: "Botão",
  image: "Imagem", products: "Produtos", categories: "Categorias", spacer: "Espaçador",
  divider: "Divisor", video: "Vídeo", container: "Container", icon_box: "Caixa de Ícone",
  social_icons: "Redes Sociais", image_carousel: "Carrossel Imagens", video_carousel: "Carrossel Vídeos",
  accordion: "Acordeão", tabs: "Abas", countdown: "Contagem Regressiva", section: "Seção",
};

export function BlockWrapper({
  children, isSelected, isInactive, index, total, label, blockId, blockType,
  onClick, onMove, onDuplicate, onDelete, onToggleActive,
  onCopyStyle, onPasteStyle, canPasteStyle,
  previewMode, onDrop, onDropNewWidget, isInRow, colWidth
}: BlockWrapperProps) {
  const [hovered, setHovered] = useState(false);
  const [dropZone, setDropZone] = useState<DropPosition | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  if (previewMode) return <>{children}</>;

  const isContainer = blockType === "section" || blockType === "container";

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/block-id", blockId);
    e.dataTransfer.setData("application/block-index", String(index));
    requestAnimationFrame(() => {
      if (wrapperRef.current) wrapperRef.current.style.opacity = "0.4";
    });
  };

  const handleDragEnd = () => {
    if (wrapperRef.current) wrapperRef.current.style.opacity = "1";
    setDropZone(null);
  };

  const getDropPosition = (e: React.DragEvent): DropPosition => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return "below";
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPct = x / rect.width;
    const yPct = y / rect.height;

    // For containers: if dropping in the center area, it goes "inside"
    if (isContainer && xPct > 0.2 && xPct < 0.8 && yPct > 0.2 && yPct < 0.8) {
      return "inside";
    }

    if (xPct < 0.15) return "left";
    if (xPct > 0.85) return "right";
    if (yPct < 0.5) return "above";
    return "below";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const hasBlockId = e.dataTransfer.types.includes("application/block-id");
    const hasWidgetType = e.dataTransfer.types.includes("application/widget-type");
    if (!hasBlockId && !hasWidgetType) return;
    e.dataTransfer.dropEffect = hasWidgetType ? "copy" : "move";
    const pos = getDropPosition(e);
    setDropZone(pos);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.relatedTarget as Node)) {
      setDropZone(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getDropPosition(e);
    setDropZone(null);

    const widgetType = e.dataTransfer.getData("application/widget-type");
    if (widgetType) {
      onDropNewWidget?.(widgetType, blockId, pos);
      return;
    }

    const fromId = e.dataTransfer.getData("application/block-id");
    if (fromId && fromId !== blockId && onDrop) {
      onDrop(fromId, blockId, pos);
    }
  };

  const dropIndicatorClasses: Record<string, string> = {
    above: "before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-primary before:rounded-full before:z-30",
    below: "after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-primary after:rounded-full after:z-30",
    left: "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary before:rounded-full before:z-30",
    right: "after:absolute after:inset-y-0 after:right-0 after:w-1 after:bg-primary after:rounded-full after:z-30",
    inside: "",
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={wrapperRef}
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative group transition-all",
            isInactive && "opacity-40",
            !isSelected && !dropZone && "hover:outline hover:outline-2 hover:outline-dashed hover:outline-primary/40",
            isSelected && "outline outline-2 outline-primary ring-2 ring-primary/20",
            dropZone && dropZone !== "inside" && dropIndicatorClasses[dropZone],
            dropZone === "inside" && "ring-2 ring-primary ring-inset bg-primary/5"
          )}
          style={colWidth ? { width: colWidth, minWidth: 0 } : undefined}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Drop zone hint overlay */}
          {dropZone && dropZone !== "inside" && (
            <div className="absolute inset-0 z-20 pointer-events-none">
              <div className={cn(
                "absolute bg-primary/10 transition-all",
                dropZone === "left" && "inset-y-0 left-0 w-1/2",
                dropZone === "right" && "inset-y-0 right-0 w-1/2",
                dropZone === "above" && "inset-x-0 top-0 h-1/2",
                dropZone === "below" && "inset-x-0 bottom-0 h-1/2",
              )} />
            </div>
          )}

          {dropZone === "inside" && (
            <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
              <div className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full shadow-lg">
                Soltar dentro
              </div>
            </div>
          )}

          {/* Floating toolbar */}
          {(hovered || isSelected) && (
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 bg-primary text-primary-foreground rounded-t-md px-1 py-0.5 shadow-lg">
              <GripVertical className="h-3.5 w-3.5 opacity-60 cursor-grab" />
              <span className="text-[11px] font-medium px-1 max-w-[100px] truncate">{BLOCK_LABELS[label] || label}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={(e) => { e.stopPropagation(); onMove(-1); }} disabled={index === 0}>
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={(e) => { e.stopPropagation(); onMove(1); }} disabled={index === total - 1}>
                <ChevronDown className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}

          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem onClick={() => onMove(-1)} disabled={index === 0}>
          <ChevronUp className="h-4 w-4 mr-2" /> Mover para cima
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onMove(1)} disabled={index === total - 1}>
          <ChevronDown className="h-4 w-4 mr-2" /> Mover para baixo
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDuplicate}>
          <Copy className="h-4 w-4 mr-2" /> Duplicar
        </ContextMenuItem>
        <ContextMenuItem onClick={onToggleActive}>
          {isInactive ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
          {isInactive ? "Ativar" : "Desativar"}
        </ContextMenuItem>
        <ContextMenuSeparator />
        {onCopyStyle && (
          <ContextMenuItem onClick={onCopyStyle}>
            <Clipboard className="h-4 w-4 mr-2" /> Copiar estilo
          </ContextMenuItem>
        )}
        {onPasteStyle && (
          <ContextMenuItem onClick={onPasteStyle} disabled={!canPasteStyle}>
            <ClipboardPaste className="h-4 w-4 mr-2" /> Colar estilo
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" /> Excluir
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
