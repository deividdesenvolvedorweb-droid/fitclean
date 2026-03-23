import { useState } from "react";
import { UserCog, Shield, ShieldAlert, Eye, UserX, MoreHorizontal, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { LoadingState } from "@/components/admin/shared/LoadingState";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { SearchInput } from "@/components/admin/shared/SearchInput";
import { DataTable, Column } from "@/components/admin/shared/DataTable";
import { useAdminUsers, AppRole, AdminUser } from "@/hooks/admin/useAdminUsers";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { UserRoleDialog } from "@/components/admin/users/UserRoleDialog";
import { AddUserDialog } from "@/components/admin/users/AddUserDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const roleConfig: Record<AppRole, { label: string; className: string; icon: React.ElementType }> = {
  admin: { label: "Administrador", className: "bg-destructive/10 text-destructive border-destructive/20", icon: ShieldAlert },
  manager: { label: "Gerente", className: "bg-primary/10 text-primary border-primary/20", icon: Shield },
  support: { label: "Suporte", className: "bg-sky-500/10 text-sky-600 border-sky-500/20", icon: UserCog },
  viewer: { label: "Visualizador", className: "bg-muted text-muted-foreground border-muted", icon: Eye },
};

export default function AdminUsers() {
  const { users, isLoading, updateRole, removeRole, addRole } = useAdminUsers();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [removingUser, setRemovingUser] = useState<AdminUser | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const email = u.profile?.email?.toLowerCase() || "";
    const name = u.profile?.full_name?.toLowerCase() || "";
    return email.includes(search.toLowerCase()) || name.includes(search.toLowerCase());
  });

  const adminCount = users.filter((u) => u.role === "admin").length;

  const handleUpdateRole = (newRole: AppRole) => {
    if (!editingUser) return;
    updateRole.mutate({ userId: editingUser.user_id, newRole, oldRole: editingUser.role });
    setEditingUser(null);
  };

  const handleRemoveUser = () => {
    if (!removingUser) return;
    removeRole.mutate(removingUser.user_id);
    setRemovingUser(null);
  };

  const handleAddUser = (email: string, role: AppRole) => {
    addRole.mutate({ email, role }, {
      onSuccess: () => setShowAddDialog(false),
    });
  };

  const columns: Column<AdminUser>[] = [
    {
      key: "user",
      header: "Usuário",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={row.profile?.avatar_url || undefined} />
            <AvatarFallback>
              {(row.profile?.full_name || row.profile?.email || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.profile?.full_name || "Sem nome"}</p>
            <p className="text-sm text-muted-foreground">{row.profile?.email || "E-mail não disponível"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Permissão",
      cell: (row) => {
        const config = roleConfig[row.role];
        const Icon = config.icon;
        return (
          <Badge variant="outline" className={config.className}>
            <Icon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "created_at",
      header: "Membro desde",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.created_at), "dd MMM yyyy", { locale: ptBR })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (row) => {
        const isCurrentUser = row.user_id === currentUser?.id;
        const isLastAdmin = row.role === "admin" && adminCount <= 1;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingUser(row)} disabled={isCurrentUser}>
                <Shield className="mr-2 h-4 w-4" />
                Alterar Permissão
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setRemovingUser(row)}
                disabled={isCurrentUser || isLastAdmin}
                className="text-destructive focus:text-destructive"
              >
                <UserX className="mr-2 h-4 w-4" />
                {isLastAdmin ? "Último admin" : "Remover Acesso"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários Admin"
        description={`${users.length} usuário${users.length !== 1 ? "s" : ""} com acesso ao painel`}
        icon={UserCog}
      />

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nome ou e-mail..."
          className="w-full sm:max-w-sm"
        />
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Adicionar Usuário
        </Button>
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Nenhum usuário encontrado"
          description={search ? "Tente ajustar sua busca" : "Adicione usuários para gerenciar o painel"}
        />
      ) : (
        <DataTable columns={columns} data={filteredUsers} />
      )}

      <UserRoleDialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        currentRole={editingUser?.role || "viewer"}
        userName={editingUser?.profile?.full_name || editingUser?.profile?.email || ""}
        onConfirm={handleUpdateRole}
        isLoading={updateRole.isPending}
      />

      <AddUserDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onConfirm={handleAddUser}
        isLoading={addRole.isPending}
      />

      <ConfirmDialog
        open={!!removingUser}
        onOpenChange={(open) => !open && setRemovingUser(null)}
        title="Remover acesso"
        description={`Tem certeza que deseja remover o acesso de "${removingUser?.profile?.email}"? Esta pessoa não poderá mais acessar o painel administrativo.`}
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={handleRemoveUser}
        isLoading={removeRole.isPending}
      />
    </div>
  );
}
