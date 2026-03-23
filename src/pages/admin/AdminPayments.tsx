import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { CreditCard, Smartphone, FileText, Save, ExternalLink, AlertTriangle, CheckCircle2, KeyRound, Eye, EyeOff, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePaymentSettings } from "@/hooks/admin/usePaymentSettings";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { LoadingState } from "@/components/admin/shared/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const settingsSchema = z.object({
  provider: z.string(),
  environment: z.string(),
  pix_enabled: z.boolean(),
  credit_card_enabled: z.boolean(),
  boleto_enabled: z.boolean(),
  max_installments: z.number().min(1).max(12),
  min_installment_value: z.number().min(0),
  mp_public_key: z.string().optional(),
  mp_access_token: z.string().optional(),
  pix_timeout_minutes: z.number().min(5).max(1440),
  boleto_timeout_hours: z.number().min(1).max(168),
  installment_type: z.string().default("sem_juros"),
  installment_interest_rate: z.number().min(0).default(1.99),
  mp_fee_pix: z.number().min(0).default(0.99),
  mp_fee_credit: z.number().min(0).default(4.98),
  mp_fee_boleto: z.number().min(0).default(3.49),
});

type FormData = z.infer<typeof settingsSchema>;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function AdminPayments() {
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [isExpiring, setIsExpiring] = useState(false);
  const { settings, isLoading, updateSettings } = usePaymentSettings();

  const form = useForm<FormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      provider: "mercadopago",
      environment: "sandbox",
      pix_enabled: true,
      credit_card_enabled: true,
      boleto_enabled: true,
      max_installments: 12,
      min_installment_value: 5,
      mp_public_key: "",
      mp_access_token: "",
      pix_timeout_minutes: 120,
      boleto_timeout_hours: 72,
      installment_type: "sem_juros",
      installment_interest_rate: 1.99,
      mp_fee_pix: 0.99,
      mp_fee_credit: 4.98,
      mp_fee_boleto: 3.49,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        provider: settings.provider,
        environment: settings.environment,
        pix_enabled: settings.pix_enabled,
        credit_card_enabled: settings.credit_card_enabled,
        boleto_enabled: settings.boleto_enabled,
        max_installments: settings.max_installments,
        min_installment_value: Number(settings.min_installment_value),
        mp_public_key: settings.mp_public_key || "",
        mp_access_token: settings.mp_access_token || "",
        pix_timeout_minutes: (settings as any).pix_timeout_minutes ?? 120,
        boleto_timeout_hours: (settings as any).boleto_timeout_hours ?? 72,
        installment_type: (settings as any).installment_type ?? "sem_juros",
        installment_interest_rate: Number((settings as any).installment_interest_rate ?? 1.99),
        mp_fee_pix: Number((settings as any).mp_fee_pix ?? 0.99),
        mp_fee_credit: Number((settings as any).mp_fee_credit ?? 4.98),
        mp_fee_boleto: Number((settings as any).mp_fee_boleto ?? 3.49),
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        mp_public_key: data.mp_public_key?.trim() || null,
        mp_access_token: data.mp_access_token?.trim() || null,
      };
      await updateSettings.mutateAsync(payload);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    }
  };

  const { isDirty } = form.formState;
  const exampleValue = 500;
  const maxInstallments = form.watch("max_installments");
  const minInstallmentValue = form.watch("min_installment_value");
  const environment = form.watch("environment");
  const mpPublicKey = form.watch("mp_public_key");
  const mpAccessToken = form.watch("mp_access_token");
  const isConnected = !!mpPublicKey && !!mpAccessToken;
  const installmentType = form.watch("installment_type");
  const interestRate = form.watch("installment_interest_rate");
  const feePix = form.watch("mp_fee_pix");
  const feeCredit = form.watch("mp_fee_credit");
  const feeBoleto = form.watch("mp_fee_boleto");

  if (isLoading) return <LoadingState />;

  const calculateInstallmentValue = (total: number, n: number) => {
    if (installmentType === "com_juros" && n > 1) {
      const r = interestRate / 100;
      return total * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
    return total / n;
  };

  const calculateInstallments = () => {
    const installments = [];
    for (let i = 1; i <= maxInstallments; i++) {
      const value = calculateInstallmentValue(exampleValue, i);
      if (value >= minInstallmentValue) {
        const totalWithInterest = value * i;
        installments.push({ count: i, value, total: totalWithInterest });
      }
    }
    return installments;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader
          title="Pagamentos"
          description="Configure os métodos de pagamento da loja"
          icon={CreditCard}
        />
        {isDirty && (
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 text-xs">
            Alterações não salvas
          </Badge>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Provider Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Provedor de Pagamento</CardTitle>
              <CardDescription>Configure o provedor e ambiente de pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provedor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                          <SelectItem value="stripe" disabled>Stripe (em breve)</SelectItem>
                          <SelectItem value="pagseguro" disabled>PagSeguro (em breve)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="environment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ambiente</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                          <SelectItem value="production">Produção</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {field.value === "sandbox"
                          ? "Modo de testes - pagamentos não são reais"
                          : "Modo produção - pagamentos reais"}
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Mercado Pago Credentials */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5" />
                    Credenciais Mercado Pago
                  </CardTitle>
                  <CardDescription className="mt-1.5">
                    Configure suas chaves de integração do Mercado Pago
                  </CardDescription>
                </div>
                <Badge variant="outline" className={isConnected ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10" : ""}>
                  {isConnected ? (
                    <><CheckCircle2 className="h-3 w-3 mr-1" /> Conectado</>
                  ) : (
                    "Não configurado"
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {environment === "sandbox" && (
                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700">
                    Você está em <strong>modo Sandbox</strong>. Use credenciais de teste. Pagamentos não serão reais.
                  </AlertDescription>
                </Alert>
              )}

              {environment === "production" && mpAccessToken?.startsWith("TEST-") && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    <strong>Atenção!</strong> Você está em modo <strong>Produção</strong> mas está usando credenciais de <strong>TESTE</strong> (prefixo TEST-). PIX e boletos gerados NÃO funcionarão para pagamentos reais. Use credenciais de produção do Mercado Pago.
                  </AlertDescription>
                </Alert>
              )}

              {environment === "production" && !mpAccessToken?.startsWith("TEST-") && (
                <Alert className="border-emerald-500/30 bg-emerald-500/10">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-700">
                    Você está em <strong>modo Produção</strong>. Pagamentos serão processados com valores reais.
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="mp_public_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public Key</FormLabel>
                    <FormControl>
                      <Input placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" {...field} />
                    </FormControl>
                    <FormDescription>
                      Chave pública usada no frontend para tokenização de cartões
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mp_access_token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Token</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showAccessToken ? "text" : "password"} placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" {...field} className="pr-10" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowAccessToken(!showAccessToken)}
                        >
                          {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Token secreto usado no backend para processar pagamentos. Nunca será exposto no frontend.
                    </FormDescription>
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <a
                  href="https://www.mercadopago.com.br/developers/panel/app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Obter credenciais no Mercado Pago Developers
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
              <CardDescription>Habilite ou desabilite os métodos disponíveis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="pix_enabled"
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Smartphone className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <Label className="text-base font-medium">PIX</Label>
                        <p className="text-sm text-muted-foreground">
                          Pagamento instantâneo via QR Code
                        </p>
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="credit_card_enabled"
                render={({ field }) => (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-sky-500/10 rounded-lg">
                          <CreditCard className="h-6 w-6 text-sky-600" />
                        </div>
                        <div>
                          <Label className="text-base font-medium">Cartão de Crédito</Label>
                          <p className="text-sm text-muted-foreground">
                            Parcelamento em até {maxInstallments}x
                          </p>
                        </div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </div>
                    <Alert className="border-emerald-500/30 bg-emerald-500/10">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <AlertDescription className="text-emerald-700 text-sm space-y-2">
                        <p><strong>Cartão de Crédito integrado via MercadoPago.js SDK.</strong></p>
                        <p>Certifique-se de que a <strong>Public Key</strong> e o <strong>Access Token</strong> estejam configurados e sejam do <strong>MESMO ambiente</strong> (Sandbox ou Produção).</p>
                        <p>Os pagamentos serão depositados na conta vinculada ao seu Access Token do Mercado Pago.</p>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="boleto_enabled"
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <FileText className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <Label className="text-base font-medium">Boleto Bancário</Label>
                        <p className="text-sm text-muted-foreground">
                          Vencimento em 3 dias úteis
                        </p>
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Installments & Interest */}
          <Card>
            <CardHeader>
              <CardTitle>Parcelamento</CardTitle>
              <CardDescription>Configure as opções de parcelamento no cartão</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="max_installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número Máximo de Parcelas</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(parseInt(v))}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n}x
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="min_installment_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Mínimo da Parcela (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Interest Type */}
              <FormField
                control={form.control}
                name="installment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Parcelamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sem_juros">Sem Juros (lojista absorve)</SelectItem>
                        <SelectItem value="com_juros">Com Juros (cliente paga)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value === "sem_juros"
                        ? "O valor da parcela é fixo (preço ÷ parcelas). O lojista absorve o custo."
                        : "O juros é aplicado ao cliente. O valor final aumenta conforme o número de parcelas."}
                    </FormDescription>
                  </FormItem>
                )}
              />

              {installmentType === "com_juros" && (
                <FormField
                  control={form.control}
                  name="installment_interest_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa de Juros Mensal (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Taxa mensal aplicada (Tabela Price). Ex: 1.99% ao mês.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              )}

              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium mb-3">
                  Preview para compra de {formatCurrency(exampleValue)}
                  {installmentType === "com_juros" && ` (juros de ${interestRate}% a.m.)`}:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {calculateInstallments().map(({ count, value, total }) => (
                    <div
                      key={count}
                      className="text-center p-2 bg-background rounded border"
                    >
                      <p className="font-medium">{count}x</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(value)}
                      </p>
                      {installmentType === "com_juros" && count > 1 && (
                        <p className="text-[10px] text-muted-foreground/70">
                          Total: {formatCurrency(total)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MP Fees */}
          <Card>
            <CardHeader>
              <CardTitle>Taxas do Mercado Pago</CardTitle>
              <CardDescription>Taxas fixas cobradas pelo Mercado Pago sobre cada transação (para cálculo de líquido)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="mp_fee_pix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa PIX (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormDescription>Padrão MP: 0,99%</FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mp_fee_credit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa Cartão (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormDescription>Padrão MP: 4,98%</FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mp_fee_boleto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa Boleto (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormDescription>Padrão MP: R$ 3,49</FormDescription>
                    </FormItem>
                  )}
                />
              </div>

              {Number(exampleValue) > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-medium text-sm mb-2">Preview de Líquido (preço: {formatCurrency(exampleValue)})</p>
                  <p>PIX: {formatCurrency(exampleValue * (1 - feePix / 100))}</p>
                  <p>Cartão: {formatCurrency(exampleValue * (1 - feeCredit / 100))}</p>
                  <p>Boleto: {formatCurrency(exampleValue - feeBoleto)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Timeout */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Expiração de Pagamentos Pendentes
              </CardTitle>
              <CardDescription>
                Defina o tempo máximo de espera para compensação de pagamentos. Pedidos que ultrapassarem o prazo serão cancelados automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="pix_timeout_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeout PIX (minutos)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={5}
                          max={1440}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 120)}
                        />
                      </FormControl>
                      <FormDescription>
                        Padrão: 120 min (2h). Valores de 5 a 1440 min (24h).
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="boleto_timeout_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeout Boleto (horas)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={168}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 72)}
                        />
                      </FormControl>
                      <FormDescription>
                        Padrão: 72h (3 dias). Valores de 1 a 168h (7 dias).
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>

              <Alert className="border-muted">
                <Clock className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Pedidos com PIX expiram após <strong>{form.watch("pix_timeout_minutes")} minutos</strong> e com Boleto após <strong>{form.watch("boleto_timeout_hours")} horas</strong>. A verificação é executada automaticamente ou pode ser disparada manualmente abaixo.
                </AlertDescription>
              </Alert>

              <Button
                type="button"
                variant="outline"
                disabled={isExpiring}
                onClick={async () => {
                  setIsExpiring(true);
                  try {
                    const { data, error } = await supabase.functions.invoke("expire-pending-payments");
                    if (error) throw error;
                    if (data?.expired > 0) {
                      toast.success(`${data.expired} pedido(s) expirado(s) e cancelado(s)`);
                    } else {
                      toast.info("Nenhum pedido pendente expirado encontrado");
                    }
                  } catch (err: any) {
                    toast.error("Erro ao verificar pagamentos: " + err.message);
                  } finally {
                    setIsExpiring(false);
                  }
                }}
              >
                {isExpiring ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
                Verificar Pagamentos Expirados Agora
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end sticky bottom-0 bg-muted/30 py-4 -mx-1 px-1">
            <Button type="submit" disabled={updateSettings.isPending || !isDirty}>
              <Save className="h-4 w-4 mr-2" />
              {updateSettings.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
