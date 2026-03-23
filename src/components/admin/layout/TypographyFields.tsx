import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type DeviceMode,
  getResponsiveKey,
  ResponsiveIndicator,
} from "./ResponsiveControl";

const FONT_FAMILIES = [
  { value: "default", label: "Padrão do tema" },
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'Plus Jakarta Sans', sans-serif", label: "Plus Jakarta Sans" },
  { value: "'Roboto', sans-serif", label: "Roboto" },
  { value: "'Open Sans', sans-serif", label: "Open Sans" },
  { value: "'Montserrat', sans-serif", label: "Montserrat" },
  { value: "'Poppins', sans-serif", label: "Poppins" },
  { value: "'Lato', sans-serif", label: "Lato" },
  { value: "'Oswald', sans-serif", label: "Oswald" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "'Merriweather', serif", label: "Merriweather" },
  { value: "'Georgia', serif", label: "Georgia" },
  { value: "'Courier New', monospace", label: "Courier New" },
];

const FONT_WEIGHTS = [
  { value: "default", label: "Padrão" },
  { value: "100", label: "100 - Thin" },
  { value: "200", label: "200 - Extra Light" },
  { value: "300", label: "300 - Light" },
  { value: "400", label: "400 - Regular" },
  { value: "500", label: "500 - Medium" },
  { value: "600", label: "600 - Semi Bold" },
  { value: "700", label: "700 - Bold" },
  { value: "800", label: "800 - Extra Bold" },
  { value: "900", label: "900 - Black" },
];

interface TypographyFieldsProps {
  config: Record<string, any>;
  onChange: (key: string, value: any) => void;
  deviceMode: DeviceMode;
}

export function TypographyFields({
  config,
  onChange,
  deviceMode,
}: TypographyFieldsProps) {
  const rSet = (baseKey: string, value: any) => {
    const key = getResponsiveKey(baseKey, deviceMode);
    onChange(key, value || null);
  };

  const rGet = (baseKey: string) => {
    if (deviceMode === "desktop") return config[baseKey];
    const key = getResponsiveKey(baseKey, deviceMode);
    return config[key];
  };

  const rPlaceholder = (baseKey: string) => {
    if (deviceMode === "desktop") return "Padrão";
    return config[baseKey] != null ? String(config[baseKey]) : "Padrão";
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Tipografia
      </h4>

      <div>
        <Label className="text-xs">
          Família da fonte
          <ResponsiveIndicator
            configKey="style_font_family"
            config={config}
            deviceMode={deviceMode}
          />
        </Label>
        <Select
          value={rGet("style_font_family") || "default"}
          onValueChange={(v) => rSet("style_font_family", v === "default" ? null : v)}
        >
          <SelectTrigger className="mt-1 h-8 text-xs">
            <SelectValue placeholder="Padrão do tema" />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">
            Tamanho (px)
            <ResponsiveIndicator
              configKey="style_font_size"
              config={config}
              deviceMode={deviceMode}
            />
          </Label>
          <Input
            type="number"
            value={rGet("style_font_size") ?? ""}
            onChange={(e) =>
              rSet("style_font_size", e.target.value ? Number(e.target.value) : null)
            }
            placeholder={rPlaceholder("style_font_size")}
            className="mt-1 h-8 text-xs"
            min={8}
            max={120}
          />
        </div>
        <div>
          <Label className="text-xs">
            Peso
            <ResponsiveIndicator
              configKey="style_font_weight"
              config={config}
              deviceMode={deviceMode}
            />
          </Label>
          <Select
            value={rGet("style_font_weight") || "default"}
            onValueChange={(v) => rSet("style_font_weight", v === "default" ? null : v)}
          >
            <SelectTrigger className="mt-1 h-8 text-xs">
              <SelectValue placeholder="Padrão" />
            </SelectTrigger>
            <SelectContent>
              {FONT_WEIGHTS.map((w) => (
                <SelectItem key={w.value} value={w.value}>
                  {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">
            Altura de linha
            <ResponsiveIndicator
              configKey="style_line_height"
              config={config}
              deviceMode={deviceMode}
            />
          </Label>
          <Input
            type="number"
            value={rGet("style_line_height") ?? ""}
            onChange={(e) =>
              rSet("style_line_height", e.target.value ? Number(e.target.value) : null)
            }
            placeholder={rPlaceholder("style_line_height")}
            className="mt-1 h-8 text-xs"
            min={0}
            max={5}
            step={0.1}
          />
        </div>
        <div>
          <Label className="text-xs">
            Espaçamento (px)
            <ResponsiveIndicator
              configKey="style_letter_spacing"
              config={config}
              deviceMode={deviceMode}
            />
          </Label>
          <Input
            type="number"
            value={rGet("style_letter_spacing") ?? ""}
            onChange={(e) =>
              rSet(
                "style_letter_spacing",
                e.target.value ? Number(e.target.value) : null
              )
            }
            placeholder={rPlaceholder("style_letter_spacing")}
            className="mt-1 h-8 text-xs"
            min={-5}
            max={20}
            step={0.5}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Transformação</Label>
          <Select
            value={config.style_text_transform || "none"}
            onValueChange={(v) =>
              onChange("style_text_transform", v === "none" ? null : v)
            }
          >
            <SelectTrigger className="mt-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              <SelectItem value="uppercase">MAIÚSCULAS</SelectItem>
              <SelectItem value="lowercase">minúsculas</SelectItem>
              <SelectItem value="capitalize">Capitalizar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Decoração</Label>
          <Select
            value={config.style_text_decoration || "none"}
            onValueChange={(v) =>
              onChange("style_text_decoration", v === "none" ? null : v)
            }
          >
            <SelectTrigger className="mt-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              <SelectItem value="underline">Sublinhado</SelectItem>
              <SelectItem value="line-through">Riscado</SelectItem>
              <SelectItem value="overline">Sobrelinha</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
