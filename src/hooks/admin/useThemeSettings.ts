import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ThemeSettingsData {
  id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  badge_sale_color: string;
  badge_free_shipping_color: string;
  store_logo: string | null;
  store_name: string;
  is_current: boolean;
}

export function useThemeSettings() {
  const queryClient = useQueryClient();

  const { data: themeSettings, isLoading } = useQuery({
    queryKey: ["admin-theme-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("theme_settings")
        .select("*")
        .eq("is_current", true)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const updateTheme = useMutation({
    mutationFn: async (updates: Partial<ThemeSettingsData>) => {
      const { data: current, error: fetchErr } = await supabase
        .from("theme_settings")
        .select("id")
        .eq("is_current", true)
        .single();
      if (fetchErr || !current) throw new Error("No theme settings found");
      const { error } = await supabase
        .from("theme_settings")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", current.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-theme-settings"] });
      queryClient.invalidateQueries({ queryKey: ["public-theme-settings"] });
      toast.success("Tema atualizado com sucesso!");
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar tema: " + err.message);
    },
  });

  return { themeSettings, isLoading, updateTheme };
}
