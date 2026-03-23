import { useState, useMemo } from "react";
import { FolderTree, Plus, Pencil, Trash2, ChevronRight, ChevronDown, Package } from "lucide-react";
import { useCategories, Category, CategoryFormData } from "@/hooks/admin/useCategories";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { SearchInput } from "@/components/admin/shared/SearchInput";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { StatusToggle } from "@/components/admin/shared/StatusToggle";
import { LoadingState } from "@/components/admin/shared/LoadingState";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { CategoryDialog } from "@/components/admin/categories/CategoryDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AdminCategories() {
  const {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCategories();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // Fetch product counts per category
  const { data: productCounts } = useQuery({
    queryKey: ["admin", "category-product-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("category_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((p) => {
        if (p.category_id) {
          counts[p.category_id] = (counts[p.category_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  // Smart filtering: when searching, include parent categories of matches
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const lowerSearch = search.toLowerCase();
    const matchedIds = new Set<string>();

    // Find direct matches
    categories.forEach((cat) => {
      if (cat.name.toLowerCase().includes(lowerSearch) || cat.slug.toLowerCase().includes(lowerSearch)) {
        matchedIds.add(cat.id);
      }
    });

    // Include parents of matched children
    const addParents = (parentId: string | null) => {
      if (!parentId) return;
      matchedIds.add(parentId);
      const parent = categories.find((c) => c.id === parentId);
      if (parent?.parent_id) addParents(parent.parent_id);
    };

    // Include children of matched parents
    const addChildren = (parentId: string) => {
      categories.forEach((c) => {
        if (c.parent_id === parentId) {
          matchedIds.add(c.id);
          addChildren(c.id);
        }
      });
    };

    const initialMatches = [...matchedIds];
    initialMatches.forEach((id) => {
      const cat = categories.find((c) => c.id === id);
      if (cat?.parent_id) addParents(cat.parent_id);
      addChildren(id);
    });

    return categories.filter((c) => matchedIds.has(c.id));
  }, [categories, search]);

  const rootCategories = filteredCategories.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) =>
    filteredCategories.filter((c) => c.parent_id === parentId);

  // Count all descendants for delete warning
  const countDescendants = (catId: string): number => {
    const children = categories.filter((c) => c.parent_id === catId);
    return children.reduce((acc, c) => acc + 1 + countDescendants(c.id), 0);
  };

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      await deleteCategory(categoryToDelete.id);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleSave = async (data: CategoryFormData) => {
    if (editingCategory) {
      await updateCategory({ id: editingCategory.id, ...data });
    } else {
      await createCategory(data);
    }
    setDialogOpen(false);
    setEditingCategory(null);
  };

  const handleToggleActive = async (category: Category, active: boolean) => {
    await updateCategory({ id: category.id, name: category.name, slug: category.slug, active });
  };

  const deleteDescendantCount = categoryToDelete ? countDescendants(categoryToDelete.id) : 0;
  const deleteProductCount = categoryToDelete ? (productCounts?.[categoryToDelete.id] || 0) : 0;

  const renderCategory = (category: Category, level = 0) => {
    const children = getChildren(category.id);
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedIds.has(category.id);
    const pCount = productCounts?.[category.id] || 0;

    return (
      <div key={category.id}>
        <div
          className={cn(
            "flex items-center gap-2 sm:gap-3 rounded-lg border bg-card p-2.5 sm:p-3 hover:bg-muted/50 transition-colors",
            !category.active && "opacity-60"
          )}
          style={{ marginLeft: `${level * 24}px` }}
        >
          {/* Collapse toggle */}
          <button
            onClick={() => hasChildren && toggleCollapse(category.id)}
            className={cn(
              "h-6 w-6 flex items-center justify-center rounded hover:bg-muted shrink-0",
              !hasChildren && "invisible"
            )}
          >
            {hasChildren && (isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ))}
          </button>

          {category.icon && (
            <span className="text-lg shrink-0">{category.icon}</span>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">{category.name}</span>
              {hasChildren && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {children.length} sub
                </Badge>
              )}
              {pCount > 0 && (
                <Badge variant="outline" className="text-xs shrink-0 gap-1">
                  <Package className="h-3 w-3" />
                  {pCount}
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">/{category.slug}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <div className="hidden sm:block">
              <StatusToggle
                active={category.active}
                onToggle={(active) => handleToggleActive(category, active)}
                showLabel={false}
              />
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(category)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleDelete(category)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {hasChildren && !isCollapsed && (
          <div className="mt-1.5 space-y-1.5">
            {children.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Categorias"
          description="Gerencie as categorias de produtos"
          icon={FolderTree}
        />
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias"
        description="Gerencie as categorias de produtos"
        icon={FolderTree}
        actionLabel="Nova Categoria"
        actionIcon={Plus}
        onAction={handleCreate}
      />

      <div className="flex items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar categorias..."
          className="max-w-sm"
        />
        <Badge variant="outline" className="shrink-0">
          {categories.length} {categories.length === 1 ? "categoria" : "categorias"}
        </Badge>
      </div>

      {filteredCategories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="Nenhuma categoria encontrada"
          description={search ? "Nenhuma categoria encontrada para essa busca." : "Crie sua primeira categoria para organizar os produtos."}
          actionLabel="Nova Categoria"
          onAction={handleCreate}
        />
      ) : (
        <div className="space-y-1.5">
          {rootCategories.map((category) => renderCategory(category))}
        </div>
      )}

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        categories={categories}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Categoria"
        description={
          deleteDescendantCount > 0
            ? `Tem certeza que deseja excluir "${categoryToDelete?.name}"? Ela possui ${deleteDescendantCount} subcategoria(s) que também serão afetadas.${deleteProductCount > 0 ? ` Além disso, ${deleteProductCount} produto(s) perderão esta categoria.` : ""} Esta ação não pode ser desfeita.`
            : deleteProductCount > 0
              ? `Tem certeza que deseja excluir "${categoryToDelete?.name}"? ${deleteProductCount} produto(s) perderão esta categoria. Esta ação não pode ser desfeita.`
              : `Tem certeza que deseja excluir "${categoryToDelete?.name}"? Esta ação não pode ser desfeita.`
        }
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
