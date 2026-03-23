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

    const body = await req.json();
    const {
      order_id,
      transaction_amount: rawAmount,
      payment_method_id,
      payer_email,
      payer_first_name,
      payer_last_name,
      payer_identification_type,
      payer_identification_number,
      token,
      installments,
      description,
      payer_zip_code,
      payer_street_name,
      payer_street_number,
      payer_neighborhood,
      payer_city,
      payer_federal_unit,
    } = body;

    // Ensure transaction_amount is a valid float
    const transaction_amount = Math.round(Number(rawAmount) * 100) / 100;
    if (!transaction_amount || isNaN(transaction_amount) || transaction_amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Valor do pagamento inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mercado Pago minimum amounts
    const minAmounts: Record<string, number> = { boleto: 5, pix: 1 };
    const methodKey = payment_method_id === "boleto" ? "boleto" : payment_method_id === "pix" ? "pix" : null;
    if (methodKey && transaction_amount < minAmounts[methodKey]) {
      return new Response(
        JSON.stringify({ error: `Valor mínimo para ${methodKey.toUpperCase()} é R$${minAmounts[methodKey].toFixed(2)}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch access token from payment_settings
    const { data: settings, error: settingsError } = await supabase
      .from("payment_settings")
      .select("mp_access_token, environment")
      .limit(1)
      .single();

    if (settingsError || !settings?.mp_access_token) {
      return new Response(
        JSON.stringify({ error: "Mercado Pago não configurado. Configure o Access Token no painel admin." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = settings.mp_access_token;
    const isTestToken = accessToken.startsWith("TEST-");
    const configuredEnv = settings.environment;

    // Auto-detect environment from token
    const effectiveEnv = isTestToken ? "sandbox" : configuredEnv;

    console.log(`[MercadoPago] Environment: ${configuredEnv}, Token type: ${isTestToken ? "TEST" : "PRODUCTION"}, Effective: ${effectiveEnv}`);

    if (configuredEnv === "production" && isTestToken) {
      console.warn("[MercadoPago] WARNING: Production environment configured but using TEST token. PIX codes will be sandbox-only!");
    }

    // Build payment payload
    const paymentPayload: Record<string, unknown> = {
      transaction_amount,
      description: description || "Pedido da loja",
      payer: {
        email: payer_email,
        first_name: payer_first_name,
        last_name: payer_last_name,
        identification: {
          type: payer_identification_type || "CPF",
          number: payer_identification_number,
        },
      },
    };

    if (payment_method_id === "pix") {
      paymentPayload.payment_method_id = "pix";
    } else if (payment_method_id === "boleto") {
      // Will try bolbradesco first, then bolbr as fallback
      paymentPayload.payment_method_id = "bolbradesco";
      // Boleto requires payer address
      (paymentPayload.payer as Record<string, unknown>).address = {
        zip_code: payer_zip_code,
        street_name: payer_street_name,
        street_number: payer_street_number || "S/N",
        neighborhood: payer_neighborhood,
        city: payer_city,
        federal_unit: payer_federal_unit,
      };
    } else {
      // Treat everything else as credit card (visa, master, etc.)
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Token do cartão é obrigatório para pagamento com cartão de crédito." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      paymentPayload.payment_method_id = payment_method_id;
      paymentPayload.token = token;
      paymentPayload.installments = installments || 1;
      if (body.issuer_id) {
        paymentPayload.issuer_id = Number(body.issuer_id);
      }
    }

    console.log(`[MercadoPago] Creating payment for order ${order_id}, amount: ${transaction_amount}, method: ${payment_method_id}`);
    console.log(`[MercadoPago] Payload:`, JSON.stringify(paymentPayload));

    // Call Mercado Pago API with timeout and boleto fallback
    const createPayment = async (payload: Record<string, unknown>): Promise<{ response: Response; data: any }> => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);
      try {
        const resp = await fetch("https://api.mercadopago.com/v1/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            "X-Idempotency-Key": (order_id || crypto.randomUUID()) + (payload.payment_method_id === "bolbr" ? "-retry" : ""),
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const d = await resp.json();
        return { response: resp, data: d };
      } catch (fetchError: any) {
        clearTimeout(timeout);
        if (fetchError.name === "AbortError") {
          throw new Error("Timeout ao conectar com Mercado Pago. Tente novamente.");
        }
        throw fetchError;
      }
    };

    let mpResponse: Response;
    let mpData: any;

    const result = await createPayment(paymentPayload);
    mpResponse = result.response;
    mpData = result.data;

    // Boleto fallback: if bolbradesco fails (HTTP error OR rejected status), try bolbr
    const shouldFallbackBoleto = payment_method_id === "boleto" && paymentPayload.payment_method_id === "bolbradesco" && 
      (!mpResponse.ok || mpData?.status === "rejected");
    if (shouldFallbackBoleto) {
      console.log(`[MercadoPago] bolbradesco failed (HTTP: ${mpResponse.status}, status: ${mpData?.status}), trying bolbr as fallback...`);
      paymentPayload.payment_method_id = "bolbr";
      const retry = await createPayment(paymentPayload);
      mpResponse = retry.response;
      mpData = retry.data;
    }

    // Boleto fallback 2: try generic "boleto" method if bolbr also failed
    const shouldFallbackGenericBoleto = payment_method_id === "boleto" && paymentPayload.payment_method_id === "bolbr" &&
      (!mpResponse.ok || mpData?.status === "rejected");
    if (shouldFallbackGenericBoleto) {
      console.log(`[MercadoPago] bolbr also failed (HTTP: ${mpResponse.status}, status: ${mpData?.status}), trying generic 'boleto'...`);
      paymentPayload.payment_method_id = "boleto";
      const retry = await createPayment(paymentPayload);
      mpResponse = retry.response;
      mpData = retry.data;
    }

    console.log(`[MercadoPago] Response status: ${mpResponse.status}, payment status: ${mpData?.status}, detail: ${mpData?.status_detail}`);

    if (!mpResponse.ok) {
      console.error("[MercadoPago] Full error response:", JSON.stringify(mpData));
      return new Response(
        JSON.stringify({ error: "Erro ao processar pagamento", details: mpData }),
        { status: mpResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle rejected payments — return user-friendly error
    if (mpData.status === "rejected") {
      console.error("[MercadoPago] Payment rejected:", mpData.status_detail);

      const rejectionMessages: Record<string, string> = {
        rejected_by_bank: "Pagamento recusado pelo banco. Verifique seus dados ou tente outro método de pagamento.",
        cc_rejected_insufficient_amount: "Saldo insuficiente.",
        cc_rejected_bad_filled_card_number: "Número do cartão incorreto.",
        cc_rejected_bad_filled_date: "Data de validade incorreta.",
        cc_rejected_bad_filled_security_code: "Código de segurança incorreto.",
        cc_rejected_bad_filled_other: "Dados do cartão incorretos.",
        cc_rejected_call_for_authorize: "Ligue para a operadora do cartão para autorizar.",
        cc_rejected_duplicated_payment: "Pagamento duplicado. Aguarde ou use outro cartão.",
        cc_rejected_high_risk: "Pagamento recusado por segurança. Tente outro método.",
        cc_rejected_max_attempts: "Limite de tentativas excedido. Tente outro cartão.",
        cc_rejected_other_reason: "Pagamento recusado. Tente outro método.",
      };

      const userMessage = rejectionMessages[mpData.status_detail] || "Pagamento recusado. Tente outro método de pagamento.";

      // Update order status
      if (order_id) {
        await supabase.from("orders").update({
          mp_payment_id: String(mpData.id),
          mp_payment_status: mpData.status,
          payment_status: "rejected",
          status: "pending_payment",
        }).eq("id", order_id);
      }

      return new Response(
        JSON.stringify({ error: userMessage, status: "rejected", status_detail: mpData.status_detail }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update order with MP payment data
    if (order_id) {
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

      await supabase
        .from("orders")
        .update({
          mp_payment_id: String(mpData.id),
          mp_payment_status: mpData.status,
          payment_status: statusMap[mpData.status] || "pending",
          status: orderStatusMap[mpData.status] || "pending_payment",
          payment_data: {
            mp_id: mpData.id,
            mp_status: mpData.status,
            mp_status_detail: mpData.status_detail,
            is_sandbox: isTestToken,
            payment_method: payment_method_id,
            ...(payment_method_id === "pix" && mpData.point_of_interaction?.transaction_data && {
              qr_code: mpData.point_of_interaction.transaction_data.qr_code,
              qr_code_base64: mpData.point_of_interaction.transaction_data.qr_code_base64,
            }),
            ...(payment_method_id === "boleto" && {
              boleto_url: mpData.transaction_details?.external_resource_url || mpData.point_of_interaction?.transaction_data?.ticket_url,
              barcode: mpData.barcode?.content,
            }),
          },
        })
        .eq("id", order_id);
    }

    // Return relevant data to frontend — separate PIX vs Boleto
    const responseData: Record<string, unknown> = {
      id: mpData.id,
      status: mpData.status,
      status_detail: mpData.status_detail,
      is_sandbox: isTestToken,
      payment_method: payment_method_id,
    };

    if (payment_method_id === "pix" && mpData.point_of_interaction?.transaction_data) {
      responseData.pix = {
        qr_code: mpData.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: mpData.point_of_interaction.transaction_data.qr_code_base64,
      };
    }

    if (payment_method_id === "boleto") {
      const boletoExternalUrl = mpData.transaction_details?.external_resource_url || mpData.point_of_interaction?.transaction_data?.ticket_url || null;
      let boletoPdfBase64: string | null = null;

      // Try to download boleto PDF and convert to base64
      if (boletoExternalUrl) {
        try {
          console.log("[MercadoPago] Downloading boleto PDF from:", boletoExternalUrl);
          const pdfResponse = await fetch(boletoExternalUrl, {
            headers: { "Accept": "application/pdf" },
          });

          if (pdfResponse.ok) {
            const contentType = pdfResponse.headers.get("content-type") || "";
            const arrayBuffer = await pdfResponse.arrayBuffer();
            const uint8 = new Uint8Array(arrayBuffer);
            let binary = "";
            for (let i = 0; i < uint8.length; i++) {
              binary += String.fromCharCode(uint8[i]);
            }
            boletoPdfBase64 = btoa(binary);
            console.log(`[MercadoPago] Boleto PDF downloaded, size: ${uint8.length} bytes, content-type: ${contentType}`);
          } else {
            console.warn(`[MercadoPago] Failed to download boleto PDF: ${pdfResponse.status}`);
          }
        } catch (pdfErr) {
          console.error("[MercadoPago] Error downloading boleto PDF:", pdfErr);
        }
      }

      responseData.boleto = {
        url: boletoExternalUrl,
        barcode: mpData.barcode?.content || null,
        digitable_line: mpData.barcode?.content || null,
        pdf_base64: boletoPdfBase64,
      };
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[MercadoPago] Payment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
