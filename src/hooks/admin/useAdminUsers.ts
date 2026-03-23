import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Enums } from "@/integrations/supabase/types";

export type AppRole = Enums<"app_role">;

export interface AdminUser {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  profile: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

async function logAudit(action: string, entity: string, entityId: string | null, before: any, after: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      action,
      entity,
      entity_id: entityId,
      before_data: before,
      after_data: after,
      user_id: user?.id || null,
      user_email: user?.email || null,
    });
  } catch {
    // silent — audit is best-effort
  }
}

export function useAdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      // 1. Fetch all user_roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) return [] as AdminUser[];

      // 2. Fetch profiles for those user_ids
      const userIds = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      return roles.map((item) => {
        const profile = profileMap.get(item.user_id) || null;
        return {
          id: item.id,
          user_id: item.user_id,
          role: item.role,
          created_at: item.created_at,
          profile: profile
            ? { full_name: profile.full_name, email: profile.email, avatar_url: profile.avatar_url }
            : null,
        } as AdminUser;
      });
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole, oldRole }: { userId: string; newRole: AppRole; oldRole?: AppRole }) => {
      const { data, error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      await logAudit("update_role", "user_roles", userId, { role: oldRole }, { role: newRole });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({
        title: "Permissão atualizada",
        description: "O nível de acesso do usuário foi alterado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeRole = useMutation({
    mutationFn: async (userId: string) => {
      // Fetch fresh role data to avoid stale closure
      const { data: userRole, error: fetchError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (fetchError) throw fetchError;

      // Protect against removing the last admin
      if (userRole.role === "admin") {
        const { count } = await supabase
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .eq("role", "admin");

        if ((count ?? 0) <= 1) {
          throw new Error("Não é possível remover o último administrador do sistema.");
        }
      }

      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      await logAudit("remove_role", "user_roles", userId, { role: userRole.role }, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({
        title: "Acesso removido",
        description: "O usuário não tem mais acesso ao painel administrativo.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addRole = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AppRole }) => {
      // Look up user_id from profiles by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .single();

      if (profileError || !profile) {
        throw new Error("Usuário não encontrado. Verifique se o e-mail está correto e se o usuário já possui conta.");
      }

      // Check if already has a role
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", profile.user_id)
        .maybeSingle();

      if (existing) {
        throw new Error("Este usuário já possui acesso ao painel. Use 'Alterar Permissão' para mudar o nível.");
      }

      const { data, error } = await supabase
        .from("user_roles")
        .insert({ user_id: profile.user_id, role })
        .select()
        .single();

      if (error) throw error;

      await logAudit("add_role", "user_roles", profile.user_id, null, { role, email });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({
        title: "Usuário adicionado",
        description: "O usuário agora tem acesso ao painel administrativo.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    users: usersQuery.data || [],
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    updateRole,
    removeRole,
    addRole,
  };
}
