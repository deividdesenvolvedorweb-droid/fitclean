import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "./useAuditLog";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
import type { FilterType } from "@/types/admin";

export interface SearchFilter {
  id: string;
  name: string;
  slug: string;
  type: FilterType;
  source: string;
  source_key: string | null;
  category_ids: string[] | null;
  config: Json | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FilterFormData {
  name: string;
  slug: string;
  type: FilterType;
  source: string;
  source_key?: string | null;
  category_ids?: string[] | null;
  config?: Json | null;
  sort_order?: number;
  active?: boolean;
}

export function useFilters() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  const query = useQuery({
    queryKey: ["admin", "filters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_filters")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as SearchFilter[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FilterFormData) => {
      const { data, error } = await supabase
        .from("search_filters")
        .insert(formData)
        .select()
        .single();

      if (error) throw error;
      return data as SearchFilter;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "filters"] });
      logAction({
        action: "create",
        entity: "search_filter",
        entityId: data.id,
        afterData: data as unknown as Json,
      });
      toast.success("Filtro criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating filter:", error);
      toast.error("Erro ao criar filtro");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...formData
    }: FilterFormData & { id: string }) => {
      const { data: before } = await supabase
        .from("search_filters")
        .select("*")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("search_filters")
        .update(formData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { before, after: data as SearchFilter };
    },
    onSuccess: ({ before, after }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "filters"] });
      logAction({
        action: "update",
        entity: "search_filter",
        entityId: after.id,
        beforeData: before as unknown as Json,
        afterData: after as unknown as Json,
      });
      toast.success("Filtro atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating filter:", error);
      toast.error("Erro ao atualizar filtro");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: before } = await supabase
        .from("search_filters")
        .select("*")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("search_filters")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, before };
    },
    onSuccess: ({ id, before }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "filters"] });
      logAction({
        action: "delete",
        entity: "search_filter",
        entityId: id,
        beforeData: before as unknown as Json,
      });
      toast.success("Filtro excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting filter:", error);
      toast.error("Erro ao excluir filtro");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const updates = items.map((item) =>
        supabase
          .from("search_filters")
          .update({ sort_order: item.sort_order })
          .eq("id", item.id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "filters"] });
      toast.success("Ordem atualizada!");
    },
    onError: (error) => {
      console.error("Error reordering filters:", error);
      toast.error("Erro ao reordenar filtros");
    },
  });

  return {
    filters: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createFilter: createMutation.mutateAsync,
    updateFilter: updateMutation.mutateAsync,
    deleteFilter: deleteMutation.mutateAsync,
    reorderFilters: reorderMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
