import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface HomeBlock {
  id: string;
  type: string;
  config: Record<string, any>;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useHomeBlocks() {
  const queryClient = useQueryClient();

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ["admin-home-blocks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_blocks")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as HomeBlock[];
    },
  });

  const createBlock = useMutation({
    mutationFn: async (block: { type: string; config: Record<string, any>; sort_order: number }) => {
      const { error } = await supabase.from("home_blocks").insert(block);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-home-blocks"] });
      queryClient.invalidateQueries({ queryKey: ["public-home-blocks"] });
      toast.success("Bloco adicionado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateBlock = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HomeBlock> & { id: string }) => {
      const { error } = await supabase
        .from("home_blocks")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-home-blocks"] });
      queryClient.invalidateQueries({ queryKey: ["public-home-blocks"] });
      toast.success("Bloco atualizado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("home_blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-home-blocks"] });
      queryClient.invalidateQueries({ queryKey: ["public-home-blocks"] });
      toast.success("Bloco removido!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reorderBlocks = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        supabase.from("home_blocks").update({ sort_order: index }).eq("id", id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-home-blocks"] });
      queryClient.invalidateQueries({ queryKey: ["public-home-blocks"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { blocks, isLoading, createBlock, updateBlock, deleteBlock, reorderBlocks };
}
