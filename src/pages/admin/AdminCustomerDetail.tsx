import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  CreditCard,
  ShoppingBag,
  MapPin,
  Ban,
  CheckCircle,
  Edit,
  Package,
  MessageCircle,
} from "lucide-react";
import { useCustomers } from "@/hooks/admin/useCustomers";
import { LoadingState } from "@/components/admin/shared/LoadingState";
import { OrderStatusBadge } from "@/components/admin/orders/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlockCustomerDialog } from "@/components/admin/customers/BlockCustomerDialog";
import { CustomerEditDialog } from "@/components/admin/customers/CustomerEditDialog";
import { formatWhatsAppLink } from "@/lib/whatsapp";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function AdminCustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customerDetailQuery, customerAddressesQuery, customerOrdersQuery, blockCustomer, updateCustomer } = useCustomers();

  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: customer, isLoading } = customerDetailQuery(id!);
  const { data: addresses } = customerAddressesQuery(id!);
  const { data: orders } = customerOrdersQuery(id!);

  if (isLoading) return <LoadingState />;
  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Cliente não encontrado</p>
        <Button variant="link" asChild>
          <Link to="/admin/clientes">Voltar para lista</Link>
        </Button>
      </div>
    );
  }

  const handleBlock = async (reason: string) => {
    try {
      await blockCustomer.mutateAsync({
        id: customer.id,
        blocked: true,
        blocked_reason: reason,
      });
      setBlockDialogOpen(false);
    } catch {
      // Error handled by mutation's onError
    }
  };

  const handleUnblock = async () => {
    try {
      await blockCustomer.mutateAsync({
        id: customer.id,
        blocked: false,
      });
    } catch {
      // Error handled by mutation's onError
    }
  };

  const whatsappLink = customer.phone ? formatWhatsAppLink(customer.phone) : null;

  return (
    <div className="space-y-6">
      {/* Header — responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link to="/admin/clientes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{customer.full_name || "Sem nome"}</h1>
              {customer.blocked ? (
                <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">Bloqueado</Badge>
              ) : (
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">Ativo</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Cliente desde {format(new Date(customer.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {whatsappLink && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(whatsappLink, "_blank")}>
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
          {customer.blocked ? (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleUnblock} disabled={blockCustomer.isPending}>
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Desbloquear</span>
            </Button>
          ) : (
            <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setBlockDialogOpen(true)}>
              <Ban className="h-4 w-4" />
              <span className="hidden sm:inline">Bloquear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-full shrink-0">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold">{customer.order_count}</p>
                <p className="text-xs text-muted-foreground">Pedidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-full shrink-0">
                <CreditCard className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold truncate">{formatCurrency(Number(customer.total_spent))}</p>
                <p className="text-xs text-muted-foreground">Total Gasto</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-500/10 rounded-full shrink-0">
                <Package className="h-5 w-5 text-sky-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold truncate">
                  {customer.order_count > 0
                    ? formatCurrency(Number(customer.total_spent) / customer.order_count)
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-500/10 rounded-full shrink-0">
                <User className="h-5 w-5 text-violet-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold">
                  {customer.last_order_at
                    ? format(new Date(customer.last_order_at), "dd/MM/yy")
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Último Pedido</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {customer.blocked && customer.blocked_reason && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-3">
              <Ban className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-destructive text-sm">Motivo do bloqueio</p>
                <p className="text-sm text-muted-foreground">{customer.blocked_reason}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="orders">Pedidos ({orders?.length || 0})</TabsTrigger>
          <TabsTrigger value="addresses">Endereços ({addresses?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium text-sm truncate">{customer.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="font-medium text-sm">{customer.phone || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">CPF</p>
                    <p className="font-medium text-sm">{customer.cpf || "—"}</p>
                  </div>
                </div>
              </div>

              {customer.tags && customer.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {customer.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {customer.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Notas Internas</p>
                    <p className="text-sm">{customer.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              {orders && orders.length > 0 ? (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/admin/pedidos/${order.id}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-mono font-medium text-sm">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <OrderStatusBadge status={order.status} />
                        <span className="font-semibold text-sm">{formatCurrency(Number(order.total))}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  Nenhum pedido encontrado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Endereços Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              {addresses && addresses.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="p-3 border rounded-lg space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {address.label || "Endereço"}
                          </span>
                        </div>
                        {address.is_default && (
                          <Badge variant="secondary" className="text-[10px]">Padrão</Badge>
                        )}
                      </div>
                      <p className="text-sm">
                        {address.street}, {address.number}
                        {address.complement && ` - ${address.complement}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {address.neighborhood} • {address.city}/{address.state}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">
                        CEP: {address.zip_code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Destinatário: {address.recipient_name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  Nenhum endereço cadastrado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BlockCustomerDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        onConfirm={handleBlock}
        isLoading={blockCustomer.isPending}
      />

      <CustomerEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        customer={customer}
        updateCustomer={updateCustomer}
      />
    </div>
  );
}
