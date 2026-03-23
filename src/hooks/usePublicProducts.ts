import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products">;

export type ProductWithCategory = Product & {
  categories: { name: string; slug: string } | null;
};

export function useProductBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["public-product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("slug", slug!)
        .eq("active", true)
        .single();

      if (error) throw error;
      return data as ProductWithCategory;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}

export function useRelatedProducts(categoryId: string | null | undefined, excludeId: string | undefined, limit = 4) {
  return useQuery({
    queryKey: ["public-products", "related", categoryId, excludeId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .eq("category_id", categoryId!)
        .neq("id", excludeId!)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!categoryId && !!excludeId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFeaturedProducts(limit = 8) {
  return useQuery({
    queryKey: ["public-products", "featured", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Product[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useBestsellerProducts(limit = 8) {
  return useQuery({
    queryKey: ["public-products", "bestseller", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .eq("bestseller", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Product[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useDiscountedProducts(limit = 8) {
  return useQuery({
    queryKey: ["public-products", "discounted", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .not("compare_at_price", "is", null)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as Product[]).filter(
        (p) => p.compare_at_price && Number(p.compare_at_price) > Number(p.price)
      );
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useProductsByCategory(categorySlug: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ["public-products", "category-slug", categorySlug, limit],
    queryFn: async () => {
      // First get category by slug
      const { data: category, error: catError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug!)
        .eq("active", true)
        .single();

      if (catError) throw catError;

      // Then get all child category IDs (subcategories)
      const { data: childCategories } = await supabase
        .from("categories")
        .select("id")
        .eq("parent_id", category.id)
        .eq("active", true);

      const categoryIds = [category.id, ...(childCategories?.map(c => c.id) || [])];

      // Get products by primary category
      const { data: primaryProducts, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .in("category_id", categoryIds)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Also get products that have this category as secondary
      const { data: secondaryProducts } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .contains("secondary_category_ids", [category.id])
        .order("created_at", { ascending: false })
        .limit(limit);

      // Merge and deduplicate
      const allProducts = [...(primaryProducts || [])];
      const existingIds = new Set(allProducts.map(p => p.id));
      for (const p of (secondaryProducts || [])) {
        if (!existingIds.has(p.id)) allProducts.push(p);
      }

      return allProducts as Product[];
    },
    enabled: !!categorySlug,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFilteredProducts(config: Record<string, any>) {
  const source = config.source || "featured";
  const limit = config.max || 8;
  const categoryId = config.category_id || null;
  const orderBy = config.order_by || "recent";
  const priceMin = config.price_min || null;
  const priceMax = config.price_max || null;

  return useQuery({
    queryKey: ["public-products", "filtered", source, limit, categoryId, orderBy, priceMin, priceMax],
    queryFn: async () => {
      let query = supabase.from("products").select("*").eq("active", true);

      // Source filter
      if (source === "featured") query = query.eq("featured", true);
      else if (source === "bestsellers") query = query.eq("bestseller", true);
      else if (source === "discounted") query = query.not("compare_at_price", "is", null);

      // Category filter
      if (categoryId) query = query.eq("category_id", categoryId);

      // Price filters
      if (priceMin != null) query = query.gte("price", priceMin);
      if (priceMax != null) query = query.lte("price", priceMax);

      // Ordering
      switch (orderBy) {
        case "price_asc": query = query.order("price", { ascending: true }); break;
        case "price_desc": query = query.order("price", { ascending: false }); break;
        case "name_asc": query = query.order("name", { ascending: true }); break;
        case "name_desc": query = query.order("name", { ascending: false }); break;
        default: query = query.order("created_at", { ascending: false }); break;
      }

      query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;

      let products = data as Product[];
      // Post-filter discounted
      if (source === "discounted") {
        products = products.filter(p => p.compare_at_price && Number(p.compare_at_price) > Number(p.price));
      }
      return products;
    },
    staleTime: 1000 * 60 * 5,
  });
}
