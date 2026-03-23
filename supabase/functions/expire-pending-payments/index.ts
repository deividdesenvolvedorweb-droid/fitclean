import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get payment settings for timeout config
    const { data: settings } = await supabase
      .from("payment_settings")
      .select("pix_timeout_minutes, boleto_timeout_hours")
      .limit(1)
      .single();

    const pixTimeoutMinutes = settings?.pix_timeout_minutes ?? 120;
    const boletoTimeoutHours = settings?.boleto_timeout_hours ?? 72;

    const now = new Date();

    // Get all pending orders
    const { data: pendingOrders, error: fetchError } = await supabase
      .from("orders")
      .select("id, order_number, payment_method, created_at, payment_status, status")
      .eq("status", "pending_payment")
      .eq("payment_status", "pending");

    if (fetchError) throw fetchError;
    if (!pendingOrders || pendingOrders.length === 0) {
      return new Response(JSON.stringify({ expired: 0, message: "No pending orders" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let expiredCount = 0;
    const expiredOrders: string[] = [];

    for (const order of pendingOrders) {
      const createdAt = new Date(order.created_at);
      let timeoutMs: number;

      if (order.payment_method === "boleto") {
        timeoutMs = boletoTimeoutHours * 60 * 60 * 1000;
      } else {
        // PIX or null/unknown — use PIX timeout
        timeoutMs = pixTimeoutMinutes * 60 * 1000;
      }

      const expiresAt = new Date(createdAt.getTime() + timeoutMs);

      if (now > expiresAt) {
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "canceled",
            payment_status: "rejected",
            canceled_at: now.toISOString(),
            internal_notes: `Pagamento expirado automaticamente. Método: ${order.payment_method || "pix"}. Timeout: ${order.payment_method === "boleto" ? boletoTimeoutHours + "h" : pixTimeoutMinutes + "min"}.`,
          })
          .eq("id", order.id);

        if (!updateError) {
          expiredCount++;
          expiredOrders.push(order.order_number);

          // Add status history
          await supabase.from("order_status_history").insert({
            order_id: order.id,
            from_status: "pending_payment",
            to_status: "canceled",
            notes: "Pagamento expirado automaticamente pelo sistema",
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ expired: expiredCount, orders: expiredOrders }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error expiring payments:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
