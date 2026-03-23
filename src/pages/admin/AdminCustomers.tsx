import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Ban, CheckCircle, MessageCircle, Users, Tag } from "lucide-react";
import { useCustomers, Customer } from "@/hooks/admin/useCustomers";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { SearchInput } from "@/components/admin/shared/SearchInput";
import { DataTable, Column } from "@/components/admin/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatWhatsAppLink } from "@/lib/whatsapp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function AdminCustomers() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [blockedFilter, setBlockedFilter] = useState<string>("all");

  const handleSearchChange = (val: string) => { setSearch(val); setPage(1); };
  const handleFilterChange = (val: string) => { setBlockedFilter(val); setPage(1); };

  const { customers, totalCount, isLoading } = useCustomers({
    page,
    pageSize: 20,
    search,
    blocked: blockedFilter === "all" ? null : blockedFilter === "blocked",
  });

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Cliente",
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-medium truncate">{row.full_name || "Sem nome"}</p>
          <p className="text-xs text-muted-foreground truncate">{row.email}</p>
          {row.tags && row.tags.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {row.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {tag}
                </Badge>
              ))}
              {row.tags.length > 2 && (
                <span className="text-[10px] text-muted-foreground">+{row.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Telefone",
      cell: (row) => (
        <span className="text-sm">{row.phone || "—"}</span>
      ),
    },
    {
      key: "orders",
      header: "Pedidos",
      cell: (row) => (
        <span className="font-medium">{row.order_count}</span>
      ),
      className: "text-center",
    },
    {
      key: "total_spent",
      header: "Total Gasto",
      cell: (row) => (
        <span className="font-medium">{formatCurrency(Number(row.total_spent))}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) =>
        row.blocked ? (
          <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
            Bloqueado
          </Badge>
        ) : (
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            Ativo
          </Badge>
        ),
    },
    {
      key: "contact",
      header: "",
      className: "w-12",
      cell: (row) => {
        const link = row.phone ? formatWhatsAppLink(row.phone) : null;
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
      key: "created_at",
      header: "Cadastro",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.created_at), "dd/MM/yyyy", { locale: ptBR })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/clientes/${row.id}`);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
      className: "w-12",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description={`${totalCount} cliente${totalCount !== 1 ? "s" : ""} cadastrado${totalCount !== 1 ? "s" : ""}`}
        icon={Users}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar por nome, email, telefone ou CPF..."
          className="w-full sm:max-w-sm"
        />

        <Select value={blockedFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                Ativos
              </span>
            </SelectItem>
            <SelectItem value="blocked">
              <span className="flex items-center gap-2">
                <Ban className="h-3.5 w-3.5 text-destructive" />
                Bloqueados
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        page={page}
        pageSize={20}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/admin/clientes/${row.id}`)}
        emptyMessage="Nenhum cliente encontrado"
      />
    </div>
  );
}
