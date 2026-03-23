import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/shared/ImageUpload";
import { CHILD_WIDGETS } from "@/components/admin/layout/WidgetGrid";
import { cn } from "@/lib/utils";

interface DescBlock {
  type: string;
  config: Record<string, any>;
}

interface ProductDescriptionEditorProps {
  value: DescBlock[];
  onChange: (blocks: DescBlock[]) => void;
}

const BLOCK_LABELS: Record<string, string> = {
  text: "Texto",
  image: "Imagem",
  video: "Vídeo",
  spacer: "Espaçador",
  products: "Produtos",
  categories: "Categorias",
  banner_slider: "Banner",
};

// Only allow certain block types for product description
const DESC_WIDGETS = CHILD_WIDGETS.filter(w =>
  ["text", "image", "video", "spacer"].includes(w.type)
);

export function ProductDescriptionEditor({ value, onChange }: ProductDescriptionEditorProps) {
  const [showPicker, setShowPicker] = useState(false);

  const addBlock = useCallback((type: string) => {
    onChange([...value, { type, config: {} }]);
    setShowPicker(false);
  }, [value, onChange]);

  const removeBlock = useCallback((index: number) => {
    onChange(value.filter((_, i) => i !== index));
  }, [value, onChange]);

  const moveBlock = useCallback((index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= value.length) return;
    const next = [...value];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    onChange(next);
  }, [value, onChange]);

  const updateConfig = useCallback((index: number, key: string, val: any) => {
    onChange(value.map((b, i) => i === index ? { ...b, config: { ...b.config, [key]: val } } : b));
  }, [value, onChange]);

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
          Nenhum bloco adicionado. Clique em "Adicionar bloco" para começar.
        </p>
      )}

      {value.map((block, index) => {
        const Widget = DESC_WIDGETS.find(w => w.type === block.type);
        return (
          <div key={index} className="border rounded-lg bg-card">
            <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
              {Widget && <Widget.icon className="h-4 w-4 text-muted-foreground" />}
              <span className="text-xs font-medium flex-1">{BLOCK_LABELS[block.type] || block.type}</span>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveBlock(index, -1)} disabled={index === 0}>
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveBlock(index, 1)} disabled={index === value.length - 1}>
                <ChevronDown className="h-3 w-3" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeBlock(index)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="p-3 space-y-2">
              <BlockConfigFields block={block} onChange={(key, val) => updateConfig(index, key, val)} />
            </div>
          </div>
        );
      })}

      {showPicker ? (
        <div className="grid grid-cols-2 gap-2 p-3 border border-dashed rounded-lg">
          {DESC_WIDGETS.map(w => (
            <button
              key={w.type}
              type="button"
              onClick={() => addBlock(w.type)}
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors text-xs"
            >
              <w.icon className="h-4 w-4 text-muted-foreground" />
              {w.label}
            </button>
          ))}
          <button type="button" onClick={() => setShowPicker(false)} className="col-span-2 text-xs text-muted-foreground hover:text-foreground py-1">
            Cancelar
          </button>
        </div>
      ) : (
        <Button type="button" variant="outline" className="w-full" onClick={() => setShowPicker(true)}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar bloco
        </Button>
      )}
    </div>
  );
}

function BlockConfigFields({ block, onChange }: { block: DescBlock; onChange: (key: string, val: any) => void }) {
  if (block.type === "text") {
    return (
      <>
        <div><Label className="text-xs">Título</Label><Input value={block.config.title || ""} onChange={e => onChange("title", e.target.value)} className="mt-1 h-8 text-xs" /></div>
        <div><Label className="text-xs">Conteúdo</Label><Textarea value={block.config.description || ""} onChange={e => onChange("description", e.target.value)} rows={4} className="mt-1 text-xs" /></div>
        <div>
          <Label className="text-xs">Alinhamento</Label>
          <Select value={block.config.align || "left"} onValueChange={v => onChange("align", v)}>
            <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Esquerda</SelectItem>
              <SelectItem value="center">Centro</SelectItem>
              <SelectItem value="right">Direita</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </>
    );
  }

  if (block.type === "image") {
    return (
      <>
        <div>
          <Label className="text-xs">Imagem</Label>
          <ImageUpload
            value={block.config.image_url || ""}
            onChange={url => onChange("image_url", typeof url === "string" ? url : (url as string[])[0] || "")}
            bucket="layout"
            aspectRatio="16/9"
            placeholder="Arraste ou clique para enviar"
          />
        </div>
        <div><Label className="text-xs">Alt</Label><Input value={block.config.alt || ""} onChange={e => onChange("alt", e.target.value)} className="mt-1 h-8 text-xs" /></div>
      </>
    );
  }

  if (block.type === "video") {
    return (
      <>
        <div><Label className="text-xs">URL (YouTube/Vimeo)</Label><Input value={block.config.video_url || ""} onChange={e => onChange("video_url", e.target.value)} className="mt-1 h-8 text-xs" placeholder="https://..." /></div>
        <div>
          <Label className="text-xs">Ou envie um MP4</Label>
          <ImageUpload
            value={block.config.video_upload || ""}
            onChange={url => onChange("video_upload", typeof url === "string" ? url : (url as string[])[0] || "")}
            bucket="layout"
            aspectRatio="16/9"
            placeholder="Arraste um vídeo MP4"
            acceptVideo
          />
        </div>
      </>
    );
  }

  if (block.type === "spacer") {
    return (
      <div>
        <Label className="text-xs">Altura (px)</Label>
        <Input type="number" value={block.config.height || 40} onChange={e => onChange("height", Number(e.target.value))} min={8} max={400} className="mt-1 h-8 text-xs" />
      </div>
    );
  }

  return <p className="text-xs text-muted-foreground">Sem configurações para este bloco.</p>;
}
