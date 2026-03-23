import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type StoreSettings = Tables<"store_settings">;
export type StoreSettingsUpdate = TablesUpdate<"store_settings">;

export function useStoreSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["admin", "store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("is_current", true)
        .single();

      if (error) throw error;
      return data as StoreSettings;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: StoreSettingsUpdate) => {
      const { data: current } = await supabase
        .from("store_settings")
        .select("id")
        .eq("is_current", true)
        .single();

      if (!current) throw new Error("Settings not found");

      const { data, error } = await supabase
        .from("store_settings")
        .update(updates)
        .eq("id", current.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "store-settings"] });
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,
    updateSettings,
  };
}
