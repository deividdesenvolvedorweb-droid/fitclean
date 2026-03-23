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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json();

    // Log webhook
    const { data: logEntry } = await supabase.from("webhook_logs").insert({
      provider: "mercadopago",
      event_type: body.type || body.action || "unknown",
      payload: body,
      status: "received",
    }).select("id").single();

    const logId = logEntry?.id;

    // Handle payment notifications
    if (body.type === "payment" || body.action === "payment.updated" || body.action === "payment.created") {
      const paymentId = body.data?.id;

      if (!paymentId) {
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get access token
      const { data: settings } = await supabase
        .from("payment_settings")
        .select("mp_access_token")
        .limit(1)
        .single();

      if (!settings?.mp_access_token) {
        console.error("No MP access token configured");
        if (logId) {
          await supabase.from("webhook_logs").update({
            status: "error",
            error_message: "No MP access token configured",
            processed_at: new Date().toISOString(),
          }).eq("id", logId);
        }
        return new Response(JSON.stringify({ error: "Not configured" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch payment details from Mercado Pago
      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${settings.mp_access_token}`,
          },
        }
      );

      if (!mpResponse.ok) {
        console.error("Failed to fetch MP payment:", mpResponse.status);
        if (logId) {
          await supabase.from("webhook_logs").update({
            status: "error",
            error_message: `Failed to fetch payment: ${mpResponse.status}`,
            processed_at: new Date().toISOString(),
          }).eq("id", logId);
        }
        return new Response(JSON.stringify({ error: "Failed to fetch payment" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const payment = await mpResponse.json();
      console.log(`[Webhook] Payment ${paymentId} status: ${payment.status}, detail: ${payment.status_detail}`);

      // Map MP status to our statuses
      const paymentStatusMap: Record<string, string> = {
        approved: "approved",
        authorized: "approved",
        pending: "pending",
        in_process: "pending",
        rejected: "rejected",
        cancelled: "rejected",
        refunded: "rejected",
        charged_back: "chargeback",
      };

      const orderStatusMap: Record<string, string> = {
        approved: "paid",
        authorized: "paid",
        pending: "pending_payment",
        in_process: "pending_payment",
        rejected: "pending_payment",
        cancelled: "canceled",
        refunded: "refunded",
        charged_back: "pending_payment",
      };

      const newPaymentStatus = paymentStatusMap[payment.status] || "pending";
      const newOrderStatus = orderStatusMap[payment.status] || "pending_payment";

      // Update order by mp_payment_id
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          mp_payment_status: payment.status,
          payment_status: newPaymentStatus,
          status: newOrderStatus,
          ...(payment.status === "refunded" && { refunded_at: new Date().toISOString() }),
          ...(payment.status === "cancelled" && { canceled_at: new Date().toISOString() }),
        })
        .eq("mp_payment_id", String(paymentId));

      if (updateError) {
        console.error("Failed to update order:", updateError);
      }

      // Update webhook log by id
      if (logId) {
        await supabase.from("webhook_logs").update({
          status: updateError ? "error" : "processed",
          error_message: updateError?.message || null,
          processed_at: new Date().toISOString(),
        }).eq("id", logId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
