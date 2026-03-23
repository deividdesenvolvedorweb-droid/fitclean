import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Copy, Trash2, Eye, EyeOff, Plus, X, ArrowLeft, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StyleFields } from "./StyleFields";
import { AdvancedFields } from "./AdvancedFields";
import { CHILD_WIDGETS } from "./WidgetGrid";
import { ImageUpload } from "@/components/admin/shared/ImageUpload";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { type DeviceMode } from "./ResponsiveControl";

interface DraftBlock {
  id: string;
  type: string;
  config: Record<string, any>;
  sort_order: number;
  active: boolean;
}

interface BlockConfigPanelProps {
  block: DraftBlock;
  index: number;
  total: number;
  onUpdate: (config: Record<string, any>) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  deviceMode: DeviceMode;
}

const BLOCK_LABELS: Record<string, string> = {
  banner_slider: "Banner / Slider",
  heading: "Título",
  text: "Texto",
  button: "Botão",
  image: "Imagem",
  video: "Vídeo",
  divider: "Divisor",
  products: "Produtos",
  categories: "Categorias",
  spacer: "Espaçador",
  container: "Container",
  section: "Seção",
  icon_box: "Caixa de Ícone",
  social_icons: "Redes Sociais",
  image_carousel: "Carrossel Imagens",
  video_carousel: "Carrossel Vídeos",
  accordion: "Acordeão",
  tabs: "Abas",
  countdown: "Contagem Regressiva",
};

// Popular Lucide icons for icon_box
const ICON_OPTIONS = [
  "Home","Star","Heart","Shield","Zap","Award","Bell","BookOpen","Camera","CheckCircle",
  "Clock","Cloud","Coffee","Compass","CreditCard","Download","Edit","Eye","Gift","Globe",
  "Headphones","Info","Key","Layers","Mail","Map","Music","Phone","Send","Settings",
  "ShoppingCart","Smile","Sun","Target","ThumbsUp","Truck","Users","Wifi","Wrench","X",
];

const SOCIAL_PLATFORMS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "twitter", label: "X / Twitter" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "pinterest", label: "Pinterest" },
];

