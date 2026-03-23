import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type StoreSettings = Tables<"store_settings">;

export function usePublicStoreSettings() {
  return useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("is_current", true)
        .single();

      if (error) throw error;
      return data as StoreSettings;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });
}
