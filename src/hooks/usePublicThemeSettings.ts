import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

function hexToHsl(hex: string): string {
  hex = hex.replace("#", "");
  if (hex.length !== 6) return "0 0% 50%";
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function getForegroundForHsl(hsl: string): string {
  const parts = hsl.split(" ");
  const l = parseInt(parts[2]);
  return l > 55 ? "220 20% 10%" : "0 0% 100%";
}

export function usePublicThemeSettings() {
  const query = useQuery({
    queryKey: ["public-theme-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("theme_settings")
        .select("primary_color, secondary_color, accent_color, badge_free_shipping_color, badge_sale_color, badge_oos_color, banner_cta_color")
        .eq("is_current", true)
        .maybeSingle();
      if (error) {
        console.error("Theme settings fetch error:", error);
        return null;
      }
      return data;
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  useEffect(() => {
    if (!query.data) return;
    const t = query.data;
    const root = document.documentElement;

    const primaryHsl = hexToHsl(t.primary_color);
    const secondaryHsl = hexToHsl(t.secondary_color);
    const accentHsl = hexToHsl(t.accent_color);
    const successHsl = hexToHsl(t.badge_free_shipping_color);
    const badgeSaleHsl = hexToHsl(t.badge_sale_color);
    const badgeOosHsl = hexToHsl(t.badge_oos_color);

    const vars: Record<string, string> = {
      "--primary": primaryHsl,
      "--primary-foreground": getForegroundForHsl(primaryHsl),
      "--ring": primaryHsl,
      "--sidebar-primary": primaryHsl,
      "--sidebar-primary-foreground": getForegroundForHsl(primaryHsl),
      "--sidebar-ring": primaryHsl,
      "--secondary": secondaryHsl,
      "--secondary-foreground": getForegroundForHsl(secondaryHsl),
      "--sidebar-accent": secondaryHsl,
      "--accent": accentHsl,
      "--accent-foreground": getForegroundForHsl(accentHsl),
      "--badge-discount": accentHsl,
      "--success": successHsl,
      "--success-foreground": getForegroundForHsl(successHsl),
      "--badge-free-shipping": successHsl,
      "--badge-sold-out": badgeOosHsl,
      "--price-sale": badgeSaleHsl,
    };

    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [query.data]);

  return query;
}