// Renders content fields for a given block type + config
function ContentFieldsForType({ type, config, set, categories }: { type: string; config: Record<string, any>; set: (key: string, value: any) => void; categories: any[] }) {
  if (type === "banner_slider") return <p className="text-sm text-muted-foreground">Exibe automaticamente os banners cadastrados na seção Banners.</p>;

  if (type === "text") return (
    <>
      <div><Label className="text-xs">Título</Label><Input value={config.title || ""} onChange={(e) => set("title", e.target.value)} className="mt-1 h-8 text-xs" /></div>
      <div><Label className="text-xs">Subtítulo</Label><Input value={config.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} className="mt-1 h-8 text-xs" /></div>
      <div><Label className="text-xs">Descrição</Label><Textarea value={config.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} className="mt-1 text-xs" /></div>
      <div>
        <Label className="text-xs">Alinhamento</Label>
        <Select value={config.align || "center"} onValueChange={(v) => set("align", v)}>
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

  if (type === "image") return (
    <>
      <div>
        <Label className="text-xs">Imagem</Label>
        <ImageUpload value={config.image_url || ""} onChange={(url) => set("image_url", typeof url === "string" ? url : (url as string[])[0] || "")} bucket="layout" aspectRatio="16/9" placeholder="Arraste ou clique para enviar" />
      </div>
      <div><Label className="text-xs">Link (opcional)</Label><Input value={config.link || ""} onChange={(e) => set("link", e.target.value)} placeholder="/categoria/..." className="mt-1 h-8 text-xs" /></div>
      <div><Label className="text-xs">Alt Text</Label><Input value={config.alt || ""} onChange={(e) => set("alt", e.target.value)} className="mt-1 h-8 text-xs" /></div>
      <div className="flex items-center gap-2"><Switch checked={config.full_width || false} onCheckedChange={(v) => set("full_width", v)} /><Label className="text-xs">Largura total</Label></div>
    </>
  );

  if (type === "video") return (
    <>
      <div><Label className="text-xs">URL do Vídeo (YouTube/Vimeo)</Label><Input value={config.video_url || ""} onChange={(e) => set("video_url", e.target.value)} placeholder="https://youtube.com/..." className="mt-1 h-8 text-xs" /></div>
      <Separator />
      <div>
        <Label className="text-xs">Ou envie um vídeo MP4</Label>
        <ImageUpload value={config.video_upload || ""} onChange={(url) => set("video_upload", typeof url === "string" ? url : (url as string[])[0] || "")} bucket="layout" aspectRatio="16/9" placeholder="Arraste um vídeo MP4 aqui" acceptVideo />
      </div>
      <div>
        <Label className="text-xs">Proporção</Label>
        <Select value={config.aspect_ratio || "16/9"} onValueChange={(v) => set("aspect_ratio", v)}>
          <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="16/9">16:9</SelectItem><SelectItem value="4/3">4:3</SelectItem><SelectItem value="1/1">1:1</SelectItem><SelectItem value="9/16">9:16</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2"><Switch checked={config.autoplay || false} onCheckedChange={(v) => set("autoplay", v)} /><Label className="text-xs">Autoplay</Label></div>
      <div className="flex items-center gap-2"><Switch checked={config.loop || false} onCheckedChange={(v) => set("loop", v)} /><Label className="text-xs">Loop</Label></div>
      <div className="flex items-center gap-2"><Switch checked={config.muted ?? true} onCheckedChange={(v) => set("muted", v)} /><Label className="text-xs">Mudo</Label></div>
      <div className="flex items-center gap-2"><Switch checked={config.full_width || false} onCheckedChange={(v) => set("full_width", v)} /><Label className="text-xs">Largura total</Label></div>
    </>
  );

  if (type === "products") return (
    <>
      <div><Label className="text-xs">Título</Label><Input value={config.title || ""} onChange={(e) => set("title", e.target.value)} className="mt-1 h-8 text-xs" /></div>
      <div><Label className="text-xs">Subtítulo</Label><Input value={config.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} className="mt-1 h-8 text-xs" /></div>
      <div>
        <Label className="text-xs">Fonte</Label>
        <Select value={config.source || "featured"} onValueChange={(v) => set("source", v)}>
          <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Destaques</SelectItem><SelectItem value="bestsellers">Mais Vendidos</SelectItem><SelectItem value="recent">Recentes</SelectItem><SelectItem value="discounted">Em Promoção</SelectItem><SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Categoria</Label>
        <Select value={config.category_id || "all"} onValueChange={(v) => set("category_id", v === "all" ? null : v)}>
          <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Ordenação</Label>
        <Select value={config.order_by || "recent"} onValueChange={(v) => set("order_by", v)}>
          <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais Recentes</SelectItem><SelectItem value="price_asc">Menor Preço</SelectItem><SelectItem value="price_desc">Maior Preço</SelectItem><SelectItem value="name_asc">Nome A-Z</SelectItem><SelectItem value="name_desc">Nome Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Preço mín.</Label><Input type="number" value={config.price_min ?? ""} onChange={(e) => set("price_min", e.target.value ? Number(e.target.value) : null)} className="mt-1 h-8 text-xs" min={0} /></div>
        <div><Label className="text-xs">Preço máx.</Label><Input type="number" value={config.price_max ?? ""} onChange={(e) => set("price_max", e.target.value ? Number(e.target.value) : null)} className="mt-1 h-8 text-xs" min={0} /></div>
      </div>
      <div><Label className="text-xs">Máximo de produtos</Label><Input type="number" value={config.max || 8} onChange={(e) => set("max", Number(e.target.value))} min={1} max={50} className="mt-1 h-8 text-xs" /></div>
    </>
  );

  if (type === "categories") return (
    <>
      <div><Label className="text-xs">Título</Label><Input value={config.title || ""} onChange={(e) => set("title", e.target.value)} className="mt-1 h-8 text-xs" /></div>
      <div><Label className="text-xs">Subtítulo</Label><Input value={config.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} className="mt-1 h-8 text-xs" /></div>
      <div><Label className="text-xs">Máximo</Label><Input type="number" value={config.max || 6} onChange={(e) => set("max", Number(e.target.value))} min={1} max={12} className="mt-1 h-8 text-xs" /></div>
    </>
  );

  if (type === "spacer") return (
    <div><Label className="text-xs">Altura (px)</Label><Input type="number" value={config.height || 40} onChange={(e) => set("height", Number(e.target.value))} min={8} max={400} className="mt-1 h-8 text-xs" /></div>
  );

  if (type === "icon_box") return (
    <>
      <div>
        <Label className="text-xs">Ícone</Label>
        <Select value={config.icon || "Star"} onValueChange={(v) => set("icon", v)}>
          <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-60">
            {ICON_OPTIONS.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Título</Label><Input value={config.title || ""} onChange={(e) => set("title", e.target.value)} className="mt-1 h-8 text-xs" /></div>
      <div><Label className="text-xs">Descrição</Label><Textarea value={config.description || ""} onChange={(e) => set("description", e.target.value)} rows={2} className="mt-1 text-xs" /></div>
      <div><Label className="text-xs">Link (opcional)</Label><Input value={config.link || ""} onChange={(e) => set("link", e.target.value)} className="mt-1 h-8 text-xs" /></div>
      <div>
        <Label className="text-xs">Alinhamento</Label>
        <Select value={config.align || "center"} onValueChange={(v) => set("align", v)}>
          <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Esquerda</SelectItem><SelectItem value="center">Centro</SelectItem><SelectItem value="right">Direita</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );

  if (type === "social_icons") {
    const items: { platform: string; url: string }[] = config.items || [];
    const updateItems = (newItems: typeof items) => set("items", newItems);
    return (
      <>
        <div>
          <Label className="text-xs">Formato</Label>
          <Select value={config.format || "icon"} onValueChange={(v) => set("format", v)}>
            <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="icon">Apenas ícone</SelectItem>
              <SelectItem value="icon_text">Ícone + Texto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Alinhamento</Label>
          <Select value={config.align || "center"} onValueChange={(v) => set("align", v)}>
            <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Esquerda</SelectItem><SelectItem value="center">Centro</SelectItem><SelectItem value="right">Direita</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Separator />
        <Label className="text-xs font-semibold">Redes</Label>
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1">
            <span className="text-[10px] w-16 shrink-0">{SOCIAL_PLATFORMS.find(p => p.key === item.platform)?.label}</span>
            <Input value={item.url} onChange={(e) => { const n = [...items]; n[idx] = { ...n[idx], url: e.target.value }; updateItems(n); }} className="h-7 text-xs flex-1" placeholder="https://..." />
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-destructive" onClick={() => updateItems(items.filter((_, i) => i !== idx))}><X className="h-3 w-3" /></Button>
          </div>
        ))}
        <Select onValueChange={(platform) => updateItems([...items, { platform, url: "" }])}>
          <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="+ Adicionar rede" /></SelectTrigger>
          <SelectContent>
            {SOCIAL_PLATFORMS.filter(p => !items.some(i => i.platform === p.key)).map(p => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </>
    );
  }

  if (type === "image_carousel") {
    const images: string[] = config.images || [];
    return (
      <>
        <div>
          <Label className="text-xs">Imagens</Label>
          <ImageUpload
            value={images}
            onChange={(urls) => set("images", Array.isArray(urls) ? urls : [urls])}
            bucket="layout"
            multiple
            placeholder="Enviar imagens para o carrossel"
          />
        </div>
        <div className="flex items-center gap-2"><Switch checked={config.autoplay || false} onCheckedChange={(v) => set("autoplay", v)} /><Label className="text-xs">Autoplay</Label></div>
        {config.autoplay && <div><Label className="text-xs">Intervalo (ms)</Label><Input type="number" value={config.interval || 3000} onChange={(e) => set("interval", Number(e.target.value))} min={1000} max={10000} step={500} className="mt-1 h-8 text-xs" /></div>}
        <div className="flex items-center gap-2"><Switch checked={config.loop ?? true} onCheckedChange={(v) => set("loop", v)} /><Label className="text-xs">Loop</Label></div>
        <div className="flex items-center gap-2"><Switch checked={config.show_arrows ?? true} onCheckedChange={(v) => set("show_arrows", v)} /><Label className="text-xs">Setas de navegação</Label></div>
        <div className="flex items-center gap-2"><Switch checked={config.show_dots ?? true} onCheckedChange={(v) => set("show_dots", v)} /><Label className="text-xs">Dots</Label></div>
      </>
    );
  }

  if (type === "video_carousel") {
    const videos: string[] = config.videos || [];
    return (
      <>
        <Label className="text-xs font-semibold">Vídeos</Label>
        {videos.map((url, idx) => (
          <div key={idx} className="flex items-center gap-1">
            <Input value={url} onChange={(e) => { const n = [...videos]; n[idx] = e.target.value; set("videos", n); }} className="h-7 text-xs flex-1" placeholder="YouTube/Vimeo URL ou MP4" />
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-destructive" onClick={() => set("videos", videos.filter((_, i) => i !== idx))}><X className="h-3 w-3" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="h-7 text-xs w-full" onClick={() => set("videos", [...videos, ""])}><Plus className="h-3 w-3 mr-1" />Adicionar vídeo</Button>
        <Separator />
        <div className="flex items-center gap-2"><Switch checked={config.autoplay || false} onCheckedChange={(v) => set("autoplay", v)} /><Label className="text-xs">Autoplay</Label></div>
        <div className="flex items-center gap-2"><Switch checked={config.muted ?? true} onCheckedChange={(v) => set("muted", v)} /><Label className="text-xs">Mudo</Label></div>
        <div className="flex items-center gap-2"><Switch checked={config.loop ?? true} onCheckedChange={(v) => set("loop", v)} /><Label className="text-xs">Loop</Label></div>
      </>
    );
  }

  if (type === "heading") return (
    <>
      <div><Label className="text-xs">Texto</Label><Input value={config.text || ""} onChange={(e) => set("text", e.target.value)} className="mt-1 h-8 text-xs" /></div>
      <div><Label className="text-xs">Subtítulo</Label><Input value={config.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} className="mt-1 h-8 text-xs" /></div>
      <div>
        <Label className="text-xs">Tag HTML</Label>
        <Select value={config.tag || "h2"} onValueChange={(v) => set("tag", v)}>
          <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="h1">H1</SelectItem><SelectItem value="h2">H2</SelectItem><SelectItem value="h3">H3</SelectItem><SelectItem value="h4">H4</SelectItem><SelectItem value="h5">H5</SelectItem><SelectItem value="h6">H6</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Tamanho (px)</Label><Input type="number" value={config.size || ""} onChange={(e) => set("size", e.target.value ? Number(e.target.value) : null)} placeholder="Automático" className="mt-1 h-8 text-xs" /></div>
      <div>
        <Label className="text-xs">Alinhamento</Label>
        <Select value={config.align || "center"} onValueChange={(v) => set("align", v)}>
          <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Esquerda</SelectItem><SelectItem value="center">Centro</SelectItem><SelectItem value="right">Direita</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );

  if (type === "button") return (
    <>
      <div><Label className="text-xs">Texto</Label><Input value={config.text || ""} onChange={(e) => set("text", e.target.value)} className="mt-1 h-8 text-xs" /></div>
      <div><Label className="text-xs">Link</Label><Input value={config.link || ""} onChange={(e) => set("link", e.target.value)} placeholder="https://..." className="mt-1 h-8 text-xs" /></div>
      <div className="flex items-center gap-2"><Switch checked={config.new_tab || false} onCheckedChange={(v) => set("new_tab", v)} /><Label className="text-xs">Abrir em nova aba</Label></div>
      <div>
        <Label className="text-xs">Variante</Label>
        <Select value={config.variant || "filled"} onValueChange={(v) => set("variant", v)}>
          <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="filled">Preenchido</SelectItem><SelectItem value="outline">Contorno</SelectItem><SelectItem value="ghost">Transparente</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Tamanho</Label>
        <Select value={config.size || "md"} onValueChange={(v) => set("size", v)}>
          <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Pequeno</SelectItem><SelectItem value="md">Médio</SelectItem><SelectItem value="lg">Grande</SelectItem><SelectItem value="xl">Extra Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Alinhamento</Label>
        <Select value={config.align || "center"} onValueChange={(v) => set("align", v)}>
          <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Esquerda</SelectItem><SelectItem value="center">Centro</SelectItem><SelectItem value="right">Direita</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );

  if (type === "divider") return (
    <>
      <div>
        <Label className="text-xs">Estilo</Label>
        <Select value={config.style || "solid"} onValueChange={(v) => set("style", v)}>
          <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Sólido</SelectItem><SelectItem value="dashed">Tracejado</SelectItem><SelectItem value="dotted">Pontilhado</SelectItem><SelectItem value="double">Duplo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Largura (%)</Label><Input type="number" value={config.width || 100} onChange={(e) => set("width", Number(e.target.value))} min={10} max={100} className="mt-1 h-8 text-xs" /></div>
      <div><Label className="text-xs">Espessura (px)</Label><Input type="number" value={config.thickness || 1} onChange={(e) => set("thickness", Number(e.target.value))} min={1} max={20} className="mt-1 h-8 text-xs" /></div>
      <div><Label className="text-xs">Espaçamento (px)</Label><Input type="number" value={config.gap || 20} onChange={(e) => set("gap", Number(e.target.value))} min={0} max={100} className="mt-1 h-8 text-xs" /></div>
      <div>
        <Label className="text-xs">Alinhamento</Label>
        <Select value={config.align || "center"} onValueChange={(v) => set("align", v)}>
          <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Esquerda</SelectItem><SelectItem value="center">Centro</SelectItem><SelectItem value="right">Direita</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );

  if (type === "accordion") {
    const items: { title: string; content: string }[] = config.items || [];
    const updateItems = (newItems: typeof items) => set("items", newItems);
    return (
      <>
        <div><Label className="text-xs">Cabeçalho</Label><Input value={config.heading || ""} onChange={(e) => set("heading", e.target.value)} className="mt-1 h-8 text-xs" /></div>
        <div className="flex items-center gap-2"><Switch checked={config.multiple || false} onCheckedChange={(v) => set("multiple", v)} /><Label className="text-xs">Permitir múltiplos abertos</Label></div>
        <Separator />
        <Label className="text-xs font-semibold">Itens</Label>
        {items.map((item, idx) => (
          <div key={idx} className="space-y-1 p-2 border border-border rounded">
            <Input value={item.title} onChange={(e) => { const n = [...items]; n[idx] = { ...n[idx], title: e.target.value }; updateItems(n); }} placeholder="Título" className="h-7 text-xs" />
            <Textarea value={item.content} onChange={(e) => { const n = [...items]; n[idx] = { ...n[idx], content: e.target.value }; updateItems(n); }} placeholder="Conteúdo" rows={2} className="text-xs" />
            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive" onClick={() => updateItems(items.filter((_, i) => i !== idx))}><X className="h-3 w-3 mr-1" />Remover</Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="h-7 text-xs w-full" onClick={() => updateItems([...items, { title: "", content: "" }])}><Plus className="h-3 w-3 mr-1" />Adicionar item</Button>
      </>
    );
  }

  if (type === "tabs") {
    const items: { title: string; content: string }[] = config.items || [];
    const updateItems = (newItems: typeof items) => set("items", newItems);
    return (
      <>
        <div><Label className="text-xs">Cabeçalho</Label><Input value={config.heading || ""} onChange={(e) => set("heading", e.target.value)} className="mt-1 h-8 text-xs" /></div>
        <Separator />
        <Label className="text-xs font-semibold">Abas</Label>
        {items.map((item, idx) => (
          <div key={idx} className="space-y-1 p-2 border border-border rounded">
            <Input value={item.title} onChange={(e) => { const n = [...items]; n[idx] = { ...n[idx], title: e.target.value }; updateItems(n); }} placeholder="Título da aba" className="h-7 text-xs" />
            <Textarea value={item.content} onChange={(e) => { const n = [...items]; n[idx] = { ...n[idx], content: e.target.value }; updateItems(n); }} placeholder="Conteúdo" rows={2} className="text-xs" />
            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive" onClick={() => updateItems(items.filter((_, i) => i !== idx))}><X className="h-3 w-3 mr-1" />Remover</Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="h-7 text-xs w-full" onClick={() => updateItems([...items, { title: "", content: "" }])}><Plus className="h-3 w-3 mr-1" />Adicionar aba</Button>
      </>
    );
  }

  if (type === "countdown") return (
    <>
      <div><Label className="text-xs">Cabeçalho</Label><Input value={config.heading || ""} onChange={(e) => set("heading", e.target.value)} className="mt-1 h-8 text-xs" /></div>
      <div><Label className="text-xs">Data alvo</Label><Input type="datetime-local" value={(config.target_date || "").slice(0, 16)} onChange={(e) => set("target_date", new Date(e.target.value).toISOString())} className="mt-1 h-8 text-xs" /></div>
    </>
  );

  return null;
}

// Style fields specific to new widget types
function ExtraStyleFields({ type, config, set }: { type: string; config: Record<string, any>; set: (key: string, value: any) => void }) {
  if (type === "icon_box") return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ícone</h4>
      <div className="flex items-center gap-2">
        <input type="color" value={config.style_icon_color || "#000000"} onChange={(e) => set("style_icon_color", e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer" />
        <div className="flex-1"><Label className="text-xs">Cor do ícone</Label><Input value={config.style_icon_color || ""} onChange={(e) => set("style_icon_color", e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
      </div>
      <div><Label className="text-xs">Tamanho do ícone (px)</Label><Input type="number" value={config.style_icon_size || 40} onChange={(e) => set("style_icon_size", Number(e.target.value))} min={16} max={120} className="mt-1 h-8 text-xs" /></div>
      <div className="flex items-center gap-2">
        <input type="color" value={config.style_icon_bg || "#f0f0f0"} onChange={(e) => set("style_icon_bg", e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer" />
        <div className="flex-1"><Label className="text-xs">Fundo do ícone</Label><Input value={config.style_icon_bg || ""} onChange={(e) => set("style_icon_bg", e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
      </div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Texto</h4>
      <div className="flex items-center gap-2">
        <input type="color" value={config.style_title_color || "#000000"} onChange={(e) => set("style_title_color", e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer" />
        <div className="flex-1"><Label className="text-xs">Cor do título</Label><Input value={config.style_title_color || ""} onChange={(e) => set("style_title_color", e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
      </div>
      <div className="flex items-center gap-2">
        <input type="color" value={config.style_desc_color || "#666666"} onChange={(e) => set("style_desc_color", e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer" />
        <div className="flex-1"><Label className="text-xs">Cor da descrição</Label><Input value={config.style_desc_color || ""} onChange={(e) => set("style_desc_color", e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
      </div>
    </div>
  );

  if (type === "social_icons") return (
    <div className="space-y-3">
      <div><Label className="text-xs">Tamanho dos ícones (px)</Label><Input type="number" value={config.style_size || 24} onChange={(e) => set("style_size", Number(e.target.value))} min={16} max={64} className="mt-1 h-8 text-xs" /></div>
      <div className="flex items-center gap-2">
        <input type="color" value={config.style_color || "#000000"} onChange={(e) => set("style_color", e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer" />
        <div className="flex-1"><Label className="text-xs">Cor dos ícones</Label><Input value={config.style_color || ""} onChange={(e) => set("style_color", e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
      </div>
      <div><Label className="text-xs">Espaçamento entre ícones (px)</Label><Input type="number" value={config.style_gap || 16} onChange={(e) => set("style_gap", Number(e.target.value))} min={4} max={60} className="mt-1 h-8 text-xs" /></div>
    </div>
  );

  if (type === "image_carousel") return (
    <div className="space-y-3">
      <div><Label className="text-xs">Altura (px)</Label><Input type="number" value={config.style_height || 400} onChange={(e) => set("style_height", Number(e.target.value))} min={100} max={800} className="mt-1 h-8 text-xs" /></div>
      <div><Label className="text-xs">Raio da borda (px)</Label><Input type="number" value={config.style_border_radius || 8} onChange={(e) => set("style_border_radius", Number(e.target.value))} min={0} max={50} className="mt-1 h-8 text-xs" /></div>
      <div className="flex items-center gap-2">
        <input type="color" value={config.style_arrow_color || "#ffffff"} onChange={(e) => set("style_arrow_color", e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer" />
        <div className="flex-1"><Label className="text-xs">Cor das setas</Label></div>
      </div>
      <div className="flex items-center gap-2">
        <input type="color" value={config.style_dot_color || "#ffffff"} onChange={(e) => set("style_dot_color", e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer" />
        <div className="flex-1"><Label className="text-xs">Cor dos dots</Label></div>
      </div>
    </div>
  );

  if (type === "video_carousel") return (
    <div className="space-y-3">
      <div><Label className="text-xs">Altura (px)</Label><Input type="number" value={config.style_height || 400} onChange={(e) => set("style_height", Number(e.target.value))} min={100} max={800} className="mt-1 h-8 text-xs" /></div>
      <div className="flex items-center gap-2">
        <input type="color" value={config.style_control_color || "#ffffff"} onChange={(e) => set("style_control_color", e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer" />
        <div className="flex-1"><Label className="text-xs">Cor dos controles</Label></div>
      </div>
    </div>
  );

  return null;
}

export function BlockConfigPanel({ block, index, total, onUpdate, onMove, onDuplicate, onDelete, onToggleActive, deviceMode }: BlockConfigPanelProps) {
  const set = (key: string, value: any) => onUpdate({ ...block.config, [key]: value });
  const [addingToCol, setAddingToCol] = useState<number | null>(null);
  const [editingChild, setEditingChild] = useState<{ col: number; idx: number } | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-select"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name, slug").eq("active", true).order("name");
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Container/Section child helpers
  const isContainerType = block.type === "container" || block.type === "section";
  const getChildren = (): any[][] => {
    const layout = block.config.layout || (block.type === "container" ? "1/2+1/2" : "1");
    const cols = layout === "1" ? 1 : layout.split("+").length;
    const children: any[] = Array.isArray(block.config.children) ? block.config.children : [];
    // Support both nested arrays and flat objects
    if (children.length > 0 && Array.isArray(children[0])) {
      return Array.from({ length: cols }, (_, i) => Array.isArray(children[i]) ? children[i] : []);
    }
    // Flat format with _col
    return Array.from({ length: cols }, (_, i) => children.filter((c: any) => (c?._col ?? 0) === i));
  };

  const updateChildren = (newChildren: any[][]) => {
    onUpdate({ ...block.config, children: newChildren });
  };

  const addChildWidget = (colIdx: number, type: string) => {
    const children = getChildren();
    children[colIdx] = [...children[colIdx], { type, config: {} }];
    updateChildren(children);
    setAddingToCol(null);
  };

  const removeChildWidget = (colIdx: number, childIdx: number) => {
    const children = getChildren();
    children[colIdx] = children[colIdx].filter((_: any, i: number) => i !== childIdx);
    updateChildren(children);
    if (editingChild?.col === colIdx && editingChild?.idx === childIdx) setEditingChild(null);
  };

  const setChildConfig = (colIdx: number, childIdx: number, key: string, value: any) => {
    const children = getChildren();
    children[colIdx] = children[colIdx].map((child: any, i: number) =>
      i === childIdx ? { ...child, config: { ...child.config, [key]: value } } : child
    );
    updateChildren(children);
  };

  // If editing a child widget, render its config panel
  if (isContainerType && editingChild) {
    const children = getChildren();
    const child = children[editingChild.col]?.[editingChild.idx];
    if (!child) { setEditingChild(null); return null; }
    const childSet = (key: string, value: any) => setChildConfig(editingChild.col, editingChild.idx, key, value);
    const childLabel = BLOCK_LABELS[child.type] || child.type;

    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-border shrink-0">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 mb-2" onClick={() => setEditingChild(null)}>
            <ArrowLeft className="h-3 w-3" /> Voltar
          </Button>
          <h3 className="font-semibold text-sm">{childLabel} <span className="text-muted-foreground font-normal">(Col {editingChild.col + 1})</span></h3>
        </div>
        <Tabs defaultValue="content" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full rounded-none border-b shrink-0 h-9">
            <TabsTrigger value="content" className="text-xs flex-1">Conteúdo</TabsTrigger>
            <TabsTrigger value="style" className="text-xs flex-1">Estilo</TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs flex-1">Avançado</TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="content" className="p-3 mt-0 space-y-3">
              <ContentFieldsForType type={child.type} config={child.config || {}} set={childSet} categories={categories} />
            </TabsContent>
            <TabsContent value="style" className="p-3 mt-0 space-y-3">
              <StyleFields config={child.config || {}} onChange={childSet} type={child.type} deviceMode={deviceMode} />
              <ExtraStyleFields type={child.type} config={child.config || {}} set={childSet} />
            </TabsContent>
            <TabsContent value="advanced" className="p-3 mt-0">
              <AdvancedFields config={child.config || {}} onChange={childSet} deviceMode={deviceMode} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Block header + actions */}
      <div className="p-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">{BLOCK_LABELS[block.type] || block.type}</h3>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleActive} title={block.active ? "Desativar" : "Ativar"}>
              {block.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMove(-1)} disabled={index === 0}><ChevronUp className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMove(1)} disabled={index === total - 1}><ChevronDown className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDuplicate}><Copy className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={block.active} onCheckedChange={onToggleActive} />
          <span className="text-xs text-muted-foreground">{block.active ? "Ativo" : "Inativo"}</span>
        </div>
      </div>

      <Tabs defaultValue="content" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full rounded-none border-b shrink-0 h-9">
          <TabsTrigger value="content" className="text-xs flex-1">Conteúdo</TabsTrigger>
          <TabsTrigger value="style" className="text-xs flex-1">Estilo</TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs flex-1">Avançado</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="content" className="p-3 mt-0 space-y-3">
            {/* For non-container/section types, use the shared content fields */}
            {!isContainerType && (
              <ContentFieldsForType type={block.type} config={block.config} set={set} categories={categories} />
            )}



            {isContainerType && (
              <>
                <div>
                  <Label className="text-xs">Layout das colunas</Label>
                  <Select value={block.config.layout || (block.type === "container" ? "1/2+1/2" : "1")} onValueChange={(v) => {
                    const cols = v === "1" ? 1 : v.split("+").length;
                    const currentChildren: any[][] = block.config.children || [];
                    const newChildren = Array.from({ length: cols }, (_, i) => currentChildren[i] || []);
                    onUpdate({ ...block.config, layout: v, children: newChildren });
                  }}>
                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 coluna</SelectItem>
                      <SelectItem value="1/2+1/2">2 colunas iguais</SelectItem>
                      <SelectItem value="1/3+2/3">1/3 + 2/3</SelectItem>
                      <SelectItem value="2/3+1/3">2/3 + 1/3</SelectItem>
                      <SelectItem value="1/3+1/3+1/3">3 colunas iguais</SelectItem>
                      <SelectItem value="1/4+1/4+1/4+1/4">4 colunas iguais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Gap entre colunas (px)</Label>
                  <Input type="number" value={block.config.adv_gap || 24} onChange={(e) => set("adv_gap", Number(e.target.value))} min={0} max={100} className="mt-1 h-8 text-xs" />
                </div>
                <Separator />

                {getChildren().map((col, colIdx) => (
                  <div key={colIdx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Coluna {colIdx + 1}</span>
                      <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => setAddingToCol(addingToCol === colIdx ? null : colIdx)}>
                        <Plus className="h-3 w-3" /> Adicionar
                      </Button>
                    </div>

                    {addingToCol === colIdx && (
                      <div className="grid grid-cols-2 gap-1 p-2 border border-dashed border-primary/40 rounded-lg bg-primary/5">
                        {CHILD_WIDGETS.map((w) => (
                          <button key={w.type} type="button" onClick={() => addChildWidget(colIdx, w.type)} className="flex items-center gap-1.5 p-2 rounded text-[11px] hover:bg-accent transition-colors">
                            <w.icon className="h-3.5 w-3.5 text-muted-foreground" /><span>{w.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {col.length === 0 && addingToCol !== colIdx && (
                      <p className="text-[10px] text-muted-foreground/60 px-2">Vazio — clique em Adicionar</p>
                    )}
                    {col.map((child: any, childIdx: number) => {
                      const ChildIcon = CHILD_WIDGETS.find(w => w.type === child.type)?.icon;
                      const childLabel = BLOCK_LABELS[child.type] || child.type;
                      return (
                        <div key={childIdx} className="flex items-center gap-2 px-2 py-1.5 rounded border border-border bg-card text-xs group cursor-pointer hover:border-primary/50" onClick={() => setEditingChild({ col: colIdx, idx: childIdx })}>
                          {ChildIcon && <ChildIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                          <span className="flex-1 truncate">{child.config?.title || childLabel}</span>
                          <Settings className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                          <Button type="button" variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive" onClick={(e) => { e.stopPropagation(); removeChildWidget(colIdx, childIdx); }}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                    {colIdx < getChildren().length - 1 && <Separator />}
                  </div>
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="style" className="p-3 mt-0 space-y-4">
            <StyleFields config={block.config} onChange={set} type={block.type} deviceMode={deviceMode} />
            <ExtraStyleFields type={block.type} config={block.config} set={set} />
          </TabsContent>

          <TabsContent value="advanced" className="p-3 mt-0">
            <AdvancedFields config={block.config} onChange={set} deviceMode={deviceMode} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
