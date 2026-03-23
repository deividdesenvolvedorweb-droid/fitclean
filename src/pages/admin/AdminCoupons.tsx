import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Edit, Trash2, Percent, DollarSign, Truck, Ticket, Copy } from "lucide-react";
import { useCoupons, Coupon, CouponType } from "@/hooks/admin/useCoupons";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { SearchInput } from "@/components/admin/shared/SearchInput";
import { DataTable, Column } from "@/components/admin/shared/DataTable";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { StatusToggle } from "@/components/admin/shared/StatusToggle";
import { CouponDialog } from "@/components/admin/coupons/CouponDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COUPON_TYPE_LABELS: Record<CouponType, string> = {
  percentage: "Porcentagem",
  fixed: "Valor Fixo",
  free_shipping: "Frete Grátis",
};

const COUPON_TYPE_ICONS: Record<CouponType, React.ElementType> = {
  percentage: Percent,
  fixed: DollarSign,
  free_shipping: Truck,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

type StatusInfo = { label: string; className: string };

function getCouponStatus(coupon: Coupon): StatusInfo {
  const now = new Date();
  if (!coupon.active)
    return { label: "Inativo", className: "bg-muted text-muted-foreground border-muted" };
  if (coupon.end_at && new Date(coupon.end_at) < now)
    return { label: "Expirado", className: "bg-destructive/10 text-destructive border-destructive/20" };
  if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit)
    return { label: "Esgotado", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
  if (coupon.start_at && new Date(coupon.start_at) > now)
    return { label: "Agendado", className: "bg-sky-500/10 text-sky-600 border-sky-500/20" };
  return { label: "Ativo", className: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400" };
}

export default function AdminCoupons() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { coupons, totalCount, isLoading, createCoupon, updateCoupon, deleteCoupon, toggleActive } = useCoupons({
    page,
    pageSize: 20,
    search,
    type: typeFilter === "all" ? null : (typeFilter as CouponType),
    active: activeFilter === "all" ? null : activeFilter === "active",
  });

  const handleSearchChange = (val: string) => { setSearch(val); setPage(1); };
  const handleTypeChange = (val: string) => { setTypeFilter(val); setPage(1); };
  const handleActiveChange = (val: string) => { setActiveFilter(val); setPage(1); };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingCoupon(null);
    setDialogOpen(true);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  const columns: Column<Coupon>[] = [
    {
      key: "code",
      header: "Código",
      cell: (row) => {
        const Icon = COUPON_TYPE_ICONS[row.type];
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-primary/10 shrink-0">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-sm">{row.code}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); copyCode(row.code); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Copiar código"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">{COUPON_TYPE_LABELS[row.type]}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "value",
      header: "Desconto",
      cell: (row) => {
        if (row.type === "percentage") {
          return (
            <div>
              <span className="font-semibold">{row.value}%</span>
              {row.max_discount && (
                <p className="text-[11px] text-muted-foreground">máx. {formatCurrency(Number(row.max_discount))}</p>
              )}
            </div>
          );
        }
        if (row.type === "fixed") return <span className="font-semibold">{formatCurrency(Number(row.value))}</span>;
        return <span className="font-semibold text-emerald-600">Frete Grátis</span>;
      },
    },
    {
      key: "min_cart",
      header: "Mín. Carrinho",
      cell: (row) => (
        <span className="text-sm">
          {row.min_cart_value ? formatCurrency(Number(row.min_cart_value)) : "—"}
        </span>
      ),
    },
    {
      key: "usage",
      header: "Uso",
      cell: (row) => (
        <div className="text-sm">
          <span className="font-medium">{row.used_count}</span>
          <span className="text-muted-foreground">
            {row.usage_limit ? ` / ${row.usage_limit}` : " / ∞"}
          </span>
        </div>
      ),
    },
    {
      key: "validity",
      header: "Validade",
      cell: (row) => {
        if (!row.start_at && !row.end_at) return <span className="text-sm text-muted-foreground">Sem limite</span>;
        return (
          <div className="text-xs space-y-0.5">
            {row.start_at && (
              <div>De: {format(new Date(row.start_at), "dd/MM/yy HH:mm", { locale: ptBR })}</div>
            )}
            {row.end_at && (
              <div>Até: {format(new Date(row.end_at), "dd/MM/yy HH:mm", { locale: ptBR })}</div>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        const status = getCouponStatus(row);
        return (
          <Badge variant="outline" className={status.className}>
            {status.label}
          </Badge>
        );
      },
    },
    {
      key: "active",
      header: "Ativo",
      cell: (row) => (
        <StatusToggle
          active={row.active}
          onToggle={(active) => toggleActive.mutate({ id: row.id, active })}
          disabled={toggleActive.isPending}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(row.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
      className: "w-24",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cupons"
        description={`${totalCount} cupom${totalCount !== 1 ? "ns" : ""} cadastrado${totalCount !== 1 ? "s" : ""}`}
        actionLabel="Novo Cupom"
        actionIcon={Plus}
        onAction={handleCreate}
        icon={Ticket}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar por código..."
          className="w-full sm:max-w-xs"
        />

        <Select value={typeFilter} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(COUPON_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={activeFilter} onValueChange={handleActiveChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={coupons}
        isLoading={isLoading}
        page={page}
        pageSize={20}
        totalCount={totalCount}
        onPageChange={setPage}
        emptyMessage="Nenhum cupom encontrado"
      />

      <CouponDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        coupon={editingCoupon}
        createCoupon={createCoupon}
        updateCoupon={updateCoupon}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Excluir Cupom"
        description="Tem certeza que deseja excluir este cupom? Esta ação não pode ser desfeita."
        onConfirm={() => {
          if (deleteId) {
            deleteCoupon.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        isLoading={deleteCoupon.isPending}
      />
    </div>
  );
}
