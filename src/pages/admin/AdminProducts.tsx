import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Plus, Pencil, Trash2, Eye, EyeOff, Star, AlertTriangle, Tag, Infinity, FileSpreadsheet } from "lucide-react";
import { ProductImportDialog } from "@/components/admin/products/ProductImportDialog";
import { useProducts, Product, ProductFilters } from "@/hooks/admin/useProducts";
import { useQueryClient } from "@tanstack/react-query";
import { useCategories } from "@/hooks/admin/useCategories";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { SearchInput } from "@/components/admin/shared/SearchInput";
import { DataTable, Column } from "@/components/admin/shared/DataTable";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type QuickFilter = "all" | "low_stock" | "on_sale" | "featured" | "inactive";

export default function AdminProducts() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const { products, totalCount, isLoading, deleteProduct, updateProduct, isDeleting } =
    useProducts({ page, pageSize: 20, filters });
  const { categories } = useCategories();
  const queryClient = useQueryClient();

  const handleSearch = (search: string) => {
    setFilters((f) => ({ ...f, search }));
    setPage(1);
  };

  const handleCategoryFilter = (categoryId: string) => {
    setFilters((f) => ({
      ...f,
      categoryId: categoryId === "all" ? undefined : categoryId,
    }));
    setPage(1);
  };

  const handleQuickFilter = (qf: QuickFilter) => {
    setQuickFilter(qf);
    setPage(1);
    switch (qf) {
      case "low_stock":
        setFilters((f) => ({ ...f, active: undefined, featured: undefined, lowStock: true, onSale: undefined }));
        break;
      case "on_sale":
        setFilters((f) => ({ ...f, active: undefined, featured: undefined, lowStock: undefined, onSale: true }));
        break;
      case "featured":
        setFilters((f) => ({ ...f, active: undefined, featured: true, lowStock: undefined, onSale: undefined }));
        break;
      case "inactive":
        setFilters((f) => ({ ...f, active: false, featured: undefined, lowStock: undefined, onSale: undefined }));
        break;
      default:
        setFilters((f) => ({ ...f, active: undefined, featured: undefined, lowStock: undefined, onSale: undefined }));
    }
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete.id);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleToggleActive = async (product: Product) => {
    await updateProduct({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      active: !product.active,
    });
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const quickFilters: { key: QuickFilter; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "Todos", icon: <Package className="h-3.5 w-3.5" /> },
    { key: "low_stock", label: "Baixo Estoque", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    { key: "on_sale", label: "Em Promoção", icon: <Tag className="h-3.5 w-3.5" /> },
    { key: "featured", label: "Destaques", icon: <Star className="h-3.5 w-3.5" /> },
    { key: "inactive", label: "Inativos", icon: <EyeOff className="h-3.5 w-3.5" /> },
  ];

  const columns: Column<Product>[] = [
    {
      key: "image",
      header: "",
      className: "w-16",
      cell: (row) => (
        <div className="h-12 w-12 rounded-md bg-muted overflow-hidden shrink-0">
          {row.images?.[row.main_image_index || 0] ? (
            <img
              src={row.images[row.main_image_index || 0]}
              alt={row.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: "name",
      header: "Produto",
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-medium truncate max-w-[280px]">{row.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {row.sku && (
              <span className="text-xs text-muted-foreground">SKU: {row.sku}</span>
            )}
            {row.free_shipping && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-emerald-500/30 text-emerald-600">
                Frete Grátis
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Preço",
      cell: (row) => (
        <div>
          {row.compare_at_price && row.compare_at_price > row.price && (
            <p className="text-xs text-muted-foreground line-through">
              {formatPrice(row.compare_at_price)}
            </p>
          )}
          <p className="font-semibold">{formatPrice(row.price)}</p>
          {row.cost != null && row.cost > 0 && (
            <p className="text-[10px] text-muted-foreground">
              Margem: {((1 - row.cost / row.price) * 100).toFixed(0)}%
            </p>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Estoque",
      cell: (row) => {
        if (row.unlimited_stock) {
          return (
            <Badge variant="secondary" className="gap-1">
              <Infinity className="h-3 w-3" /> Ilimitado
            </Badge>
          );
        }
        const isLow = row.stock <= row.min_stock;
        const isOut = row.stock === 0;
        return (
          <Badge
            variant={isOut ? "destructive" : isLow ? "outline" : "secondary"}
            className={cn(
              isOut && "bg-destructive/10 text-destructive border-destructive/20",
              isLow && !isOut && "border-amber-500/30 text-amber-600 bg-amber-500/10"
            )}
          >
            {isOut ? "Esgotado" : `${row.stock} un`}
          </Badge>
        );
      },
    },
    {
      key: "category",
      header: "Categoria",
      cell: (row) => (
        <span className="text-sm text-muted-foreground truncate block max-w-[120px]">
          {row.categories?.name || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {row.active ? (
            <Badge variant="default" className="bg-primary/10 text-primary border border-primary/20">
              Ativo
            </Badge>
          ) : (
            <Badge variant="secondary">Inativo</Badge>
          )}
          {row.featured && (
            <Badge variant="outline" className="border-amber-500/30 text-amber-600 gap-1">
              <Star className="h-3 w-3 fill-current" />
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-28",
      cell: (row) => (
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(row);
            }}
            title={row.active ? "Desativar" : "Ativar"}
          >
            {row.active ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/produtos/${row.id}`);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos"
        description={`${totalCount} produto${totalCount !== 1 ? "s" : ""} cadastrado${totalCount !== 1 ? "s" : ""}`}
        icon={Package}
        actionLabel="Novo Produto"
        actionIcon={Plus}
        onAction={() => navigate("/admin/produtos/novo")}
      />

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setImportDialogOpen(true)}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Importar Planilha
        </Button>
      </div>

      {/* Quick filters */}
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
          placeholder="Buscar por nome ou SKU..."
          className="w-full sm:max-w-sm"
        />

        <Select
          value={filters.categoryId || "all"}
          onValueChange={handleCategoryFilter}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        emptyMessage="Nenhum produto encontrado"
        page={page}
        pageSize={20}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/admin/produtos/${row.id}`)}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Produto"
        description={`Tem certeza que deseja excluir "${productToDelete?.name}"? Pedidos existentes que contenham este produto não serão afetados, mas o produto será removido do catálogo permanentemente.`}
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={isDeleting}
      />

      <ProductImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
        }}
      />
    </div>
  );
}
