import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "./useAuditLog";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  parent_id: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryFormData {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  icon?: string;
  parent_id?: string | null;
  sort_order?: number;
  active?: boolean;
}

export function useCategories() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  const query = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: CategoryFormData) => {
      const { data, error } = await supabase
        .from("categories")
        .insert(formData)
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      logAction({
        action: "create",
        entity: "category",
        entityId: data.id,
        afterData: data as unknown as Json,
      });
      toast.success("Categoria criada com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating category:", error);
      toast.error("Erro ao criar categoria");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...formData
    }: CategoryFormData & { id: string }) => {
      const { data: before } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("categories")
        .update(formData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { before, after: data as Category };
    },
    onSuccess: ({ before, after }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      logAction({
        action: "update",
        entity: "category",
        entityId: after.id,
        beforeData: before as unknown as Json,
        afterData: after as unknown as Json,
      });
      toast.success("Categoria atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating category:", error);
      toast.error("Erro ao atualizar categoria");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: before } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();

      const { error } = await supabase.from("categories").delete().eq("id", id);

      if (error) throw error;
      return { id, before };
    },
    onSuccess: ({ id, before }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      logAction({
        action: "delete",
        entity: "category",
        entityId: id,
        beforeData: before as unknown as Json,
      });
      toast.success("Categoria excluída com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting category:", error);
      toast.error("Erro ao excluir categoria");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (
      items: { id: string; sort_order: number; parent_id: string | null }[]
    ) => {
      const updates = items.map((item) =>
        supabase
          .from("categories")
          .update({ sort_order: item.sort_order, parent_id: item.parent_id })
          .eq("id", item.id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast.success("Ordem atualizada!");
    },
    onError: (error) => {
      console.error("Error reordering categories:", error);
      toast.error("Erro ao reordenar categorias");
    },
  });

  return {
    categories: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    reorderCategories: reorderMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
