import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type DeviceMode, getResponsiveKey, ResponsiveIndicator } from "./ResponsiveControl";

interface AdvancedFieldsProps {
  config: Record<string, any>;
  onChange: (key: string, value: any) => void;
  deviceMode: DeviceMode;
}

const ANIMATIONS = [
  { value: "none", label: "Nenhuma" },
  { value: "fade-in", label: "Fade In" },
  { value: "fade-up", label: "Fade Up" },
  { value: "fade-down", label: "Fade Down" },
  { value: "fade-left", label: "Fade Left" },
  { value: "fade-right", label: "Fade Right" },
  { value: "scale-in", label: "Scale In" },
  { value: "scale-up", label: "Scale Up" },
  { value: "slide-up", label: "Slide Up" },
  { value: "slide-down", label: "Slide Down" },
  { value: "slide-left", label: "Slide Left" },
  { value: "slide-right", label: "Slide Right" },
  { value: "rotate-in", label: "Rotate In" },
  { value: "flip-x", label: "Flip X" },
  { value: "flip-y", label: "Flip Y" },
  { value: "bounce-in", label: "Bounce In" },
  { value: "zoom-in", label: "Zoom In" },
  { value: "zoom-out", label: "Zoom Out" },
  { value: "blur-in", label: "Blur In" },
  { value: "swing", label: "Swing" },
  { value: "pulse", label: "Pulse" },
];

