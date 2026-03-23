import { useState } from "react";
import { BlockRenderer } from "@/components/home/BlockRenderer";
import { BlockWrapper, type DropPosition } from "./BlockWrapper";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WidgetGrid } from "./WidgetGrid";
import { cn } from "@/lib/utils";

interface DraftBlock {
  id: string;
  type: string;
  config: Record<string, any>;
  sort_order: number;
  active: boolean;
}

interface RowGroup {
  rowId: string;
  blocks: DraftBlock[];
}

function groupBlocksIntoRows(blocks: DraftBlock[]): RowGroup[] {
  const rows: RowGroup[] = [];
  for (const block of blocks) {
    const rowId = block.config?._row;
    if (rowId) {
      const existingRow = rows.find(r => r.rowId === rowId);
      if (existingRow) {
        existingRow.blocks.push(block);
        continue;
      }
    }
    rows.push({ rowId: rowId || block.id, blocks: [block] });
  }
  return rows;
}

interface LayoutPreviewProps {
  blocks: DraftBlock[];
  selectedId: string | null;
  previewMode: boolean;
  onSelect: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
  onToggleActive: (id: string) => void;
  onInsertAt: (type: string, position: number) => void;
  onDeselect: () => void;
  onDropBlock: (fromId: string, toId: string, position: DropPosition) => void;
  onDropNewWidget?: (widgetType: string, targetBlockId: string, position: DropPosition) => void;
  onCopyStyle?: () => void;
  onPasteStyle?: () => void;
  canPasteStyle?: boolean;
}

export function LayoutPreview({
  blocks, selectedId, previewMode,
  onSelect, onMove, onDuplicate, onDelete, onToggleActive,
  onInsertAt, onDeselect, onDropBlock, onDropNewWidget,
  onCopyStyle, onPasteStyle, canPasteStyle
}: LayoutPreviewProps) {
  const rows = groupBlocksIntoRows(blocks);
  const [canvasDropActive, setCanvasDropActive] = useState(false);

  const handleCanvasDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("application/widget-type")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setCanvasDropActive(true);
  };

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (!target.contains(e.relatedTarget as Node)) {
      setCanvasDropActive(false);
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setCanvasDropActive(false);
    const widgetType = e.dataTransfer.getData("application/widget-type");
    if (widgetType) {
      onInsertAt(widgetType, blocks.length);
    }
  };

  const renderBlockWrapper = (block: DraftBlock, opts?: { isInRow?: boolean; colWidth?: string }) => {
    const blockIndex = blocks.findIndex(b => b.id === block.id);
    return (
      <BlockWrapper
        key={block.id}
        blockId={block.id}
        blockType={block.type}
        isSelected={selectedId === block.id}
        isInactive={!block.active}
        index={blockIndex}
        total={blocks.length}
        label={block.type}
        onClick={() => onSelect(block.id)}
        onMove={(dir) => onMove(blockIndex, dir)}
        onDuplicate={() => onDuplicate(blockIndex)}
        onDelete={() => onDelete(blockIndex)}
        onToggleActive={() => onToggleActive(block.id)}
        onCopyStyle={selectedId === block.id ? onCopyStyle : () => { onSelect(block.id); onCopyStyle?.(); }}
        onPasteStyle={selectedId === block.id ? onPasteStyle : () => { onSelect(block.id); onPasteStyle?.(); }}
        canPasteStyle={canPasteStyle}
        previewMode={previewMode}
        onDrop={onDropBlock}
        onDropNewWidget={onDropNewWidget}
        isInRow={opts?.isInRow}
        colWidth={opts?.colWidth}
      >
        <BlockRenderer block={block} />
      </BlockWrapper>
    );
  };

  return (
    <div
      className={cn("min-h-full bg-background", canvasDropActive && "ring-2 ring-primary/30 ring-inset")}
      onClick={() => onDeselect()}
      onDragOver={handleCanvasDragOver}
      onDragLeave={handleCanvasDragLeave}
      onDrop={handleCanvasDrop}
    >
      {blocks.length === 0 ? (
        <div className={cn(
          "flex items-center justify-center h-96 text-muted-foreground border-2 border-dashed border-border/50 m-4 rounded-xl transition-colors",
          canvasDropActive && "border-primary bg-primary/5"
        )}>
          <div className="text-center">
            <p className="text-lg font-medium mb-1">
              {canvasDropActive ? "Solte aqui para adicionar" : "Nenhum bloco adicionado"}
            </p>
            <p className="text-sm">Arraste widgets do painel lateral para começar</p>
          </div>
        </div>
      ) : (
        <div className="space-y-0">
          {rows.map((row) => {
            const isMultiCol = row.blocks.length > 1;

            if (!isMultiCol) {
              return renderBlockWrapper(row.blocks[0]);
            }

            const gap = row.blocks[0]?.config?._row_gap || 16;
            return (
              <div key={row.rowId} className="flex" style={{ gap: `${gap}px` }}>
                {row.blocks.map((block) => {
                  const colWidth = block.config?._col_width || `${100 / row.blocks.length}%`;
                  return renderBlockWrapper(block, { isInRow: true, colWidth });
                })}
              </div>
            );
          })}

          {/* Global add button at the bottom */}
          {!previewMode && (
            <div className="relative h-8 flex items-center justify-center group/insert">
              <div className="absolute inset-x-0 top-1/2 h-px bg-transparent group-hover/insert:bg-primary/30 transition-colors" />
              <Popover>
                <PopoverTrigger asChild>
                  <button className="relative z-10 flex items-center justify-center h-6 w-6 rounded-full bg-muted border border-border text-muted-foreground opacity-0 group-hover/insert:opacity-100 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" side="right">
                  <WidgetGrid onAdd={(type) => onInsertAt(type, blocks.length)} />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
