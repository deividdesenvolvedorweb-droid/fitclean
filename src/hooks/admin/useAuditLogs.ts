import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type AuditLog = Tables<"audit_logs">;

interface UseAuditLogsParams {
  page?: number;
  pageSize?: number;
  entity?: string;
  action?: string;
  search?: string;
}

export function useAuditLogs({
  page = 1,
  pageSize = 20,
  entity,
  action,
  search,
}: UseAuditLogsParams = {}) {
  return useQuery({
    queryKey: ["admin", "audit-logs", { page, pageSize, entity, action, search }],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (entity) {
        query = query.eq("entity", entity);
      }

      if (action) {
        query = query.eq("action", action);
      }

      if (search) {
        // Only search entity_id if it looks like a UUID prefix, otherwise just search email
        const isUuidLike = /^[0-9a-f-]{1,36}$/i.test(search);
        if (isUuidLike) {
          query = query.or(`entity_id.eq.${search},user_email.ilike.%${search}%`);
        } else {
          query = query.ilike("user_email", `%${search}%`);
        }
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        logs: data as AuditLog[],
        totalCount: count || 0,
      };
    },
  });
}
