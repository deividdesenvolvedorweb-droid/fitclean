import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "./useAuditLog";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  description_blocks: Json | null;
  sku: string | null;
  barcode: string | null;
  price: number;
  compare_at_price: number | null;
  cost: number | null;
  stock: number;
  min_stock: number;
  allow_backorder: boolean;
  unlimited_stock: boolean;
  is_digital: boolean;
  weight: number | null;
  category_id: string | null;
  secondary_category_ids: string[] | null;
  images: string[] | null;
  main_image_index: number;
  tags: string[] | null;
  specifications: Json | null;
  featured: boolean;
  bestseller: boolean;
  free_shipping: boolean;
  active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  payment_config: Json | null;
  created_at: string;
  updated_at: string;
  categories?: { name: string } | null;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  active?: boolean;
  featured?: boolean;
  lowStock?: boolean;
  onSale?: boolean;
}

export interface ProductFormData {
  name: string;
  slug: string;
  description?: string;
  sku?: string;
  barcode?: string;
  price: number;
  compare_at_price?: number | null;
  cost?: number | null;
  stock?: number;
  min_stock?: number;
  allow_backorder?: boolean;
  weight?: number | null;
  category_id?: string | null;
  secondary_category_ids?: string[] | null;
  images?: string[] | null;
  main_image_index?: number;
  tags?: string[] | null;
  specifications?: Json | null;
  featured?: boolean;
  bestseller?: boolean;
  free_shipping?: boolean;
  active?: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
  og_image?: string | null;
  is_digital?: boolean;
  unlimited_stock?: boolean;
  description_blocks?: Json | null;
  payment_config?: Json | null;
}

interface UseProductsOptions {
  page?: number;
  pageSize?: number;
  filters?: ProductFilters;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { page = 1, pageSize = 20, filters = {} } = options;
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  const query = useQuery({
    queryKey: ["admin", "products", page, pageSize, filters],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories(name)", { count: "exact" });

      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
        );
      }
      if (filters.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }
      if (filters.active !== undefined) {
        query = query.eq("active", filters.active);
      }
      if (filters.featured) {
        query = query.eq("featured", true);
      }
      if (filters.lowStock) {
        // Can't do cross-column comparison in PostgREST, so fetch low stock threshold
        query = query.lte("stock", 5).eq("unlimited_stock", false);
      }
      if (filters.onSale) {
        query = query.not("compare_at_price", "is", null);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { products: data as Product[], totalCount: count || 0 };
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: ProductFormData) => {
      const { data, error } = await supabase
        .from("products")
        .insert(formData)
        .select()
        .single();

      if (error) throw error;
      return data as Product;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      logAction({
        action: "create",
        entity: "product",
        entityId: data.id,
        afterData: data as unknown as Json,
      });
      toast.success("Produto criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating product:", error);
      toast.error("Erro ao criar produto");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...formData
    }: ProductFormData & { id: string }) => {
      const { data: before } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("products")
        .update(formData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { before, after: data as Product };
    },
    onSuccess: ({ before, after }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      logAction({
        action: "update",
        entity: "product",
        entityId: after.id,
        beforeData: before as unknown as Json,
        afterData: after as unknown as Json,
      });
      toast.success("Produto atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating product:", error);
      toast.error("Erro ao atualizar produto");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: before } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) throw error;
      return { id, before };
    },
    onSuccess: ({ id, before }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      logAction({
        action: "delete",
        entity: "product",
        entityId: id,
        beforeData: before as unknown as Json,
      });
      toast.success("Produto excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting product:", error);
      toast.error("Erro ao excluir produto");
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const { data: before } = await supabase
        .from("products")
        .select("id, stock")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("products")
        .update({ stock })
        .eq("id", id)
        .select("id, stock")
        .single();

      if (error) throw error;
      return { before, after: data };
    },
    onSuccess: ({ before, after }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      logAction({
        action: "update_stock",
        entity: "product",
        entityId: after.id,
        beforeData: before as unknown as Json,
        afterData: after as unknown as Json,
      });
      toast.success("Estoque atualizado!");
    },
    onError: (error) => {
      console.error("Error updating stock:", error);
      toast.error("Erro ao atualizar estoque");
    },
  });

  return {
    products: query.data?.products || [],
    totalCount: query.data?.totalCount || 0,
    isLoading: query.isLoading,
    error: query.error,
    createProduct: createMutation.mutateAsync,
    updateProduct: updateMutation.mutateAsync,
    deleteProduct: deleteMutation.mutateAsync,
    updateStock: updateStockMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "product", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });
}
