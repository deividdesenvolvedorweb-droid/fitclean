import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Package, User, LogOut, MapPin, ChevronDown, ChevronUp, CreditCard, Truck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const statusLabels: Record<string, string> = {
  pending_payment: "Aguardando Pagamento",
  paid: "Pago",
  processing: "Processando",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
  refunded: "Reembolsado",
};

const statusColors: Record<string, string> = {
  pending_payment: "bg-warning/10 text-warning border-warning/20",
  paid: "bg-success/10 text-success border-success/20",
  processing: "bg-primary/10 text-primary border-primary/20",
  shipped: "bg-accent/10 text-accent border-accent/20",
  delivered: "bg-success/10 text-success border-success/20",
  canceled: "bg-destructive/10 text-destructive border-destructive/20",
  refunded: "bg-muted text-muted-foreground border-border",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  chargeback: "Chargeback",
};

const paymentMethodLabels: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão de Crédito",
  boleto: "Boleto Bancário",
};

export default function CustomerAccount() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { customer, address, isLoading } = useCustomerAuth();
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) {
      navigate("/conta/login", { replace: true });
    }
  }, [user, loading, navigate]);

  const ordersQuery = useQuery({
    queryKey: ["customer-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const toggleOrder = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartDrawer />
      <main className="flex-grow container-shop py-6 sm:py-8 lg:py-12 space-y-5 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">Minha Conta</h1>
          <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-xl text-sm">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          <Card className="border-border/50 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" /> Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <p><span className="text-muted-foreground">Nome:</span> {customer?.full_name || user?.user_metadata?.full_name || "—"}</p>
              <p><span className="text-muted-foreground">Email:</span> {user?.email}</p>
              <p><span className="text-muted-foreground">Telefone:</span> {customer?.phone || "—"}</p>
              <p><span className="text-muted-foreground">CPF:</span> {customer?.cpf || "—"}</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" /> Endereço Principal
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {address ? (
                <div className="space-y-1">
                  <p>{address.street}, {address.number} {address.complement && `- ${address.complement}`}</p>
                  <p>{address.neighborhood} - {address.city}/{address.state}</p>
                  <p className="text-muted-foreground">CEP: {address.zip_code}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum endereço cadastrado</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Orders */}
        <Card className="border-border/50 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" /> Meus Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ordersQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : ordersQuery.data && ordersQuery.data.length > 0 ? (
              <div className="space-y-3">
                {ordersQuery.data.map((order) => {
                  const isExpanded = expandedOrders.has(order.id);
                  const shippingAddr = order.shipping_address as Record<string, string> | null;
                  const orderItems = (order as any).order_items || [];

                  return (
                    <div key={order.id} className="border border-border/50 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleOrder(order.id)}
                        className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-muted/30 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            <p className="font-semibold text-sm">{order.order_number}</p>
                            <Badge variant="outline" className={`${statusColors[order.status] || ""} text-[10px] sm:text-xs rounded-lg`}>
                              {statusLabels[order.status] || order.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(order.created_at)} • {orderItems.length} item(ns) • {formatCurrency(order.total)}
                          </p>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border/50 px-3 sm:px-4 pb-4 space-y-4">
                          <div className="pt-3">
                            <p className="text-xs font-medium mb-2 flex items-center gap-1 text-muted-foreground">
                              <Package className="h-3.5 w-3.5" /> Itens
                            </p>
                            <div className="space-y-1.5">
                              {orderItems.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-start text-xs sm:text-sm py-1.5 border-b border-dashed border-border/50 last:border-0 gap-2">
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium">{item.product_name}</span>
                                    {item.variant_attributes && (
                                      <span className="text-[10px] text-muted-foreground ml-1">
                                        ({Object.entries(item.variant_attributes as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(", ")})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-right text-muted-foreground flex-shrink-0">
                                    {item.quantity}x {formatCurrency(item.unit_price)} = <span className="font-medium text-foreground">{formatCurrency(item.total_price)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Separator />

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1 text-xs sm:text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatCurrency(order.subtotal)}</span>
                              </div>
                              {order.discount > 0 && (
                                <div className="flex justify-between text-success">
                                  <span>Desconto</span>
                                  <span>-{formatCurrency(order.discount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Frete</span>
                                <span>{order.shipping_cost === 0 ? "Grátis" : formatCurrency(order.shipping_cost)}</span>
                              </div>
                              <Separator />
                              <div className="flex justify-between font-bold">
                                <span>Total</span>
                                <span>{formatCurrency(order.total)}</span>
                              </div>
                            </div>

                            <div className="space-y-2 text-xs sm:text-sm">
                              <p className="font-medium flex items-center gap-1 text-muted-foreground">
                                <CreditCard className="h-3.5 w-3.5" /> Pagamento
                              </p>
                              {order.payment_method && (
                                <p className="text-muted-foreground">
                                  {paymentMethodLabels[order.payment_method] || order.payment_method} • {paymentStatusLabels[order.payment_status] || order.payment_status}
                                </p>
                              )}

                              {shippingAddr && (
                                <div className="pt-1">
                                  <p className="font-medium flex items-center gap-1 text-muted-foreground">
                                    <Truck className="h-3.5 w-3.5" /> Entrega
                                  </p>
                                  <p className="text-muted-foreground">
                                    {shippingAddr.street}, {shippingAddr.number}
                                    {shippingAddr.complement && ` - ${shippingAddr.complement}`} — {shippingAddr.city}/{shippingAddr.state}
                                  </p>
                                </div>
                              )}

                              {order.tracking_code && (
                                <p className="text-muted-foreground">
                                  Rastreio: <span className="font-mono text-foreground">{order.tracking_code}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">Você ainda não fez nenhum pedido</p>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
