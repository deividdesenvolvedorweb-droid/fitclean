import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "./useAuditLog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { OrderStatus, PaymentStatus, PaymentMethod } from "@/types/admin";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  product_sku: string | null;
  variant_attributes: Record<string, unknown> | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface OrderStatusHistoryItem {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  cpf: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  user_id: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  payment_id: string | null;
  mp_payment_id: string | null;
  mp_payment_status: string | null;
  payment_data: Record<string, unknown> | null;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  total: number;
  coupon_code: string | null;
  shipping_address: Record<string, unknown> | null;
  billing_address: Record<string, unknown> | null;
  tracking_code: string | null;
  carrier: string | null;
  notes: string | null;
  internal_notes: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  canceled_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
  customers?: Customer | null;
  order_items?: OrderItem[];
  order_status_history?: OrderStatusHistoryItem[];
}

export interface OrderFilters {
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
}

interface UseOrdersOptions {
  page?: number;
  pageSize?: number;
  filters?: OrderFilters;
}

export function useOrders(options: UseOrdersOptions = {}) {
  const { page = 1, pageSize = 20, filters = {} } = options;
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["admin", "orders", page, pageSize, filters],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("*, customers(id, full_name, email, phone, cpf)", {
          count: "exact",
        });

      if (filters.search) {
        query = query.or(
          `order_number.ilike.%${filters.search}%,customers.full_name.ilike.%${filters.search}%,customers.email.ilike.%${filters.search}%`
        );
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.paymentStatus) {
        query = query.eq("payment_status", filters.paymentStatus);
      }
      if (filters.paymentMethod) {
        query = query.eq("payment_method", filters.paymentMethod);
      }
      if (filters.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { orders: data as Order[], totalCount: count || 0 };
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
      trackingCode,
      carrier,
    }: {
      id: string;
      status: OrderStatus;
      notes?: string;
      trackingCode?: string;
      carrier?: string;
    }) => {
      const { data: order } = await supabase
        .from("orders")
        .select("status")
        .eq("id", id)
        .single();

      const updateData: Record<string, unknown> = { status };
      if (status === "shipped" && trackingCode) {
        updateData.tracking_code = trackingCode;
        updateData.carrier = carrier;
        updateData.shipped_at = new Date().toISOString();
      }
      if (status === "delivered") {
        updateData.delivered_at = new Date().toISOString();
      }
      if (status === "canceled") {
        updateData.canceled_at = new Date().toISOString();
      }
      if (status === "refunded") {
        updateData.refunded_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;

      // Insert history
      const { error: historyError } = await supabase
        .from("order_status_history")
        .insert({
          order_id: id,
          from_status: order?.status,
          to_status: status,
          changed_by: user?.id,
          notes,
        });

      if (historyError) throw historyError;

      return { id, fromStatus: order?.status, toStatus: status };
    },
    onSuccess: ({ id, fromStatus, toStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "order", id] });
      logAction({
        action: "update_status",
        entity: "order",
        entityId: id,
        beforeData: { status: fromStatus },
        afterData: { status: toStatus },
      });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating order status:", error);
      toast.error("Erro ao atualizar status");
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({
      id,
      internalNotes,
    }: {
      id: string;
      internalNotes: string;
    }) => {
      const { error } = await supabase
        .from("orders")
        .update({ internal_notes: internalNotes })
        .eq("id", id);

      if (error) throw error;
      return { id };
    },
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "order", id] });
      toast.success("Notas atualizadas!");
    },
    onError: (error) => {
      console.error("Error updating notes:", error);
      toast.error("Erro ao atualizar notas");
    },
  });

  return {
    orders: query.data?.orders || [],
    totalCount: query.data?.totalCount || 0,
    isLoading: query.isLoading,
    error: query.error,
    updateStatus: updateStatusMutation.mutateAsync,
    updateNotes: updateNotesMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "order", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("orders")
        .select(
          "*, customers(*), order_items(*), order_status_history(*)"
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Order;
    },
    enabled: !!id,
  });
}
