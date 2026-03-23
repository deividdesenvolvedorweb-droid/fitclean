import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  Truck,
  MapPin,
  CreditCard,
  FileText,
  Clock,
  Copy,
  MessageCircle,
  ExternalLink,
  User,
} from "lucide-react";
import { useOrder, useOrders } from "@/hooks/admin/useOrders";
import { LoadingState } from "@/components/admin/shared/LoadingState";
import { OrderStatusBadge } from "@/components/admin/orders/OrderStatusBadge";
import { PaymentStatusBadge } from "@/components/admin/orders/PaymentStatusBadge";
import { UpdateStatusDialog } from "@/components/admin/orders/UpdateStatusDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getMpPaymentStatusLabel,
  getMpPaymentStatusColor,
} from "@/types/admin";
import type { OrderStatus } from "@/types/admin";
import { formatWhatsAppLink } from "@/lib/whatsapp";

export default function AdminOrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: order, isLoading } = useOrder(id);
  const { updateStatus, updateNotes, isUpdatingStatus } = useOrders();

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [notesInitialized, setNotesInitialized] = useState(false);
  const [notesChanged, setNotesChanged] = useState(false);

  // Initialize internal notes from order data
  useEffect(() => {
    if (order && !notesInitialized) {
      setInternalNotes(order.internal_notes || "");
      setNotesInitialized(true);
    }
  }, [order, notesInitialized]);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleStatusUpdate = async (
    newStatus: OrderStatus,
    notes?: string,
    trackingCode?: string,
    carrier?: string
  ) => {
    if (!id) return;
    await updateStatus({ id, status: newStatus, notes, trackingCode, carrier });
    setStatusDialogOpen(false);
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    await updateNotes({ id, internalNotes });
    setNotesChanged(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  if (isLoading || !order) {
    return <LoadingState message="Carregando pedido..." />;
  }

  const shippingAddress = order.shipping_address as Record<string, string> | null;
  const statusHistory = order.order_status_history || [];
  const customerPhone = order.customers?.phone;
  const whatsappLink = customerPhone ? formatWhatsAppLink(customerPhone) : null;

  return (
    <div className="space-y-6">
      {/* Header — responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link to="/admin/pedidos">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold">{order.order_number}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>
        </div>

        <Button onClick={() => setStatusDialogOpen(true)} className="shrink-0 w-full sm:w-auto">
          Atualizar Status
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5" />
                Itens do Pedido ({order.order_items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.order_items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 sm:gap-4 rounded-lg border p-3"
                  >
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {item.product_id ? (
                            <Link
                              to={`/admin/produtos/${item.product_id}`}
                              className="font-medium hover:text-primary transition-colors line-clamp-1"
                            >
                              {item.product_name}
                            </Link>
                          ) : (
                            <p className="font-medium line-clamp-1">{item.product_name}</p>
                          )}
                          {item.product_sku && (
                            <p className="text-xs text-muted-foreground">
                              SKU: {item.product_sku}
                            </p>
                          )}
                          {item.variant_attributes && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {Object.entries(
                                item.variant_attributes as Record<string, string>
                              ).map(([key, value]) => (
                                <Badge key={key} variant="secondary" className="text-[10px]">
                                  {key}: {value}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} × {formatPrice(item.unit_price)}
                          </p>
                          <p className="font-semibold">
                            {formatPrice(item.total_price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Desconto {order.coupon_code && `(${order.coupon_code})`}</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frete</span>
                  <span>{order.shipping_cost === 0 ? "Grátis" : formatPrice(order.shipping_cost)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma alteração de status registrada.
                </p>
              ) : (
                <div className="space-y-4">
                  {statusHistory
                    .sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    )
                    .map((entry, idx) => (
                      <div key={entry.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5" />
                          {idx < statusHistory.length - 1 && (
                            <div className="w-px flex-1 bg-border" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-medium">
                            {entry.from_status
                              ? `${getOrderStatusLabel(entry.from_status)} → ${getOrderStatusLabel(entry.to_status)}`
                              : getOrderStatusLabel(entry.to_status)}
                          </p>
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {entry.notes}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(
                              new Date(entry.created_at),
                              "dd/MM/yyyy HH:mm",
                              { locale: ptBR }
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5" />
                Notas Internas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={internalNotes}
                onChange={(e) => {
                  setInternalNotes(e.target.value);
                  setNotesChanged(true);
                }}
                placeholder="Adicione notas internas sobre este pedido..."
                rows={4}
              />
              {notesChanged && (
                <Button onClick={handleSaveNotes} size="sm">
                  Salvar Notas
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">
                  {order.customers?.full_name || "Anônimo"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.customers?.email}
                </p>
                {customerPhone && (
                  <p className="text-sm text-muted-foreground">
                    {customerPhone}
                  </p>
                )}
                {order.customers?.cpf && (
                  <p className="text-xs text-muted-foreground mt-1">
                    CPF: {order.customers.cpf}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {order.customer_id && (
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                    <Link to={`/admin/clientes/${order.customer_id}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver Perfil
                    </Link>
                  </Button>
                )}
                {whatsappLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => window.open(whatsappLink, "_blank")}
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                    WhatsApp
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-5 w-5" />
                Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.tracking_code && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Código de Rastreio
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-medium text-sm">{order.tracking_code}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(order.tracking_code!, "Código de rastreio")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {order.carrier && (
                    <p className="text-sm text-muted-foreground">
                      {order.carrier}
                    </p>
                  )}
                </div>
              )}
              {shippingAddress ? (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <MapPin className="h-3 w-3" /> Endereço de Entrega
                  </p>
                  <p className="text-sm">
                    {shippingAddress.street}, {shippingAddress.number}
                    {shippingAddress.complement &&
                      ` - ${shippingAddress.complement}`}
                  </p>
                  <p className="text-sm">{shippingAddress.neighborhood}</p>
                  <p className="text-sm">
                    {shippingAddress.city} - {shippingAddress.state}
                  </p>
                  <p className="text-sm font-mono">{shippingAddress.zip_code}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Endereço não informado</p>
              )}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Custo do frete</span>
                <span className="text-sm font-medium">
                  {order.shipping_cost === 0 ? "Grátis" : formatPrice(order.shipping_cost)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5" />
                Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <PaymentStatusBadge status={order.payment_status} />
              </div>
              {order.mp_payment_status && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gateway</span>
                  <Badge className={getMpPaymentStatusColor(order.mp_payment_status)}>
                    {getMpPaymentStatusLabel(order.mp_payment_status, order.payment_method || undefined)}
                  </Badge>
                </div>
              )}
              {order.payment_method && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Método</span>
                  <span className="text-sm font-medium">
                    {getPaymentMethodLabel(order.payment_method)}
                  </span>
                </div>
              )}
              {order.coupon_code && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cupom</span>
                  <Badge variant="secondary">{order.coupon_code}</Badge>
                </div>
              )}
              {order.mp_payment_id && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ID MP</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono">{order.mp_payment_id}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(order.mp_payment_id!, "ID do pagamento")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              {/* Payment data details */}
              {order.payment_data && (() => {
                const pd = order.payment_data as Record<string, any>;
                return (
                  <div className="pt-2 border-t space-y-2">
                    {pd.qr_code && (
                      <div>
                        <p className="text-xs text-muted-foreground">QR Code PIX</p>
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-mono truncate flex-1">{pd.qr_code?.slice(0, 40)}...</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => copyToClipboard(pd.qr_code, "Código PIX")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {pd.boleto_url && (
                      <div>
                        <p className="text-xs text-muted-foreground">Boleto</p>
                        <a href={pd.boleto_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                          Abrir boleto ↗
                        </a>
                      </div>
                    )}
                    {pd.ticket_url && !pd.boleto_url && (
                      <div>
                        <p className="text-xs text-muted-foreground">Link de pagamento</p>
                        <a href={pd.ticket_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                          Abrir link ↗
                        </a>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>

      <UpdateStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        currentStatus={order.status}
        onUpdate={handleStatusUpdate}
        isLoading={isUpdatingStatus}
      />
    </div>
  );
}
