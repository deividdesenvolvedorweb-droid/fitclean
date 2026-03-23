import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CustomerData {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  cpf: string | null;
  user_id: string | null;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  recipient_name: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  is_default: boolean;
  label: string | null;
}

export function useCustomerAuth() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const customerQuery = useQuery({
    queryKey: ["customer-data", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as CustomerData | null;
    },
    enabled: !!user,
  });

  const addressQuery = useQuery({
    queryKey: ["customer-address", customerQuery.data?.id],
    queryFn: async () => {
      if (!customerQuery.data) return null;
      const { data, error } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("customer_id", customerQuery.data.id)
        .eq("is_default", true)
        .maybeSingle();

      if (error) throw error;
      return data as CustomerAddress | null;
    },
    enabled: !!customerQuery.data?.id,
  });

  const updateCustomer = useMutation({
    mutationFn: async (data: Partial<CustomerData>) => {
      if (!user) throw new Error("Não autenticado");

      if (customerQuery.data) {
        const { error } = await supabase
          .from("customers")
          .update(data)
          .eq("id", customerQuery.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("customers").insert({
          email: user.email!,
          user_id: user.id,
          ...data,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-data"] });
    },
  });

  const updateAddress = useMutation({
    mutationFn: async (data: Omit<CustomerAddress, "id" | "customer_id" | "is_default" | "label">) => {
      if (!customerQuery.data) throw new Error("Cliente não encontrado");

      const addressData = {
        customer_id: customerQuery.data.id,
        is_default: true,
        ...data,
      };

      const { data: existing, error: existingError } = await supabase
        .from("customer_addresses")
        .select("id")
        .eq("customer_id", customerQuery.data.id)
        .eq("is_default", true)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        const { error } = await supabase
          .from("customer_addresses")
          .update(addressData)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("customer_addresses").insert(addressData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-address"] });
    },
  });

  return {
    customer: customerQuery.data,
    address: addressQuery.data,
    isLoading: customerQuery.isLoading,
    updateCustomer,
    updateAddress,
    isLoggedIn: !!user,
    user,
  };
}
