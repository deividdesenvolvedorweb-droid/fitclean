import { Plus } from "lucide-react";
import { BlockRenderer } from "@/components/home/BlockRenderer";

interface SectionBlockProps {
  config: Record<string, any>;
}

export function SectionBlock({ config }: SectionBlockProps) {
  const minHeight = config.min_height || 120;
  const bgColor = config.style_bg_color || undefined;
  const rawChildren: any[] = Array.isArray(config.children) ? config.children : [];
  const layout = config.layout || "1";
  const gap = config.gap || 16;

  const LAYOUT_CLASSES: Record<string, string> = {
    "1": "grid-cols-1",
    "1/2+1/2": "grid-cols-2",
    "1/3+2/3": "grid-cols-[1fr_2fr]",
    "2/3+1/3": "grid-cols-[2fr_1fr]",
    "1/3+1/3+1/3": "grid-cols-3",
    "1/4+1/4+1/4+1/4": "grid-cols-4",
  };

  const gridClass = LAYOUT_CLASSES[layout] || "grid-cols-1";
  const colCount = layout === "1" ? 1 : layout.split("+").length;

  // Build columns - support both nested arrays and flat objects with _col
  const columns: any[][] = [];
  if (rawChildren.length > 0 && Array.isArray(rawChildren[0])) {
    for (let i = 0; i < colCount; i++) {
      columns.push(Array.isArray(rawChildren[i]) ? rawChildren[i] : []);
    }
  } else {
    for (let i = 0; i < colCount; i++) {
      columns.push(rawChildren.filter((c: any) => (c?._col ?? 0) === i));
    }
  }

  const isEmpty = columns.every(col => col.length === 0);

  return (
    <div
      className="w-full"
      style={{ minHeight: `${minHeight}px`, backgroundColor: bgColor }}
    >
      {isEmpty ? (
        <div className="flex items-center justify-center h-full border-2 border-dashed border-border/40 rounded-lg" style={{ minHeight: `${minHeight}px` }}>
          <div className="text-center text-muted-foreground">
            <Plus className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs opacity-50">Arraste widgets aqui</p>
          </div>
        </div>
      ) : (
        <div className={`grid ${gridClass}`} style={{ gap: `${gap}px` }}>
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-4 min-h-[60px]">
              {col.length === 0 ? (
                <div className="flex items-center justify-center h-full border-2 border-dashed border-border/50 rounded-lg py-8">
                  <p className="text-xs text-muted-foreground">Coluna vazia</p>
                </div>
              ) : (
                col.map((child: any, childIdx: number) => (
                  <BlockRenderer key={`${colIdx}-${childIdx}`} block={{ id: `section-${colIdx}-${childIdx}`, type: child?.type, config: child?.config || {} }} />
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
