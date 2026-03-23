import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Banner = Tables<"banners">;

export function usePublicBanners(type: "home_slider" | "category" | "promo_bar" | "topbar" = "home_slider") {
  return useQuery({
    queryKey: ["public-banners", type],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("active", true)
        .eq("type", type)
        .or(`start_at.is.null,start_at.lte.${now}`)
        .or(`end_at.is.null,end_at.gte.${now}`)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Banner[];
    },
    staleTime: 1000 * 60 * 5,
  });
}