export function AdvancedFields({ config, onChange, deviceMode }: AdvancedFieldsProps) {
  const rKey = (base: string) => getResponsiveKey(base, deviceMode);
  const rVal = (base: string) => {
    if (deviceMode === "desktop") return config[base];
    return config[rKey(base)];
  };
  const rPlaceholder = (base: string) => {
    if (deviceMode === "desktop") return "";
    return config[base] != null ? String(config[base]) : "";
  };

  return (
    <div className="space-y-4">
      {/* Margin */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Margem Externa (px)
          <ResponsiveIndicator configKey="adv_margin_top" config={config} deviceMode={deviceMode} />
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[10px]">Topo</Label><Input type="number" value={rVal("adv_margin_top") ?? ""} onChange={(e) => onChange(rKey("adv_margin_top"), e.target.value ? Number(e.target.value) : null)} placeholder={rPlaceholder("adv_margin_top")} className="h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Base</Label><Input type="number" value={rVal("adv_margin_bottom") ?? ""} onChange={(e) => onChange(rKey("adv_margin_bottom"), e.target.value ? Number(e.target.value) : null)} placeholder={rPlaceholder("adv_margin_bottom")} className="h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Esquerda</Label><Input type="number" value={rVal("adv_margin_left") ?? ""} onChange={(e) => onChange(rKey("adv_margin_left"), e.target.value ? Number(e.target.value) : null)} placeholder={rPlaceholder("adv_margin_left")} className="h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Direita</Label><Input type="number" value={rVal("adv_margin_right") ?? ""} onChange={(e) => onChange(rKey("adv_margin_right"), e.target.value ? Number(e.target.value) : null)} placeholder={rPlaceholder("adv_margin_right")} className="h-8 text-xs" /></div>
        </div>
      </div>

      {/* Padding */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Padding Interno (px)
          <ResponsiveIndicator configKey="adv_padding_top" config={config} deviceMode={deviceMode} />
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[10px]">Topo</Label><Input type="number" value={rVal("adv_padding_top") ?? ""} onChange={(e) => onChange(rKey("adv_padding_top"), e.target.value ? Number(e.target.value) : null)} placeholder={rPlaceholder("adv_padding_top")} className="h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Base</Label><Input type="number" value={rVal("adv_padding_bottom") ?? ""} onChange={(e) => onChange(rKey("adv_padding_bottom"), e.target.value ? Number(e.target.value) : null)} placeholder={rPlaceholder("adv_padding_bottom")} className="h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Esquerda</Label><Input type="number" value={rVal("adv_padding_left") ?? ""} onChange={(e) => onChange(rKey("adv_padding_left"), e.target.value ? Number(e.target.value) : null)} placeholder={rPlaceholder("adv_padding_left")} className="h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Direita</Label><Input type="number" value={rVal("adv_padding_right") ?? ""} onChange={(e) => onChange(rKey("adv_padding_right"), e.target.value ? Number(e.target.value) : null)} placeholder={rPlaceholder("adv_padding_right")} className="h-8 text-xs" /></div>
        </div>
      </div>

      {/* Layout Controls */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Layout
          <ResponsiveIndicator configKey="adv_min_height" config={config} deviceMode={deviceMode} />
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Largura</Label>
            <Input value={config.adv_width || ""} onChange={(e) => onChange("adv_width", e.target.value || null)} placeholder="auto" className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Largura máx.</Label>
            <Input value={config.adv_max_width || ""} onChange={(e) => onChange("adv_max_width", e.target.value || null)} placeholder="none" className="h-8 text-xs" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Altura mínima (px)</Label>
          <Input type="number" value={rVal("adv_min_height") ?? ""} onChange={(e) => onChange(rKey("adv_min_height"), e.target.value ? Number(e.target.value) : null)} placeholder={rPlaceholder("adv_min_height") || "Auto"} className="mt-1 h-8 text-xs" min={0} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Overflow</Label>
            <Select value={config.adv_overflow || "visible"} onValueChange={(v) => onChange("adv_overflow", v === "visible" ? null : v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="visible">Visible</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="scroll">Scroll</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px]">Alinhamento</Label>
            <Select value={config.adv_text_align || "inherit"} onValueChange={(v) => onChange("adv_text_align", v === "inherit" ? null : v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="inherit">Herdar</SelectItem>
                <SelectItem value="left">Esquerda</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="right">Direita</SelectItem>
                <SelectItem value="justify">Justificado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-xs">Z-Index</Label>
          <Input type="number" value={config.adv_z_index ?? ""} onChange={(e) => onChange("adv_z_index", e.target.value ? Number(e.target.value) : null)} placeholder="Auto" className="mt-1 h-8 text-xs" />
        </div>
      </div>

      {/* Visibility */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Visibilidade</h4>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Ocultar no mobile</Label>
          <Switch checked={config.adv_hide_mobile || false} onCheckedChange={(v) => onChange("adv_hide_mobile", v)} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Ocultar no desktop</Label>
          <Switch checked={config.adv_hide_desktop || false} onCheckedChange={(v) => onChange("adv_hide_desktop", v)} />
        </div>
      </div>

      {/* Animation - Expanded */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Animação de Entrada</h4>
        <Select value={config.adv_animation || "none"} onValueChange={(v) => onChange("adv_animation", v === "none" ? null : v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ANIMATIONS.map((a) => (
              <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {config.adv_animation && config.adv_animation !== "none" && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Duração (ms)</Label>
              <Input type="number" value={config.adv_animation_duration ?? 600} onChange={(e) => onChange("adv_animation_duration", Number(e.target.value))} min={100} max={3000} step={50} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">Delay (ms)</Label>
              <Input type="number" value={config.adv_animation_delay ?? 0} onChange={(e) => onChange("adv_animation_delay", Number(e.target.value))} min={0} max={5000} step={50} className="h-8 text-xs" />
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">CSS Customizado</h4>
        <div>
          <Label className="text-xs">Classes CSS extras</Label>
          <Input value={config.adv_css_class || ""} onChange={(e) => onChange("adv_css_class", e.target.value)} placeholder="classe1 classe2" className="mt-1 h-8 text-xs" />
        </div>
        <div>
          <Label className="text-xs">CSS inline personalizado</Label>
          <Textarea
            value={config.adv_custom_css || ""}
            onChange={(e) => onChange("adv_custom_css", e.target.value)}
            placeholder={`/* Exemplo */\nbackground: linear-gradient(...);\nbox-shadow: 0 4px 6px rgba(0,0,0,0.1);`}
            rows={4}
            className="mt-1 text-xs font-mono"
          />
          <p className="text-[9px] text-muted-foreground mt-1">Propriedades CSS separadas por ponto e vírgula</p>
        </div>
      </div>
    </div>
  );
}
