import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, MapPin, CreditCard, ArrowLeft, ShieldCheck, Copy, CheckCircle2, AlertTriangle, FileText, Lock, Tag, Zap, Percent } from "lucide-react";
import { validateCPF } from "@/lib/cpf";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";

const checkoutSchema = z.object({
  fullName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido").max(15),
  cpf: z.string().min(11, "CPF inválido").max(14).refine((val) => validateCPF(val), "CPF inválido"),
  zipCode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  paymentMethod: z.enum(["pix", "credit_card", "boleto"]),
  couponCode: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface PaymentSettings {
  pix_enabled: boolean; credit_card_enabled: boolean; boleto_enabled: boolean;
  mp_public_key?: string; environment?: string;
  max_installments?: number; min_installment_value?: number;
}

interface StoreSettings {
  pix_discount_percent?: number;
  max_installments?: number;
}

interface PaymentResult {
  id: number; status: string; is_sandbox?: boolean;
  payment_method?: string;
  pix?: { qr_code: string; qr_code_base64: string; };
  boleto?: { url: string | null; barcode?: string | null; digitable_line?: string | null; pdf_base64?: string | null; };
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCEP(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { customer, address, isLoading: customerLoading } = useCustomerAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [paymentApproved, setPaymentApproved] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Coupon state
  const [couponApplied, setCouponApplied] = useState<{ code: string; type: string; value: number; maxDiscount?: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Credit card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [cardInstallments, setCardInstallments] = useState(1);
  const [mpSdkLoaded, setMpSdkLoaded] = useState(false);

  // Compute per-product payment restrictions
  const cartPaymentConfig = items.reduce((acc, item) => {
    const pc = item.product.payment_config as Record<string, any> | null;
    if (!pc) return acc;
    return {
      pix_enabled: acc.pix_enabled && (pc.pix_enabled !== false),
      boleto_enabled: acc.boleto_enabled && (pc.boleto_enabled !== false),
      credit_card_enabled: acc.credit_card_enabled && (pc.credit_card_enabled !== false),
      max_installments: Math.min(acc.max_installments, pc.max_installments || 12),
    };
  }, { pix_enabled: true, boleto_enabled: true, credit_card_enabled: true, max_installments: 12 });

  // Polling for payment status
  const startPaymentPolling = useCallback((orderId: string, orderNumber: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setCurrentOrderId(orderId);
    setCurrentOrderNumber(orderNumber);

    pollingRef.current = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("check-payment-status", {
          body: { order_id: orderId },
        });
        if (error) return;
        if (data?.payment_status === "approved" || data?.status === "paid") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setPaymentApproved(true);
          clearCart();
          toast.success(`Pagamento confirmado! Pedido ${orderNumber}`);
        } else if (data?.payment_status === "rejected") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          toast.error("Pagamento rejeitado. Tente novamente.");
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 5000);

    setTimeout(() => {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    }, 30 * 60 * 1000);
  }, [clearCart]);

  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const allDigital = items.every(item => item.product.is_digital === true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/conta/login?redirect=/checkout", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "", email: "", phone: "", cpf: "",
      zipCode: "", street: "", number: "", complement: "",
      neighborhood: "", city: "", state: "",
      paymentMethod: "pix", couponCode: "",
    },
  });

  useEffect(() => {
    if (customer) {
      form.setValue("fullName", customer.full_name || "");
      form.setValue("email", customer.email || "");
      form.setValue("phone", customer.phone || "");
      form.setValue("cpf", customer.cpf || "");
    } else if (user) {
      form.setValue("email", user.email || "");
      form.setValue("fullName", user.user_metadata?.full_name || "");
    }
  }, [customer, user, form]);

  useEffect(() => {
    if (address) {
      form.setValue("zipCode", address.zip_code || "");
      form.setValue("street", address.street || "");
      form.setValue("number", address.number || "");
      form.setValue("complement", address.complement || "");
      form.setValue("neighborhood", address.neighborhood || "");
      form.setValue("city", address.city || "");
      form.setValue("state", address.state || "");
    }
  }, [address, form]);

  const paymentMethod = form.watch("paymentMethod");
  useEffect(() => {
    if (paymentMethod === "credit_card" && paymentSettings?.mp_public_key && !mpSdkLoaded) {
      if (window.MercadoPago) { setMpSdkLoaded(true); return; }
      const script = document.createElement("script");
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;
      script.onload = () => setMpSdkLoaded(true);
      document.body.appendChild(script);
    }
  }, [paymentMethod, paymentSettings?.mp_public_key, mpSdkLoaded]);

  useEffect(() => {
    const fetchData = async () => {
      const [payRes, storeRes] = await Promise.all([
        supabase.from("payment_settings").select("id, pix_enabled, credit_card_enabled, boleto_enabled, mp_public_key, max_installments, min_installment_value, environment").limit(1).maybeSingle(),
        supabase.from("store_settings").select("pix_discount_percent, max_installments").eq("is_current", true).maybeSingle(),
      ]);
      if (payRes.data) setPaymentSettings(payRes.data as any);
      if (storeRes.data) setStoreSettings(storeRes.data as any);
    };
    fetchData();
  }, []);

  const fetchAddressFromCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    setIsFetchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (data.erro) { toast.error("CEP não encontrado"); return; }
      form.setValue("street", data.logradouro || "");
      form.setValue("neighborhood", data.bairro || "");
      form.setValue("city", data.localidade || "");
      form.setValue("state", data.uf || "");
    } catch { toast.error("Erro ao buscar CEP"); }
    finally { setIsFetchingCep(false); }
  };

  // Effective payment options
  const effectivePixEnabled = (paymentSettings?.pix_enabled !== false) && cartPaymentConfig.pix_enabled;
  const effectiveBoletoEnabled = (paymentSettings?.boleto_enabled !== false) && cartPaymentConfig.boleto_enabled;
  const effectiveCreditEnabled = (paymentSettings?.credit_card_enabled !== false) && cartPaymentConfig.credit_card_enabled && !!paymentSettings?.mp_public_key;
  const effectiveMaxInstallments = Math.min(paymentSettings?.max_installments || 12, cartPaymentConfig.max_installments);

  // Price calculations
  const pixDiscountPercent = Number(storeSettings?.pix_discount_percent) || 0;
  const isPixSelected = paymentMethod === "pix";

  // Coupon discount
  let couponDiscount = 0;
  if (couponApplied) {
    if (couponApplied.type === "percentage") {
      couponDiscount = subtotal * (couponApplied.value / 100);
      if (couponApplied.maxDiscount && couponDiscount > couponApplied.maxDiscount) {
        couponDiscount = couponApplied.maxDiscount;
      }
    } else if (couponApplied.type === "fixed") {
      couponDiscount = Math.min(couponApplied.value, subtotal);
    }
  }

  const subtotalAfterCoupon = subtotal - couponDiscount;
  const pixDiscount = isPixSelected && pixDiscountPercent > 0 ? subtotalAfterCoupon * (pixDiscountPercent / 100) : 0;
  const total = Math.max(subtotalAfterCoupon - pixDiscount, 0);

  // Boleto requires minimum R$5.00 on Mercado Pago
  const boletoMinAmount = 5;
  const effectiveBoletoFinal = effectiveBoletoEnabled && total >= boletoMinAmount;

  const isSandbox = paymentSettings?.environment === "sandbox";

  // Coupon apply
  const applyCoupon = async () => {
    const code = form.getValues("couponCode")?.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const now = new Date().toISOString();
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code)
        .eq("active", true)
        .maybeSingle();

      if (error || !coupon) { setCouponError("Cupom não encontrado"); return; }
      if (coupon.start_at && coupon.start_at > now) { setCouponError("Cupom ainda não está ativo"); return; }
      if (coupon.end_at && coupon.end_at < now) { setCouponError("Cupom expirado"); return; }
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) { setCouponError("Cupom esgotado"); return; }
      if (coupon.min_cart_value && subtotal < Number(coupon.min_cart_value)) { setCouponError(`Valor mínimo: ${formatCurrency(Number(coupon.min_cart_value))}`); return; }

      if (coupon.type === "free_shipping") {
        setCouponError("Este cupom é de frete grátis (frete já não é cobrado)");
        return;
      }

      setCouponApplied({
        code: coupon.code,
        type: coupon.type,
        value: Number(coupon.value),
        maxDiscount: coupon.max_discount ? Number(coupon.max_discount) : undefined,
      });
      toast.success(`Cupom ${coupon.code} aplicado!`);
    } catch {
      setCouponError("Erro ao validar cupom");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    form.setValue("couponCode", "");
    setCouponError("");
  };

  const processPayment = async (orderId: string, data: CheckoutFormData) => {
    const nameParts = data.fullName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;

    const paymentBody: Record<string, unknown> = {
      order_id: orderId, transaction_amount: total,
      description: `Pedido - ${items.map(i => i.product.name).join(", ")}`.slice(0, 256),
      payment_method_id: data.paymentMethod,
      payer_email: data.email, payer_first_name: firstName, payer_last_name: lastName,
      payer_identification_type: "CPF",
      payer_identification_number: data.cpf.replace(/\D/g, ""),
    };

    if (data.paymentMethod === "boleto") {
      paymentBody.payer_zip_code = data.zipCode?.replace(/\D/g, "");
      paymentBody.payer_street_name = data.street;
      paymentBody.payer_street_number = data.number || "S/N";
      paymentBody.payer_neighborhood = data.neighborhood;
      paymentBody.payer_city = data.city;
      paymentBody.payer_federal_unit = data.state;
    }

    if (data.paymentMethod === "credit_card") {
      if (!paymentSettings?.mp_public_key || !window.MercadoPago) {
        throw new Error("SDK do Mercado Pago não carregado. Recarregue a página.");
      }
      const mp = new window.MercadoPago(paymentSettings.mp_public_key, { locale: "pt-BR" });
      const cleanCardNumber = cardNumber.replace(/\s/g, "");
      const bin = cleanCardNumber.substring(0, 6);

      let detectedPaymentMethodId = "visa";
      let detectedIssuerId: string | undefined;
      try {
        const pmResponse = await mp.getPaymentMethods({ bin });
        if (pmResponse?.results?.length > 0) {
          detectedPaymentMethodId = pmResponse.results[0].id;
          if (pmResponse.results[0].issuer?.id) detectedIssuerId = String(pmResponse.results[0].issuer.id);
        }
      } catch (pmErr) { console.warn("Could not detect payment method from BIN:", pmErr); }

      const fullYear = expirationYear.length === 2 ? `20${expirationYear}` : expirationYear;
      const tokenResult = await mp.createCardToken({
        cardNumber: cleanCardNumber, cardholderName,
        cardExpirationMonth: expirationMonth.padStart(2, "0"),
        cardExpirationYear: fullYear,
        securityCode: securityCode.replace(/\D/g, ""),
        identificationType: "CPF",
        identificationNumber: data.cpf.replace(/\D/g, ""),
      });
      if (!tokenResult?.id) throw new Error("Erro ao tokenizar cartão. Verifique os dados.");
      paymentBody.token = tokenResult.id;
      paymentBody.installments = cardInstallments;
      paymentBody.payment_method_id = tokenResult.payment_method_id || detectedPaymentMethodId;
      paymentBody.issuer_id = tokenResult.issuer_id || detectedIssuerId;
    }

    const { data: result, error } = await supabase.functions.invoke("mercadopago-payment", { body: paymentBody });
    if (error) throw new Error(error.message);
    if (result?.error) throw new Error(result.error);
    return result as PaymentResult;
  };

  const copyPixCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setPixCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setPixCopied(false), 3000);
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) { toast.error("Seu carrinho está vazio"); return; }
    if (!allDigital && (!data.zipCode || !data.street || !data.number || !data.neighborhood || !data.city || !data.state)) {
      toast.error("Preencha o endereço completo"); return;
    }

    setIsSubmitting(true);
    try {
      const cleanCpf = data.cpf.replace(/\D/g, "");
      const { data: cpfCheck } = await supabase
        .from("customers").select("id, email").eq("cpf", cleanCpf).neq("email", data.email).limit(1);
      if (cpfCheck && cpfCheck.length > 0) {
        toast.error("Este CPF já está vinculado a outro email.");
        setIsSubmitting(false);
        return;
      }

      let customerId: string;
      const { data: existingCustomer } = await supabase
        .from("customers").select("id").eq("email", data.email).maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;
        await supabase.from("customers").update({
          full_name: data.fullName, phone: data.phone, cpf: cleanCpf,
          user_id: user?.id || null,
        }).eq("id", customerId);
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers").insert({
            email: data.email, full_name: data.fullName, phone: data.phone, cpf: cleanCpf,
            user_id: user?.id || null,
          }).select("id").single();
        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      if (!allDigital && data.zipCode) {
        const addressData = {
          customer_id: customerId, recipient_name: data.fullName,
          zip_code: data.zipCode!, street: data.street!, number: data.number!,
          complement: data.complement || null, neighborhood: data.neighborhood!,
          city: data.city!, state: data.state!, is_default: true,
        };
        const { data: existingAddr } = await supabase
          .from("customer_addresses").select("id")
          .eq("customer_id", customerId).eq("zip_code", data.zipCode!).eq("number", data.number!).maybeSingle();

        if (existingAddr) {
          await supabase.from("customer_addresses").update(addressData).eq("id", existingAddr.id);
        } else {
          await supabase.from("customer_addresses").insert(addressData);
        }
      }

      const shippingAddress = allDigital ? null : {
        recipient_name: data.fullName, zip_code: data.zipCode, street: data.street,
        number: data.number, complement: data.complement || null,
        neighborhood: data.neighborhood, city: data.city, state: data.state,
      };

      // Check for existing pending order with same customer and same total
      let order: { id: string; order_number: string };
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id, order_number")
        .eq("customer_id", customerId)
        .eq("status", "pending_payment")
        .eq("payment_status", "pending")
        .eq("total", total)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingOrder) {
        // Reuse the existing pending order — update payment method and address
        await supabase.from("orders").update({
          payment_method: data.paymentMethod as Database["public"]["Enums"]["payment_method"],
          shipping_address: shippingAddress,
          discount: couponDiscount + pixDiscount,
          coupon_code: couponApplied?.code || null,
          updated_at: new Date().toISOString(),
        }).eq("id", existingOrder.id);
        order = existingOrder;
      } else {
        // Create new order
        const { data: newOrder, error: orderError } = await supabase.from("orders").insert({
          customer_id: customerId, user_id: user?.id || null,
          subtotal, shipping_cost: 0, discount: couponDiscount + pixDiscount, total,
          status: "pending_payment" as Database["public"]["Enums"]["order_status"],
          payment_status: "pending" as Database["public"]["Enums"]["payment_status"],
          payment_method: data.paymentMethod as Database["public"]["Enums"]["payment_method"],
          shipping_address: shippingAddress, order_number: "",
          coupon_code: couponApplied?.code || null,
        }).select("id, order_number").single();

        if (orderError) throw orderError;
        order = newOrder;

        // Record coupon usage
        if (couponApplied) {
          const { data: couponRecord } = await supabase
            .from("coupons").select("id").eq("code", couponApplied.code).single();
          if (couponRecord) {
            await supabase.from("coupon_usage").insert({
              coupon_id: couponRecord.id,
              order_id: order.id,
              customer_id: customerId,
              discount_applied: couponDiscount,
            });
            const { data: couponData } = await supabase.from("coupons").select("used_count").eq("id", couponRecord.id).single();
            if (couponData) {
              await supabase.from("coupons").update({ used_count: (couponData.used_count || 0) + 1 }).eq("id", couponRecord.id);
            }
          }
        }

        const orderItems = items.map((item) => ({
          order_id: order.id, product_id: item.product.id,
          product_name: item.product.name,
          product_sku: item.variantSku || item.product.sku || null,
          quantity: item.quantity,
          unit_price: item.variantPrice ?? item.product.price,
          total_price: (item.variantPrice ?? item.product.price) * item.quantity,
          variant_id: item.variantId || null,
          variant_attributes: item.variantAttributes || null,
        }));
        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
        if (itemsError) throw itemsError;
      }

      try {
        const result = await processPayment(order.id, data);
        setPaymentResult(result);

        if (result.status === "approved") {
          clearCart();
          setPaymentApproved(true);
          toast.success(`Pagamento aprovado! Pedido ${order.order_number}`);
          return;
        }

        if (data.paymentMethod === "pix" || data.paymentMethod === "boleto") {
          startPaymentPolling(order.id, order.order_number);
        }

        if (data.paymentMethod === "pix" && result.pix) {
          toast.success("Pedido criado! Escaneie o QR Code PIX para pagar.");
        } else if (data.paymentMethod === "boleto" && result.boleto) {
          toast.success("Pedido criado! Boleto gerado com sucesso.");
        } else {
          toast.info(`Pagamento ${result.status === "pending" ? "pendente" : result.status}`);
        }
      } catch (paymentError: any) {
        console.error("Payment processing error:", paymentError);
        toast.error("Pedido criado, mas houve um erro no pagamento: " + paymentError.message);
      }

      try {
        const { data: currentCustomer } = await supabase
          .from("customers").select("order_count, total_spent").eq("id", customerId).single();
        await supabase.from("customers").update({
          order_count: (currentCustomer?.order_count || 0) + 1,
          total_spent: (Number(currentCustomer?.total_spent) || 0) + total,
          last_order_at: new Date().toISOString(),
        }).eq("id", customerId);
      } catch (statsErr) {
        console.error("Failed to update customer stats:", statsErr);
      }

    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Erro ao finalizar pedido: " + error.message);
    } finally { setIsSubmitting(false); }
  };

  // ─── Approved Screen ──────────────────────────────────────────────────────
  if (paymentApproved) {
    return (
      <>
        <Header /><CartDrawer />
        <div className="min-h-screen bg-muted/30 pt-24 pb-12">
          <div className="container max-w-lg mx-auto px-4">
            <Card>
              <CardContent className="pt-8 space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-green-700">Pagamento Confirmado!</h2>
                <p className="text-muted-foreground">
                  {currentOrderNumber ? `Seu pedido ${currentOrderNumber} foi confirmado.` : "Seu pedido foi confirmado."}
                </p>
                <Separator />
                <Button onClick={() => navigate("/conta")} className="w-full">Ver meus pedidos</Button>
                <Button variant="ghost" onClick={() => navigate("/")}>Voltar à loja</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  // ─── Pending Payment Screen ───────────────────────────────────────────────
  if (paymentResult && paymentResult.status !== "approved") {
    return (
      <>
        <Header /><CartDrawer />
        <div className="min-h-screen bg-muted/30 pt-24 pb-12">
          <div className="container max-w-lg mx-auto px-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  {paymentResult.pix ? "Pague com PIX" : "Boleto Gerado"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-center">
                {paymentResult.is_sandbox && (
                  <Alert className="border-amber-500/50 bg-amber-500/10">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700">
                      <strong>Modo Sandbox:</strong> Este pagamento é apenas para testes.
                    </AlertDescription>
                  </Alert>
                )}

                {paymentResult.pix?.qr_code_base64 && (
                  <div className="flex flex-col items-center gap-4">
                    <img src={`data:image/png;base64,${paymentResult.pix.qr_code_base64}`} alt="QR Code PIX" className="w-64 h-64 rounded-lg border" />
                    <p className="text-sm text-muted-foreground">Escaneie o QR Code com o app do seu banco</p>

                    {/* Total with PIX discount */}
                    <div className="w-full rounded-lg bg-success/10 border border-success/20 p-3">
                      <p className="text-sm text-muted-foreground">Valor a pagar</p>
                      <p className="text-2xl font-bold text-success">{formatCurrency(total)}</p>
                      {pixDiscount > 0 && (
                        <p className="text-xs text-success">Inclui desconto de {pixDiscountPercent}% no PIX</p>
                      )}
                    </div>

                    {paymentResult.pix.qr_code && (
                      <Button variant="outline" onClick={() => copyPixCode(paymentResult.pix!.qr_code)} className="w-full">
                        {pixCopied ? <><CheckCircle2 className="h-4 w-4 mr-2 text-green-600" /> Copiado!</> : <><Copy className="h-4 w-4 mr-2" /> Copiar código PIX</>}
                      </Button>
                    )}
                  </div>
                )}

                {paymentResult.boleto && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-muted-foreground">Seu boleto foi gerado com sucesso.</p>

                    {paymentResult.boleto.pdf_base64 && (
                      <Button asChild className="w-full h-12 text-base font-bold">
                        <a href={`data:application/pdf;base64,${paymentResult.boleto.pdf_base64}`} download="boleto.pdf">
                          <FileText className="h-5 w-5 mr-2" /> Baixar Boleto (PDF)
                        </a>
                      </Button>
                    )}

                    {paymentResult.boleto.digitable_line && (
                      <div className="w-full rounded-lg border border-border bg-secondary/30 p-4 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Linha digitável</p>
                        <p className="text-sm font-mono break-all leading-relaxed select-all">{paymentResult.boleto.digitable_line}</p>
                        <Button variant="default" className="w-full mt-2" onClick={() => { navigator.clipboard.writeText(paymentResult.boleto!.digitable_line!); toast.success("Linha digitável copiada!"); }}>
                          <Copy className="h-4 w-4 mr-2" /> Copiar Linha Digitável
                        </Button>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground text-center">
                      Copie a linha digitável e pague pelo app do seu banco, internet banking ou lotérica.
                    </p>

                    {!paymentResult.boleto.pdf_base64 && paymentResult.boleto.url && (
                      <Button variant="outline" asChild className="w-full">
                        <a href={paymentResult.boleto.url} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" /> Abrir boleto no navegador
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                <Separator />
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Aguardando confirmação do pagamento...</span>
                </div>
                <p className="text-xs text-muted-foreground">Após o pagamento, esta página será atualizada automaticamente.</p>
                <Button variant="ghost" onClick={() => navigate("/conta")}>Ver meus pedidos</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  if (authLoading || customerLoading) {
    return (
      <><Header /><div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></>
    );
  }

  if (items.length === 0) {
    return (
      <><Header /><CartDrawer />
        <div className="min-h-screen bg-muted/30 pt-24 pb-12">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Seu carrinho está vazio</h1>
            <Button onClick={() => navigate("/")}>Voltar às compras</Button>
          </div>
        </div>
      </>
    );
  }

  // ─── Checkout Form ────────────────────────────────────────────────────────
  return (
    <>
      <Header /><CartDrawer />
      <div className="min-h-screen bg-muted/30 pt-24 pb-12">
        <div className="container max-w-6xl mx-auto px-4">
          <Button variant="ghost" className="mb-6" onClick={() => navigate("/carrinho")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao carrinho
          </Button>

          {isSandbox && (
            <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                <strong>Modo Sandbox:</strong> Os pagamentos gerados aqui são apenas para testes e não serão cobrados.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* ── Step 1: Customer Data ── */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                          Seus Dados
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="fullName" render={({ field }) => (
                          <FormItem className="md:col-span-2"><FormLabel>Nome completo</FormLabel><FormControl><Input placeholder="Seu nome" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="seu@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem><FormLabel>Telefone</FormLabel><FormControl>
                            <Input placeholder="(11) 99999-9999" value={field.value} onChange={(e) => field.onChange(formatPhone(e.target.value))} />
                          </FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="cpf" render={({ field }) => (
                          <FormItem><FormLabel>CPF</FormLabel><FormControl>
                            <Input placeholder="000.000.000-00" value={field.value} onChange={(e) => field.onChange(formatCPF(e.target.value))} />
                          </FormControl><FormMessage /></FormItem>
                        )} />
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* ── Step 2: Address ── */}
                  {!allDigital && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
                            <MapPin className="h-5 w-5" /> Endereço de Entrega
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                          <FormField control={form.control} name="zipCode" render={({ field }) => (
                            <FormItem><FormLabel>CEP</FormLabel><FormControl>
                              <div className="relative">
                                <Input placeholder="00000-000" value={field.value} onChange={(e) => field.onChange(formatCEP(e.target.value))} onBlur={(e) => { field.onBlur(); fetchAddressFromCep(e.target.value); }} />
                                {isFetchingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                              </div>
                            </FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="street" render={({ field }) => (
                            <FormItem className="md:col-span-2"><FormLabel>Rua</FormLabel><FormControl><Input placeholder="Rua, Avenida..." {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="number" render={({ field }) => (
                            <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="123" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="complement" render={({ field }) => (
                            <FormItem><FormLabel>Complemento</FormLabel><FormControl><Input placeholder="Apto, Bloco..." {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="neighborhood" render={({ field }) => (
                            <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Bairro" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="city" render={({ field }) => (
                            <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="Cidade" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="state" render={({ field }) => (
                            <FormItem><FormLabel>Estado</FormLabel><FormControl><Input placeholder="SP" maxLength={2} {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* ── Step 3: Payment Method ── */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: allDigital ? 0.1 : 0.2 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">{allDigital ? "2" : "3"}</span>
                          <CreditCard className="h-5 w-5" /> Forma de Pagamento
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                          <FormItem><FormControl>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="grid sm:grid-cols-3 gap-3">
                              {effectivePixEnabled && (
                                <Label className={`relative flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                  field.value === "pix" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                                }`}>
                                  <RadioGroupItem value="pix" className="sr-only" />
                                  <div className={`p-2.5 rounded-full ${field.value === "pix" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                    <Zap className="h-5 w-5" />
                                  </div>
                                  <span className="font-semibold text-sm">PIX</span>
                                  <span className="text-[11px] text-muted-foreground">Aprovação imediata</span>
                                  {pixDiscountPercent > 0 && (
                                    <Badge className="absolute -top-2 -right-2 bg-success text-success-foreground text-[10px] px-1.5 py-0.5">
                                      -{pixDiscountPercent}%
                                    </Badge>
                                  )}
                                </Label>
                              )}
                              {effectiveCreditEnabled && (
                                <Label className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                  field.value === "credit_card" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                                }`}>
                                  <RadioGroupItem value="credit_card" className="sr-only" />
                                  <div className={`p-2.5 rounded-full ${field.value === "credit_card" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                    <CreditCard className="h-5 w-5" />
                                  </div>
                                  <span className="font-semibold text-sm">Cartão de Crédito</span>
                                  <span className="text-[11px] text-muted-foreground">Até {effectiveMaxInstallments}x sem juros</span>
                                </Label>
                              )}
                              {effectiveBoletoFinal && (
                                <Label className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                  field.value === "boleto" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                                }`}>
                                  <RadioGroupItem value="boleto" className="sr-only" />
                                  <div className={`p-2.5 rounded-full ${field.value === "boleto" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                    <FileText className="h-5 w-5" />
                                  </div>
                                  <span className="font-semibold text-sm">Boleto Bancário</span>
                                  <span className="text-[11px] text-muted-foreground">Vence em 3 dias úteis</span>
                                </Label>
                              )}
                            </RadioGroup>
                          </FormControl><FormMessage /></FormItem>
                        )} />
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* ── Credit Card Form ── */}
                  {paymentMethod === "credit_card" && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" /> Dados do Cartão
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label>Número do Cartão</Label>
                            <Input
                              placeholder="0000 0000 0000 0000"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                              maxLength={19}
                              inputMode="numeric"
                            />
                          </div>
                          <div>
                            <Label>Nome no Cartão</Label>
                            <Input placeholder="Como está no cartão" value={cardholderName} onChange={(e) => setCardholderName(e.target.value.toUpperCase())} />
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div><Label>Mês</Label><Input placeholder="MM" value={expirationMonth} onChange={(e) => setExpirationMonth(e.target.value.replace(/\D/g, "").slice(0, 2))} maxLength={2} inputMode="numeric" /></div>
                            <div><Label>Ano</Label><Input placeholder="AA" value={expirationYear} onChange={(e) => setExpirationYear(e.target.value.replace(/\D/g, "").slice(0, 2))} maxLength={2} inputMode="numeric" /></div>
                            <div><Label>CVV</Label><Input placeholder="123" value={securityCode} onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, "").slice(0, 4))} maxLength={4} type="password" inputMode="numeric" /></div>
                          </div>
                          <div>
                            <Label>Parcelas</Label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              value={cardInstallments}
                              onChange={(e) => setCardInstallments(Number(e.target.value))}
                            >
                              {Array.from({ length: effectiveMaxInstallments }, (_, i) => i + 1)
                                .filter((n) => total / n >= (paymentSettings?.min_installment_value || 5))
                                .map((n) => (
                                  <option key={n} value={n}>
                                    {n}x de {formatCurrency(total / n)} sem juros
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                            <span>Seus dados são criptografados pelo Mercado Pago</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  <div className="lg:hidden">
                    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>) : `Finalizar Pedido • ${formatCurrency(total)}`}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>

            {/* ── Order Summary ── */}
            <div className="lg:col-span-1">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="sticky top-24 space-y-4">
                <Card>
                  <CardHeader><CardTitle>Resumo do Pedido</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {items.map((item, idx) => (
                        <div key={`${item.product.id}_${item.variantId || idx}`} className="flex gap-3">
                          <img src={item.product.images?.[0] || "/placeholder.svg"} alt={item.product.name} className="w-16 h-16 object-cover rounded" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.product.name}</p>
                            {item.variantAttributes && (
                              <p className="text-xs text-muted-foreground">
                                {Object.entries(item.variantAttributes).map(([k, v]) => `${k}: ${v}`).join(", ")}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">Qtd: {item.quantity}</p>
                            <p className="font-semibold text-sm">{formatCurrency((item.variantPrice ?? item.product.price) * item.quantity)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Coupon */}
                    <div className="space-y-2">
                      {!couponApplied ? (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Cupom de desconto"
                            value={form.watch("couponCode") || ""}
                            onChange={(e) => form.setValue("couponCode", e.target.value.toUpperCase())}
                            className="text-sm uppercase"
                          />
                          <Button type="button" variant="outline" size="sm" onClick={applyCoupon} disabled={couponLoading} className="shrink-0">
                            {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/5 p-2.5">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-success" />
                            <span className="text-sm font-medium text-success">{couponApplied.code}</span>
                            <span className="text-xs text-muted-foreground">
                              ({couponApplied.type === "percentage" ? `${couponApplied.value}%` : formatCurrency(couponApplied.value)})
                            </span>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={removeCoupon} className="h-6 text-xs text-destructive hover:text-destructive">
                            Remover
                          </Button>
                        </div>
                      )}
                      {couponError && <p className="text-xs text-destructive">{couponError}</p>}
                    </div>

                    <Separator />

                    {/* Totals */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>

                      {couponDiscount > 0 && (
                        <div className="flex justify-between text-sm text-success">
                          <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> Cupom</span>
                          <span>-{formatCurrency(couponDiscount)}</span>
                        </div>
                      )}

                      {pixDiscount > 0 && (
                        <div className="flex justify-between text-sm text-success">
                          <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Desconto PIX ({pixDiscountPercent}%)</span>
                          <span>-{formatCurrency(pixDiscount)}</span>
                        </div>
                      )}

                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                      </div>

                      {/* Installment info */}
                      {effectiveCreditEnabled && paymentMethod !== "pix" && (
                        <p className="text-xs text-muted-foreground text-center">
                          ou {effectiveMaxInstallments}x de {formatCurrency(total / effectiveMaxInstallments)} sem juros
                        </p>
                      )}
                    </div>

                    <div className="hidden lg:block pt-4">
                      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting} onClick={form.handleSubmit(onSubmit)}>
                        {isSubmitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>) : "Finalizar Pedido"}
                      </Button>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      <span>Compra 100% segura e protegida</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
