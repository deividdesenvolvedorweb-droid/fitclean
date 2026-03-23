import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/shared/ImageUpload";
import { TypographyFields } from "./TypographyFields";
import { type DeviceMode, getResponsiveKey, ResponsiveIndicator } from "./ResponsiveControl";
import { Separator } from "@/components/ui/separator";

interface StyleFieldsProps {
  config: Record<string, any>;
  onChange: (key: string, value: any) => void;
  type: string;
  deviceMode: DeviceMode;
}

function ColorField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer shrink-0" />
      <div className="flex-1">
        <Label className="text-xs">{label}</Label>
        <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="Padrão do tema" className="mt-0.5 h-8 text-xs" />
      </div>
    </div>
  );
}

export function StyleFields({ config, onChange, type, deviceMode }: StyleFieldsProps) {
  const rKey = (base: string) => getResponsiveKey(base, deviceMode);
  const rVal = (base: string) => {
    if (deviceMode === "desktop") return config[base];
    return config[rKey(base)];
  };
  const rPlaceholder = (base: string) => {
    if (deviceMode === "desktop") return "Padrão";
    return config[base] != null ? String(config[base]) : "Padrão";
  };

  const gradientEnabled = !!config.style_gradient_enabled;

  return (
    <div className="space-y-4">
      {/* Background */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fundo</h4>
        <ColorField label="Cor de fundo" value={config.style_bg_color} onChange={(v) => onChange("style_bg_color", v)} />
        <div>
          <Label className="text-xs">Imagem de fundo</Label>
          <ImageUpload
            value={config.style_bg_image || ""}
            onChange={(url) => onChange("style_bg_image", typeof url === "string" ? url : (url as string[])[0] || "")}
            bucket="layout"
            aspectRatio="16/9"
            placeholder="Upload de imagem de fundo"
          />
        </div>
        {config.style_bg_image && (
          <div>
            <Label className="text-xs">Posição do fundo</Label>
            <Select value={config.style_bg_position || "center"} onValueChange={(v) => onChange("style_bg_position", v)}>
              <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="top">Topo</SelectItem>
                <SelectItem value="bottom">Base</SelectItem>
                <SelectItem value="left">Esquerda</SelectItem>
                <SelectItem value="right">Direita</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Gradient */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gradiente</h4>
          <Switch checked={gradientEnabled} onCheckedChange={(v) => onChange("style_gradient_enabled", v)} />
        </div>
        {gradientEnabled && (
          <>
            <Select value={config.style_gradient_type || "linear"} onValueChange={(v) => onChange("style_gradient_type", v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="radial">Radial</SelectItem>
              </SelectContent>
            </Select>
            {config.style_gradient_type !== "radial" && (
              <div>
                <Label className="text-xs">Ângulo (graus)</Label>
                <Input type="number" value={config.style_gradient_angle ?? 135} onChange={(e) => onChange("style_gradient_angle", Number(e.target.value))} min={0} max={360} className="mt-1 h-8 text-xs" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="color" value={config.style_gradient_from || "#6366f1"} onChange={(e) => onChange("style_gradient_from", e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer shrink-0" />
              <div className="flex-1"><Label className="text-xs">Cor inicial</Label><Input value={config.style_gradient_from || ""} onChange={(e) => onChange("style_gradient_from", e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={config.style_gradient_to || "#8b5cf6"} onChange={(e) => onChange("style_gradient_to", e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer shrink-0" />
              <div className="flex-1"><Label className="text-xs">Cor final</Label><Input value={config.style_gradient_to || ""} onChange={(e) => onChange("style_gradient_to", e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={config.style_gradient_via || ""} onChange={(e) => onChange("style_gradient_via", e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer shrink-0" />
              <div className="flex-1"><Label className="text-xs">Cor do meio (opcional)</Label><Input value={config.style_gradient_via || ""} onChange={(e) => onChange("style_gradient_via", e.target.value)} placeholder="Deixe vazio" className="mt-0.5 h-8 text-xs" /></div>
            </div>
            {/* Preview */}
            <div
              className="h-8 rounded border border-border"
              style={{
                background: config.style_gradient_type === "radial"
                  ? `radial-gradient(circle, ${config.style_gradient_from || "#6366f1"}${config.style_gradient_via ? `, ${config.style_gradient_via}` : ""}, ${config.style_gradient_to || "#8b5cf6"})`
                  : `linear-gradient(${config.style_gradient_angle ?? 135}deg, ${config.style_gradient_from || "#6366f1"}${config.style_gradient_via ? `, ${config.style_gradient_via}` : ""}, ${config.style_gradient_to || "#8b5cf6"})`
              }}
            />
          </>
        )}
      </div>

      {/* Typography */}
      <TypographyFields config={config} onChange={onChange} deviceMode={deviceMode} />

      {/* Text color */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cor do Texto</h4>
        <ColorField label="Cor do texto" value={config.style_text_color} onChange={(v) => onChange("style_text_color", v)} />
      </div>

      {/* Box Shadow */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sombra</h4>
          <Switch checked={!!config.style_shadow_enabled} onCheckedChange={(v) => onChange("style_shadow_enabled", v)} />
        </div>
        {config.style_shadow_enabled && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-[10px]">Offset X</Label><Input type="number" value={config.style_shadow_x ?? 0} onChange={(e) => onChange("style_shadow_x", Number(e.target.value))} className="h-8 text-xs" /></div>
              <div><Label className="text-[10px]">Offset Y</Label><Input type="number" value={config.style_shadow_y ?? 4} onChange={(e) => onChange("style_shadow_y", Number(e.target.value))} className="h-8 text-xs" /></div>
              <div><Label className="text-[10px]">Blur</Label><Input type="number" value={config.style_shadow_blur ?? 10} onChange={(e) => onChange("style_shadow_blur", Number(e.target.value))} min={0} className="h-8 text-xs" /></div>
              <div><Label className="text-[10px]">Spread</Label><Input type="number" value={config.style_shadow_spread ?? 0} onChange={(e) => onChange("style_shadow_spread", Number(e.target.value))} className="h-8 text-xs" /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={config.style_shadow_color || "#00000033"} onChange={(e) => onChange("style_shadow_color", e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer shrink-0" />
              <div className="flex-1"><Label className="text-xs">Cor da sombra</Label><Input value={config.style_shadow_color || ""} onChange={(e) => onChange("style_shadow_color", e.target.value)} placeholder="rgba(0,0,0,0.2)" className="mt-0.5 h-8 text-xs" /></div>
            </div>
            <div>
              <Label className="text-xs">Opacidade da sombra</Label>
              <Input type="number" value={config.style_shadow_opacity ?? 0.2} onChange={(e) => onChange("style_shadow_opacity", Number(e.target.value))} min={0} max={1} step={0.05} className="mt-1 h-8 text-xs" />
            </div>
          </>
        )}
      </div>

      {/* Border */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Borda</h4>
        <div>
          <Label className="text-xs">Espessura (px)</Label>
          <Input type="number" value={config.style_border_width || ""} onChange={(e) => onChange("style_border_width", e.target.value ? Number(e.target.value) : null)} placeholder="0" className="mt-1 h-8 text-xs" min={0} max={20} />
        </div>
        <ColorField label="Cor da borda" value={config.style_border_color} onChange={(v) => onChange("style_border_color", v)} />
        <div>
          <Label className="text-xs">Raio da borda (px)</Label>
          <Input type="number" value={config.style_border_radius || ""} onChange={(e) => onChange("style_border_radius", e.target.value ? Number(e.target.value) : null)} placeholder="0" className="mt-1 h-8 text-xs" min={0} max={100} />
        </div>
      </div>

      {/* Padding - responsive */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Espaçamento interno
          <ResponsiveIndicator configKey="style_padding" config={config} deviceMode={deviceMode} />
        </h4>
        <div>
          <Label className="text-xs">Padding geral (px)</Label>
          <Input
            type="number"
            value={rVal("style_padding") ?? ""}
            onChange={(e) => onChange(rKey("style_padding"), e.target.value ? Number(e.target.value) : null)}
            placeholder={rPlaceholder("style_padding")}
            className="mt-1 h-8 text-xs"
            min={0}
            max={200}
          />
        </div>
      </div>

      {/* Hover State */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hover</h4>
          <Switch checked={!!config.style_hover_enabled} onCheckedChange={(v) => onChange("style_hover_enabled", v)} />
        </div>
        {config.style_hover_enabled && (
          <>
            <p className="text-[10px] text-muted-foreground">Estilos aplicados ao passar o mouse</p>
            <ColorField label="Cor de fundo" value={config.hover_bg_color} onChange={(v) => onChange("hover_bg_color", v)} />
            <ColorField label="Cor do texto" value={config.hover_text_color} onChange={(v) => onChange("hover_text_color", v)} />
            <ColorField label="Cor da borda" value={config.hover_border_color} onChange={(v) => onChange("hover_border_color", v)} />
            <div>
              <Label className="text-xs">Escala (ex: 1.05)</Label>
              <Input type="number" value={config.hover_scale ?? ""} onChange={(e) => onChange("hover_scale", e.target.value ? Number(e.target.value) : null)} placeholder="1" className="mt-1 h-8 text-xs" min={0.5} max={2} step={0.01} />
            </div>
            <div>
              <Label className="text-xs">Opacidade (0-1)</Label>
              <Input type="number" value={config.hover_opacity ?? ""} onChange={(e) => onChange("hover_opacity", e.target.value ? Number(e.target.value) : null)} placeholder="1" className="mt-1 h-8 text-xs" min={0} max={1} step={0.05} />
            </div>
            <div>
              <Label className="text-xs">Sombra hover</Label>
              <Input value={config.hover_shadow || ""} onChange={(e) => onChange("hover_shadow", e.target.value)} placeholder="0 10px 30px rgba(0,0,0,0.3)" className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Duração da transição (ms)</Label>
              <Input type="number" value={config.hover_transition_duration ?? 300} onChange={(e) => onChange("hover_transition_duration", Number(e.target.value))} min={0} max={2000} step={50} className="mt-1 h-8 text-xs" />
            </div>
          </>
        )}
      </div>

      <Separator />

      {/* Product-specific style fields */}
      {type === "products" && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cores do Card</h4>
          <p className="text-[10px] text-muted-foreground">Deixe vazio para usar o padrão do tema</p>
          <ColorField label="Fundo do card" value={config.style_card_bg} onChange={(v) => onChange("style_card_bg", v)} />
          <ColorField label="Cor do nome" value={config.style_name_color} onChange={(v) => onChange("style_name_color", v)} />
          <ColorField label="Cor do preço" value={config.style_price_color} onChange={(v) => onChange("style_price_color", v)} />
          <ColorField label="Cor do botão" value={config.style_button_color} onChange={(v) => onChange("style_button_color", v)} />
          <ColorField label="Texto do botão" value={config.style_button_text_color} onChange={(v) => onChange("style_button_text_color", v)} />
          <ColorField label="Texto frete grátis" value={config.style_free_shipping_color} onChange={(v) => onChange("style_free_shipping_color", v)} />
          <ColorField label="Fundo badge desconto" value={config.style_discount_bg_color} onChange={(v) => onChange("style_discount_bg_color", v)} />
          <ColorField label="Texto badge desconto" value={config.style_discount_text_color} onChange={(v) => onChange("style_discount_text_color", v)} />
        </div>
      )}

      {/* Container-specific */}
      {type === "container" && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Overlay</h4>
          <div>
            <Label className="text-xs">Opacidade do overlay (0-1)</Label>
            <Input type="number" value={config.style_bg_overlay_opacity ?? ""} onChange={(e) => onChange("style_bg_overlay_opacity", e.target.value ? Number(e.target.value) : null)} placeholder="0" className="mt-1 h-8 text-xs" min={0} max={1} step={0.1} />
          </div>
        </div>
      )}
    </div>
  );
}
