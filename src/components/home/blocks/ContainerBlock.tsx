import { BlockRenderer } from "@/components/home/BlockRenderer";

interface ContainerBlockProps {
  config: Record<string, any>;
}

const LAYOUT_CLASSES: Record<string, string> = {
  "1": "grid-cols-1",
  "1/2+1/2": "grid-cols-2",
  "1/3+2/3": "grid-cols-[1fr_2fr]",
  "2/3+1/3": "grid-cols-[2fr_1fr]",
  "1/3+1/3+1/3": "grid-cols-3",
  "1/4+1/4+1/4+1/4": "grid-cols-4",
};

export function ContainerBlock({ config }: ContainerBlockProps) {
  const layout = config.layout || "1/2+1/2";
  const rawChildren: any[] = Array.isArray(config.children) ? config.children : [];
  const gap = config.adv_gap || 24;
  const overlayOpacity = config.style_bg_overlay_opacity || 0;

  const gridClass = LAYOUT_CLASSES[layout] || "grid-cols-2";

  // Support both formats: flat array of {type,config,_col} OR nested array of arrays
  const colCount = layout === "1" ? 1 : (layout.split("+").length || 2);
  const columns: any[][] = [];

  if (rawChildren.length > 0 && Array.isArray(rawChildren[0])) {
    // Already nested arrays
    for (let i = 0; i < colCount; i++) {
      columns.push(Array.isArray(rawChildren[i]) ? rawChildren[i] : []);
    }
  } else {
    // Flat array with _col property
    for (let i = 0; i < colCount; i++) {
      columns.push(rawChildren.filter((c: any) => (c?._col ?? 0) === i));
    }
  }

  return (
    <section className="container-shop py-8">
      {overlayOpacity > 0 && config.style_bg_image && (
        <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} />
      )}

      <div className={`relative grid ${gridClass}`} style={{ gap: `${gap}px` }}>
        {columns.map((column, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-4 min-h-[60px]">
            {column.length === 0 ? (
              <div className="flex items-center justify-center h-full border-2 border-dashed border-border/50 rounded-lg py-8">
                <p className="text-xs text-muted-foreground">Coluna vazia</p>
              </div>
            ) : (
              column.map((child: any, childIdx: number) => (
                <BlockRenderer key={`${colIdx}-${childIdx}`} block={{ id: `container-${colIdx}-${childIdx}`, type: child?.type, config: child?.config || {} }} />
              ))
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
