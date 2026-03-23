import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "order_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch order to get mp_payment_id
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, mp_payment_id, payment_status, status")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Pedido não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Already approved, return immediately
    if (order.payment_status === "approved" || order.status === "paid") {
      return new Response(
        JSON.stringify({ status: "approved", payment_status: "approved", updated: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!order.mp_payment_id) {
      return new Response(
        JSON.stringify({ status: order.status, payment_status: order.payment_status, updated: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch access token
    const { data: settings } = await supabase
      .from("payment_settings")
      .select("mp_access_token")
      .limit(1)
      .single();

    if (!settings?.mp_access_token) {
      return new Response(
        JSON.stringify({ error: "Mercado Pago não configurado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Query MercadoPago API
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${order.mp_payment_id}`,
      {
        headers: { Authorization: `Bearer ${settings.mp_access_token}` },
      }
    );

    if (!mpResponse.ok) {
      console.error("[check-payment-status] MP API error:", mpResponse.status);
      return new Response(
        JSON.stringify({ status: order.status, payment_status: order.payment_status, updated: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mpData = await mpResponse.json();
    console.log(`[check-payment-status] MP status for payment ${order.mp_payment_id}: ${mpData.status}`);

    const statusMap: Record<string, string> = {
      approved: "approved",
      pending: "pending",
      in_process: "pending",
      rejected: "rejected",
    };

    const orderStatusMap: Record<string, string> = {
      approved: "paid",
      pending: "pending_payment",
      in_process: "pending_payment",
      rejected: "pending_payment",
    };

    const newPaymentStatus = statusMap[mpData.status] || "pending";
    const newOrderStatus = orderStatusMap[mpData.status] || "pending_payment";

    // Update if status changed
    let updated = false;
    if (newPaymentStatus !== order.payment_status || newOrderStatus !== order.status) {
      await supabase
        .from("orders")
        .update({
          payment_status: newPaymentStatus,
          status: newOrderStatus,
          mp_payment_status: mpData.status,
        })
        .eq("id", order_id);
      updated = true;
      console.log(`[check-payment-status] Updated order ${order_id}: ${newPaymentStatus} / ${newOrderStatus}`);
    }

    return new Response(
      JSON.stringify({ status: newOrderStatus, payment_status: newPaymentStatus, mp_status: mpData.status, updated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[check-payment-status] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
