import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type PublicFilter = Tables<"search_filters">;

export function usePublicFilters(categoryId?: string | null) {
  return useQuery({
    queryKey: ["public-filters", categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_filters")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      // Filter by category if provided
      let filters = data as PublicFilter[];
      if (categoryId) {
        filters = filters.filter(f => {
          if (!f.category_ids || f.category_ids.length === 0) return true; // global filter
          return f.category_ids.includes(categoryId);
        });
      }

      return filters;
    },
    staleTime: 1000 * 60 * 10,
  });
}

// Extract unique filter values from products based on filter source
export function extractFilterOptions(
  products: Tables<"products">[],
  filter: PublicFilter
): string[] {
  const values = new Set<string>();

  for (const product of products) {
    if (filter.source === "tag" && product.tags) {
      const key = filter.source_key?.toLowerCase();
      for (const tag of product.tags) {
        if (key) {
          // Match tags that start with "key:" pattern
          if (tag.toLowerCase().startsWith(`${key}:`)) {
            values.add(tag.substring(key.length + 1).trim());
          } else if (tag.toLowerCase() === key) {
            values.add(tag);
          }
        } else {
          values.add(tag);
        }
      }
    } else if (filter.source === "specification" && product.specifications) {
      const specs = product.specifications as Record<string, any>;
      const key = filter.source_key;
      if (key && specs[key] !== undefined && specs[key] !== null) {
        values.add(String(specs[key]));
      }
    } else if (filter.source === "field") {
      const key = filter.source_key as keyof typeof product;
      if (key && product[key] !== undefined && product[key] !== null) {
        if (typeof product[key] === "boolean") {
          values.add(product[key] ? "Sim" : "Não");
        } else {
          values.add(String(product[key]));
        }
      }
    }
  }

  return Array.from(values).sort();
}

// Apply active filters to products
export function applyFilters(
  products: Tables<"products">[],
  filters: PublicFilter[],
  activeFilters: Record<string, string[]>,
  priceRange?: [number, number]
): Tables<"products">[] {
  let result = [...products];

  // Price range filter
  if (priceRange) {
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
  }

  // Apply each active filter
  for (const filter of filters) {
    const selected = activeFilters[filter.id];
    if (!selected || selected.length === 0) continue;

    result = result.filter(product => {
      if (filter.source === "tag" && product.tags) {
        const key = filter.source_key?.toLowerCase();
        return selected.some(sel => {
          if (key) {
            return product.tags!.some(
              tag => tag.toLowerCase() === `${key}:${sel.toLowerCase()}` || 
                     tag.toLowerCase() === sel.toLowerCase()
            );
          }
          return product.tags!.some(tag => tag.toLowerCase() === sel.toLowerCase());
        });
      }

      if (filter.source === "specification" && product.specifications) {
        const specs = product.specifications as Record<string, any>;
        const key = filter.source_key;
        if (key && specs[key] !== undefined) {
          return selected.includes(String(specs[key]));
        }
        return false;
      }

      if (filter.source === "field") {
        const key = filter.source_key as keyof typeof product;
        if (key && product[key] !== undefined) {
          const val = typeof product[key] === "boolean"
            ? (product[key] ? "Sim" : "Não")
            : String(product[key]);
          return selected.includes(val);
        }
        return false;
      }

      return true;
    });
  }

  return result;
}
