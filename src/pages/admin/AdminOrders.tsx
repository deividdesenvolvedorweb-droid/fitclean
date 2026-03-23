import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Eye, MessageCircle, Clock, CreditCard, Truck, CheckCircle2, XCircle, RotateCcw, Banknote } from "lucide-react";
import { useOrders, OrderFilters } from "@/hooks/admin/useOrders";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { SearchInput } from "@/components/admin/shared/SearchInput";
import { DataTable, Column } from "@/components/admin/shared/DataTable";
import { OrderStatusBadge } from "@/components/admin/orders/OrderStatusBadge";
import { PaymentStatusBadge } from "@/components/admin/orders/PaymentStatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Order } from "@/hooks/admin/useOrders";
import type { OrderStatus, PaymentStatus, PaymentMethod } from "@/types/admin";
import { getPaymentMethodLabel } from "@/types/admin";
import { formatWhatsAppLink } from "@/lib/whatsapp";

type QuickFilter = "all" | "pending_payment" | "paid" | "processing" | "shipped" | "delivered" | "canceled";

export default function AdminOrders() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");

  const { orders, totalCount, isLoading } = useOrders({
    page,
    pageSize: 20,
    filters,
  });

  const handleSearch = (search: string) => {
    setFilters((f) => ({ ...f, search }));
    setPage(1);
  };

  const handleQuickFilter = (qf: QuickFilter) => {
    setQuickFilter(qf);
    setPage(1);
    setFilters((f) => ({
      ...f,
      status: qf === "all" ? undefined : (qf as OrderStatus),
    }));
  };

  const handlePaymentFilter = (paymentStatus: string) => {
    setFilters((f) => ({
      ...f,
      paymentStatus: paymentStatus === "all" ? undefined : (paymentStatus as PaymentStatus),
    }));
    setPage(1);
  };

  const handleMethodFilter = (method: string) => {
    setFilters((f) => ({
      ...f,
      paymentMethod: method === "all" ? undefined : (method as PaymentMethod),
    }));
    setPage(1);
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const quickFilters: { key: QuickFilter; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "Todos", icon: <ShoppingCart className="h-3.5 w-3.5" /> },
    { key: "pending_payment", label: "Pendentes", icon: <Clock className="h-3.5 w-3.5" /> },
    { key: "paid", label: "Pagos", icon: <Banknote className="h-3.5 w-3.5" /> },
    { key: "processing", label: "Processando", icon: <RotateCcw className="h-3.5 w-3.5" /> },
    { key: "shipped", label: "Enviados", icon: <Truck className="h-3.5 w-3.5" /> },
    { key: "delivered", label: "Entregues", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    { key: "canceled", label: "Cancelados", icon: <XCircle className="h-3.5 w-3.5" /> },
  ];

  const columns: Column<Order>[] = [
    {
      key: "order_number",
      header: "Pedido",
      cell: (row) => (
        <span className="font-mono font-medium text-sm">{row.order_number}</span>
      ),
    },
    {
      key: "customer",
      header: "Cliente",
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-medium truncate max-w-[180px]">
            {row.customers?.full_name || "Anônimo"}
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
            {row.customers?.email}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <OrderStatusBadge status={row.status} />,
    },
    {
      key: "payment",
      header: "Pagamento",
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <PaymentStatusBadge status={row.payment_status} />
          {row.payment_method && (
            <span className="text-[10px] text-muted-foreground">
              {getPaymentMethodLabel(row.payment_method)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "total",
      header: "Total",
      cell: (row) => (
        <div>
          <span className="font-semibold">{formatPrice(row.total)}</span>
          {row.discount > 0 && (
            <p className="text-[10px] text-muted-foreground">
              -{formatPrice(row.discount)} desc.
            </p>
          )}
        </div>
      ),
    },
    {
      key: "date",
      header: "Data",
      cell: (row) => (
        <div className="text-sm text-muted-foreground">
          <p>{format(new Date(row.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
          <p className="text-xs">{format(new Date(row.created_at), "HH:mm", { locale: ptBR })}</p>
        </div>
      ),
    },
    {
      key: "contact",
      header: "",
      className: "w-12",
      cell: (row) => {
        const phone = row.customers?.phone;
        const link = phone ? formatWhatsAppLink(phone) : null;
        return link ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              window.open(link, "_blank");
            }}
            title="WhatsApp"
          >
            <MessageCircle className="h-4 w-4 text-emerald-600" />
          </Button>
        ) : null;
      },
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/pedidos/${row.id}`);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        description={`${totalCount} pedido${totalCount !== 1 ? "s" : ""} no total`}
        icon={ShoppingCart}
      />

      {/* Quick status filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {quickFilters.map((qf) => (
          <Button
            key={qf.key}
            variant={quickFilter === qf.key ? "default" : "outline"}
            size="sm"
            className="gap-1.5 text-xs shrink-0"
            onClick={() => handleQuickFilter(qf.key)}
          >
            {qf.icon}
            {qf.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <SearchInput
          value={filters.search || ""}
          onChange={handleSearch}
          placeholder="Buscar por número, cliente..."
          className="w-full sm:max-w-sm"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={filters.paymentStatus || "all"}
            onValueChange={handlePaymentFilter}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Pagamento</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
              <SelectItem value="chargeback">Chargeback</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.paymentMethod || "all"}
            onValueChange={handleMethodFilter}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Método" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Método</SelectItem>
              <SelectItem value="pix">Pix</SelectItem>
              <SelectItem value="credit_card">Cartão</SelectItem>
              <SelectItem value="boleto">Boleto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        emptyMessage="Nenhum pedido encontrado"
        page={page}
        pageSize={20}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/admin/pedidos/${row.id}`)}
      />
    </div>
  );
}
