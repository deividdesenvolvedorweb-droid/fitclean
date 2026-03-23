import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePublicPaymentSettings() {
  return useQuery({
    queryKey: ["public-payment-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("installment_type, installment_interest_rate, max_installments, min_installment_value")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as {
        installment_type: string;
        installment_interest_rate: number;
        max_installments: number;
        min_installment_value: number;
      } | null;
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function calculateInstallmentValue(
  total: number,
  n: number,
  installmentType: string,
  interestRate: number
): number {
  if (installmentType === "com_juros" && n > 1) {
    const r = interestRate / 100;
    return total * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }
  return total / n;
}
