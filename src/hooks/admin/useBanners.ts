import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "./useAuditLog";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Banner = Tables<"banners">;
export type BannerInsert = TablesInsert<"banners">;
export type BannerUpdate = TablesUpdate<"banners">;

export function useBanners() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  const bannersQuery = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Banner[];
    },
  });

  const createBanner = useMutation({
    mutationFn: async (banner: BannerInsert) => {
      const { data, error } = await supabase
        .from("banners")
        .insert(banner)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      await logAction({
        action: "create",
        entity: "banners",
        entityId: data.id,
        afterData: data,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar banner: " + error.message);
    },
  });

  const updateBanner = useMutation({
    mutationFn: async ({ id, ...updates }: BannerUpdate & { id: string }) => {
      const { data: oldData } = await supabase
        .from("banners")
        .select("*")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("banners")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, oldData };
    },
    onSuccess: async ({ data, oldData }) => {
      await logAction({
        action: "update",
        entity: "banners",
        entityId: data.id,
        beforeData: oldData,
        afterData: data,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar banner: " + error.message);
    },
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => {
      const { data: oldData } = await supabase
        .from("banners")
        .select("*")
        .eq("id", id)
        .single();

      const { error } = await supabase.from("banners").delete().eq("id", id);

      if (error) throw error;
      return { id, oldData };
    },
    onSuccess: async ({ id, oldData }) => {
      await logAction({
        action: "delete",
        entity: "banners",
        entityId: id,
        beforeData: oldData,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluír banner: " + error.message);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("banners")
        .update({ active })
        .eq("id", id);

      if (error) throw error;
      return { id, active };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    },
    onError: (error) => {
      toast.error("Erro ao alterar status: " + error.message);
    },
  });

  return {
    banners: bannersQuery.data ?? [],
    isLoading: bannersQuery.isLoading,
    error: bannersQuery.error,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleActive,
  };
}
