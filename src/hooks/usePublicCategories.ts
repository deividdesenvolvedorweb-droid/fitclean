import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Category = Tables<"categories">;

export function usePublicCategories() {
  return useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

export function useCategoriesWithChildren() {
  const { data: categories, isLoading, error } = usePublicCategories();

  const parentCategories = categories?.filter((c) => !c.parent_id) || [];
  
  const getChildren = (parentId: string) => 
    categories?.filter((c) => c.parent_id === parentId) || [];

  return {
    categories: categories || [],
    parentCategories,
    getChildren,
    isLoading,
    error,
  };
}
