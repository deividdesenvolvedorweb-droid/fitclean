import { useEffect, useState, useCallback } from "react";
import { Upload, Save, Palette } from "lucide-react";
import { useThemeSettings } from "@/hooks/admin/useThemeSettings";
import { useImageUpload } from "@/hooks/useImageUpload";
import { LoadingState } from "@/components/admin/shared/LoadingState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MARKETING_COLORS_DRAFT_KEY = "admin-marketing-colors-draft-v1";

const colorFields = [
  { key: "primary_color", label: "Primária (Botões, destaques)" },
  { key: "secondary_color", label: "Secundária (Fundos suaves)" },
  { key: "accent_color", label: "Destaque (Badges, CTAs)" },
  { key: "badge_sale_color", label: "Promoção (Badge de desconto)" },
  { key: "badge_free_shipping_color", label: "Sucesso (Frete grátis)" },
];

export function MarketingTab() {
  const { themeSettings, isLoading, updateTheme } = useThemeSettings();
  const { upload, isUploading } = useImageUpload({ bucket: "layout" });
  const [colors, setColors] = useState<Record<string, string>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(MARKETING_COLORS_DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { colors?: Record<string, string> };
      if (parsed.colors && typeof parsed.colors === "object") {
        setColors(parsed.colors);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (Object.keys(colors).length === 0) {
      sessionStorage.removeItem(MARKETING_COLORS_DRAFT_KEY);
      return;
    }
    try {
      sessionStorage.setItem(MARKETING_COLORS_DRAFT_KEY, JSON.stringify({ colors, updatedAt: Date.now() }));
    } catch {
      // ignore
    }
  }, [colors]);

  const currentColors = {
    primary_color: colors.primary_color ?? themeSettings?.primary_color ?? "#f97316",
    secondary_color: colors.secondary_color ?? themeSettings?.secondary_color ?? "#8b5cf6",
    accent_color: colors.accent_color ?? themeSettings?.accent_color ?? "#8b5cf6",
    badge_sale_color: colors.badge_sale_color ?? themeSettings?.badge_sale_color ?? "#8b5cf6",
    badge_free_shipping_color: colors.badge_free_shipping_color ?? themeSettings?.badge_free_shipping_color ?? "#22c55e",
  };

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await upload(file);
    if (result) {
      setLogoPreview(result.url);
      updateTheme.mutate({ store_logo: result.url });
    }
  }, [upload, updateTheme]);

  const handleSaveColors = () => {
    if (Object.keys(colors).length === 0) return;
    updateTheme.mutate(colors, {
      onSuccess: () => {
        setColors({});
        sessionStorage.removeItem(MARKETING_COLORS_DRAFT_KEY);
      },
    });
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Logo da Loja</CardTitle>
          <CardDescription>Faça upload do logo que aparecerá no header do site</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden bg-muted">
              {(logoPreview || themeSettings?.store_logo) ? (
                <img src={logoPreview || themeSettings?.store_logo || ""} alt="Logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <Button variant="outline" asChild disabled={isUploading}>
                  <span>{isUploading ? "Enviando..." : "Escolher Arquivo"}</span>
                </Button>
              </Label>
              <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <p className="text-xs text-muted-foreground mt-2">PNG, JPG ou WebP. Máximo 10MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paleta de Cores</CardTitle>
          <CardDescription>Altere as cores que afetam todo o site (botões, badges, fundos, etc.)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {colorFields.map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={currentColors[key as keyof typeof currentColors]}
                    onChange={(e) => setColors((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-12 h-10 rounded border border-input cursor-pointer"
                  />
                  <Input
                    value={currentColors[key as keyof typeof currentColors]}
                    onChange={(e) => setColors((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveColors} disabled={updateTheme.isPending || Object.keys(colors).length === 0}>
              <Save className="mr-2 h-4 w-4" />
              {updateTheme.isPending ? "Salvando..." : "Salvar Cores"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
