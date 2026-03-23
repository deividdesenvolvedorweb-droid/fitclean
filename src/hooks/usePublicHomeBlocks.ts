import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePublicHomeBlocks() {
  return useQuery({
    queryKey: ["public-home-blocks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_blocks")
        .select("id, type, config, sort_order")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Array<{
        id: string;
        type: string;
        config: Record<string, any>;
        sort_order: number;
      }>;
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });
}
