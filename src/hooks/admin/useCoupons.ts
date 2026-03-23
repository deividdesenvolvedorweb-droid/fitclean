import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "./useAuditLog";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Coupon = Tables<"coupons">;
export type CouponInsert = TablesInsert<"coupons">;
export type CouponUpdate = TablesUpdate<"coupons">;
export type CouponType = "percentage" | "fixed" | "free_shipping";

interface CouponsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: CouponType | null;
  active?: boolean | null;
}

export function useCoupons(params: CouponsParams = {}) {
  const { page = 1, pageSize = 20, search = "", type = null, active = null } = params;
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  const couponsQuery = useQuery({
    queryKey: ["admin-coupons", page, pageSize, search, type, active],
    queryFn: async () => {
      let query = supabase.from("coupons").select("*", { count: "exact" });

      if (search) {
        query = query.ilike("code", `%${search}%`);
      }

      if (type) {
        query = query.eq("type", type);
      }

      if (active !== null) {
        query = query.eq("active", active);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data: data as Coupon[], count: count ?? 0 };
    },
  });

  const createCoupon = useMutation({
    mutationFn: async (coupon: CouponInsert) => {
      const { data, error } = await supabase
        .from("coupons")
        .insert(coupon)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      await logAction({
        action: "create",
        entity: "coupons",
        entityId: data.id,
        afterData: data,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Cupom criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar cupom: " + error.message);
    },
  });

  const updateCoupon = useMutation({
    mutationFn: async ({ id, ...updates }: CouponUpdate & { id: string }) => {
      const { data: oldData } = await supabase
        .from("coupons")
        .select("*")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("coupons")
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
        entity: "coupons",
        entityId: data.id,
        beforeData: oldData,
        afterData: data,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Cupom atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar cupom: " + error.message);
    },
  });

  const deleteCoupon = useMutation({
    mutationFn: async (id: string) => {
      const { data: oldData } = await supabase
        .from("coupons")
        .select("*")
        .eq("id", id)
        .single();

      const { error } = await supabase.from("coupons").delete().eq("id", id);

      if (error) throw error;
      return { id, oldData };
    },
    onSuccess: async ({ id, oldData }) => {
      await logAction({
        action: "delete",
        entity: "coupons",
        entityId: id,
        beforeData: oldData,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Cupom excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir cupom: " + error.message);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("coupons")
        .update({ active })
        .eq("id", id);

      if (error) throw error;
      return { id, active };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (error) => {
      toast.error("Erro ao alterar status: " + error.message);
    },
  });

  return {
    coupons: couponsQuery.data?.data ?? [],
    totalCount: couponsQuery.data?.count ?? 0,
    isLoading: couponsQuery.isLoading,
    error: couponsQuery.error,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleActive,
  };
}
