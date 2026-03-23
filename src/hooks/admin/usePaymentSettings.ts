import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "./useAuditLog";
import { toast } from "sonner";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type PaymentSettings = Tables<"payment_settings">;
export type PaymentSettingsUpdate = TablesUpdate<"payment_settings">;

export function usePaymentSettings() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  const settingsQuery = useQuery({
    queryKey: ["admin-payment-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as PaymentSettings | null;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: PaymentSettingsUpdate) => {
      const currentSettings = settingsQuery.data;

      if (currentSettings) {
        const { data, error } = await supabase
          .from("payment_settings")
          .update(updates)
          .eq("id", currentSettings.id)
          .select()
          .single();

        if (error) throw error;
        return { data, oldData: currentSettings };
      } else {
        const { data, error } = await supabase
          .from("payment_settings")
          .insert(updates as any)
          .select()
          .single();

        if (error) throw error;
        return { data, oldData: null };
      }
    },
    onSuccess: async ({ data, oldData }) => {
      await logAction({
        action: oldData ? "update" : "create",
        entity: "payment_settings",
        entityId: data.id,
        beforeData: oldData,
        afterData: data,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-payment-settings"] });
      toast.success("Configurações de pagamento atualizadas!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    },
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,
    updateSettings,
  };
}
