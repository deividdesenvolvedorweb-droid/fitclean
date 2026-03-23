import { Image, Type, ImageIcon, ShoppingBag, FolderTree, Minus, GalleryHorizontal, Play, Columns, Box, Share2, Images, Film, Heading, MousePointerClick, SeparatorHorizontal, ChevronDown, LayoutList, Timer, LayoutTemplate } from "lucide-react";

export const WIDGETS = [
  { type: "section", label: "Seção", icon: LayoutTemplate },
  { type: "banner_slider", label: "Banner / Slider", icon: GalleryHorizontal },
  { type: "heading", label: "Título", icon: Heading },
  { type: "text", label: "Texto", icon: Type },
  { type: "button", label: "Botão", icon: MousePointerClick },
  { type: "image", label: "Imagem", icon: ImageIcon },
  { type: "video", label: "Vídeo", icon: Play },
  { type: "divider", label: "Divisor", icon: SeparatorHorizontal },
  { type: "spacer", label: "Espaçador", icon: Minus },
  { type: "products", label: "Produtos", icon: ShoppingBag },
  { type: "categories", label: "Categorias", icon: FolderTree },
  { type: "icon_box", label: "Caixa de Ícone", icon: Box },
  { type: "accordion", label: "Acordeão", icon: ChevronDown },
  { type: "tabs", label: "Abas", icon: LayoutList },
  { type: "countdown", label: "Contagem Regressiva", icon: Timer },
  { type: "social_icons", label: "Redes Sociais", icon: Share2 },
  { type: "image_carousel", label: "Carrossel Imagens", icon: Images },
  { type: "video_carousel", label: "Carrossel Vídeos", icon: Film },
  { type: "container", label: "Container", icon: Columns },
];

// Widgets allowed inside containers (no nested containers/sections)
export const CHILD_WIDGETS = WIDGETS.filter(w => w.type !== "container" && w.type !== "section");

interface WidgetGridProps {
  onAdd: (type: string) => void;
  widgets?: typeof WIDGETS;
}

export function WidgetGrid({ onAdd, widgets = WIDGETS }: WidgetGridProps) {
  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/widget-type", type);
  };

  return (
    <div className="grid grid-cols-2 gap-2 p-4">
      {widgets.map((w) => (
        <button
          key={w.type}
          draggable
          onDragStart={(e) => handleDragStart(e, w.type)}
          onClick={() => onAdd(w.type)}
          className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing group"
        >
          <w.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{w.label}</span>
        </button>
      ))}
    </div>
  );
}
