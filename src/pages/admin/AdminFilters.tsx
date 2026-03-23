import { useState } from "react";
import { Filter, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { useFilters, SearchFilter, FilterFormData } from "@/hooks/admin/useFilters";
import { useCategories } from "@/hooks/admin/useCategories";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { StatusToggle } from "@/components/admin/shared/StatusToggle";
import { LoadingState } from "@/components/admin/shared/LoadingState";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { FilterDialog } from "@/components/admin/filters/FilterDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FilterType } from "@/types/admin";

const FILTER_TYPE_LABELS: Record<FilterType, string> = {
  checkbox: "Múltipla escolha",
  radio: "Escolha única",
  slider: "Slider",
  range: "Intervalo",
  boolean: "Sim/Não",
};

export default function AdminFilters() {
  const {
    filters,
    isLoading,
    createFilter,
    updateFilter,
    deleteFilter,
    isCreating,
    isUpdating,
    isDeleting,
  } = useFilters();
  const { categories } = useCategories();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<SearchFilter | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filterToDelete, setFilterToDelete] = useState<SearchFilter | null>(null);

  const handleCreate = () => {
    setEditingFilter(null);
    setDialogOpen(true);
  };

  const handleEdit = (filter: SearchFilter) => {
    setEditingFilter(filter);
    setDialogOpen(true);
  };

  const handleDelete = (filter: SearchFilter) => {
    setFilterToDelete(filter);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (filterToDelete) {
      await deleteFilter(filterToDelete.id);
      setDeleteDialogOpen(false);
      setFilterToDelete(null);
    }
  };

  const handleSave = async (data: FilterFormData) => {
    if (editingFilter) {
      await updateFilter({ id: editingFilter.id, ...data });
    } else {
      await createFilter(data);
    }
    setDialogOpen(false);
    setEditingFilter(null);
  };

  const handleToggleActive = async (filter: SearchFilter, active: boolean) => {
    await updateFilter({
      id: filter.id,
      name: filter.name,
      slug: filter.slug,
      type: filter.type,
      source: filter.source,
      active,
    });
  };

  const getCategoryNames = (categoryIds: string[] | null) => {
    if (!categoryIds || categoryIds.length === 0) return "Todas";
    return categoryIds
      .map((id) => categories.find((c) => c.id === id)?.name || id)
      .join(", ");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Filtros de Busca"
          description="Gerencie os filtros da loja"
          icon={Filter}
        />
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Filtros de Busca"
        description={`${filters.length} filtro${filters.length !== 1 ? "s" : ""} configurado${filters.length !== 1 ? "s" : ""}`}
        icon={Filter}
        actionLabel="Novo Filtro"
        actionIcon={Plus}
        onAction={handleCreate}
      />

      {filters.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="Nenhum filtro criado"
          description="Crie filtros para ajudar os clientes a encontrar produtos."
          actionLabel="Novo Filtro"
          onAction={handleCreate}
        />
      ) : (
        <div className="space-y-2">
          {filters.map((filter) => (
            <div
              key={filter.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab hidden sm:block shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium">{filter.name}</span>
                  <Badge variant="secondary" className="text-[11px]">
                    {FILTER_TYPE_LABELS[filter.type]}
                  </Badge>
                  {!filter.active && (
                    <Badge variant="outline" className="text-[11px] bg-muted text-muted-foreground">
                      Inativo
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>
                    Fonte: <span className="font-medium">{filter.source}</span>
                    {filter.source_key && (
                      <span className="font-mono text-foreground/70"> → {filter.source_key}</span>
                    )}
                  </p>
                  <p>
                    Categorias:{" "}
                    <span className="font-medium">
                      {getCategoryNames(filter.category_ids)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                <StatusToggle
                  active={filter.active}
                  onToggle={(active) => handleToggleActive(filter, active)}
                  showLabel={false}
                />

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(filter)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(filter)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FilterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        filter={editingFilter}
        categories={categories}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Filtro"
        description={`Tem certeza que deseja excluir "${filterToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
