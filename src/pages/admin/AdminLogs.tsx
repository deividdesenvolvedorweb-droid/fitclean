import { useState } from "react";
import { ClipboardList, Eye, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { LoadingState } from "@/components/admin/shared/LoadingState";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { SearchInput } from "@/components/admin/shared/SearchInput";
import { DataTable, Column } from "@/components/admin/shared/DataTable";
import { useAuditLogs, AuditLog } from "@/hooks/admin/useAuditLogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const actionConfig: Record<string, { label: string; className: string }> = {
  create: { label: "Criação", className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600" },
  update: { label: "Atualização", className: "border-sky-500/20 bg-sky-500/10 text-sky-600" },
  delete: { label: "Exclusão", className: "border-destructive/20 bg-destructive/10 text-destructive" },
  block: { label: "Bloqueio", className: "border-amber-500/20 bg-amber-500/10 text-amber-600" },
  unblock: { label: "Desbloqueio", className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600" },
  add_role: { label: "Adicionar Acesso", className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600" },
  update_role: { label: "Alterar Permissão", className: "border-sky-500/20 bg-sky-500/10 text-sky-600" },
  remove_role: { label: "Remover Acesso", className: "border-destructive/20 bg-destructive/10 text-destructive" },
};

const entityConfig: Record<string, string> = {
  product: "Produto",
  products: "Produto",
  category: "Categoria",
  categories: "Categoria",
  order: "Pedido",
  orders: "Pedido",
  customer: "Cliente",
  customers: "Cliente",
  coupon: "Cupom",
  coupons: "Cupom",
  banner: "Banner",
  banners: "Banner",
  shipping_rule: "Regra de Frete",
  shipping_rules: "Regra de Frete",
  store_settings: "Configurações",
  user_roles: "Usuários Admin",
  filter: "Filtro",
  search_filters: "Filtro",
  theme_settings: "Tema",
  payment_settings: "Pagamentos",
  home_blocks: "Layout",
};

const entities = [
  { value: "all", label: "Todas as entidades" },
  ...Object.entries(entityConfig).map(([value, label]) => ({ value, label })),
];

const actions = [
  { value: "all", label: "Todas as ações" },
  ...Object.entries(actionConfig).map(([value, { label }]) => ({ value, label })),
];

function formatEntityName(entity: string): string {
  return entityConfig[entity] || entity.split("_").join(" ");
}

function LogDetailDialog({
  log,
  open,
  onOpenChange,
}: {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes do Log
            {actionConfig[log.action] && (
              <Badge variant="outline" className={`ml-2 ${actionConfig[log.action].className}`}>
                {actionConfig[log.action].label}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Data/Hora</p>
              <p className="font-medium">
                {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Usuário</p>
              <p className="font-medium">{log.user_email || "Sistema"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Entidade</p>
              <p className="font-medium">{formatEntityName(log.entity)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ID da Entidade</p>
              {log.entity_id ? (
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{log.entity_id}</code>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          </div>

          <Separator />

          {log.before_data && (
            <div>
              <p className="text-sm font-medium mb-2">Dados Anteriores</p>
              <ScrollArea className="h-40 rounded border bg-muted/50 p-3">
                <pre className="text-xs whitespace-pre-wrap break-all">{JSON.stringify(log.before_data, null, 2)}</pre>
              </ScrollArea>
            </div>
          )}

          {log.after_data && (
            <div>
              <p className="text-sm font-medium mb-2">Dados Atualizados</p>
              <ScrollArea className="h-40 rounded border bg-muted/50 p-3">
                <pre className="text-xs whitespace-pre-wrap break-all">{JSON.stringify(log.after_data, null, 2)}</pre>
              </ScrollArea>
            </div>
          )}

          {!log.before_data && !log.after_data && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado registrado para este log.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data, isLoading } = useAuditLogs({
    page,
    pageSize: 20,
    entity: entityFilter !== "all" ? entityFilter : undefined,
    action: actionFilter !== "all" ? actionFilter : undefined,
    search: search || undefined,
  });

  const hasActiveFilters = entityFilter !== "all" || actionFilter !== "all" || !!search;

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleEntityChange = (val: string) => {
    setEntityFilter(val);
    setPage(1);
  };

  const handleActionChange = (val: string) => {
    setActionFilter(val);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setEntityFilter("all");
    setActionFilter("all");
    setPage(1);
  };

  const columns: Column<AuditLog>[] = [
    {
      key: "created_at",
      header: "Data/Hora",
      cell: (row) => (
        <div className="text-sm">
          <p className="font-medium">
            {format(new Date(row.created_at), "dd/MM/yyyy", { locale: ptBR })}
          </p>
          <p className="text-muted-foreground">
            {format(new Date(row.created_at), "HH:mm:ss")}
          </p>
        </div>
      ),
    },
    {
      key: "user_email",
      header: "Usuário",
      cell: (row) => (
        <span className="text-sm">{row.user_email || "Sistema"}</span>
      ),
    },
    {
      key: "action",
      header: "Ação",
      cell: (row) => {
        const config = actionConfig[row.action] || { label: row.action, className: "bg-muted text-muted-foreground" };
        return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
      },
    },
    {
      key: "entity",
      header: "Entidade",
      cell: (row) => (
        <Badge variant="outline">{formatEntityName(row.entity)}</Badge>
      ),
    },
    {
      key: "entity_id",
      header: "ID",
      cell: (row) =>
        row.entity_id ? (
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
            {row.entity_id.slice(0, 8)}…
          </code>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
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
          onClick={() => setSelectedLog(row)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logs de Auditoria"
        description={`Histórico de ações realizadas no sistema${data?.totalCount ? ` • ${data.totalCount} registros` : ""}`}
        icon={ClipboardList}
      />

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar por e-mail ou ID..."
          className="w-full sm:max-w-xs"
        />
        <Select value={entityFilter} onValueChange={handleEntityChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Entidade" />
          </SelectTrigger>
          <SelectContent>
            {entities.map((e) => (
              <SelectItem key={e.value} value={e.value}>
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={handleActionChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            {actions.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" />
            Limpar
          </Button>
        )}
      </div>

      {!data?.logs.length ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhum log encontrado"
          description={hasActiveFilters ? "Tente ajustar os filtros de busca" : "Os logs de ações aparecerão aqui conforme o sistema for utilizado"}
        />
      ) : (
        <DataTable
          columns={columns}
          data={data.logs}
          page={page}
          pageSize={20}
          totalCount={data.totalCount}
          onPageChange={setPage}
        />
      )}

      <LogDetailDialog
        log={selectedLog}
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      />
    </div>
  );
}
