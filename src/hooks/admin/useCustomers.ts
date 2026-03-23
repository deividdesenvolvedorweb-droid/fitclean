import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "./useAuditLog";
import { toast } from "sonner";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type Customer = Tables<"customers">;
export type CustomerUpdate = TablesUpdate<"customers">;
export type CustomerAddress = Tables<"customer_addresses">;

interface CustomersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  blocked?: boolean | null;
}

export function useCustomers(params: CustomersParams = {}) {
  const { page = 1, pageSize = 20, search = "", blocked = null } = params;
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  const customersQuery = useQuery({
    queryKey: ["admin-customers", page, pageSize, search, blocked],
    queryFn: async () => {
      let query = supabase
        .from("customers")
        .select("*", { count: "exact" });

      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,cpf.ilike.%${search}%`
        );
      }

      if (blocked !== null) {
        query = query.eq("blocked", blocked);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data: data as Customer[], count: count ?? 0 };
    },
  });

  const customerDetailQuery = (id: string) =>
    useQuery({
      queryKey: ["admin-customer", id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        return data as Customer;
      },
      enabled: !!id,
    });

  const customerAddressesQuery = (customerId: string) =>
    useQuery({
      queryKey: ["admin-customer-addresses", customerId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("customer_addresses")
          .select("*")
          .eq("customer_id", customerId)
          .order("is_default", { ascending: false });

        if (error) throw error;
        return data as CustomerAddress[];
      },
      enabled: !!customerId,
    });

  const customerOrdersQuery = (customerId: string) =>
    useQuery({
      queryKey: ["admin-customer-orders", customerId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
      },
      enabled: !!customerId,
    });

  const updateCustomer = useMutation({
    mutationFn: async ({ id, ...updates }: CustomerUpdate & { id: string }) => {
      const { data: oldData } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("customers")
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
        entity: "customers",
        entityId: data.id,
        beforeData: oldData,
        afterData: data,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-customer", data.id] });
      toast.success("Cliente atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar cliente: " + error.message);
    },
  });

  const blockCustomer = useMutation({
    mutationFn: async ({
      id,
      blocked,
      blocked_reason,
    }: {
      id: string;
      blocked: boolean;
      blocked_reason?: string;
    }) => {
      const { data: oldData } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("customers")
        .update({ blocked, blocked_reason: blocked ? blocked_reason : null })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, oldData };
    },
    onSuccess: async ({ data, oldData }) => {
      await logAction({
        action: data.blocked ? "block" : "unblock",
        entity: "customers",
        entityId: data.id,
        beforeData: oldData,
        afterData: data,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-customer", data.id] });
      toast.success(data.blocked ? "Cliente bloqueado!" : "Cliente desbloqueado!");
    },
    onError: (error) => {
      toast.error("Erro ao alterar status: " + error.message);
    },
  });

  return {
    customers: customersQuery.data?.data ?? [],
    totalCount: customersQuery.data?.count ?? 0,
    isLoading: customersQuery.isLoading,
    error: customersQuery.error,
    customerDetailQuery,
    customerAddressesQuery,
    customerOrdersQuery,
    updateCustomer,
    blockCustomer,
  };
}
