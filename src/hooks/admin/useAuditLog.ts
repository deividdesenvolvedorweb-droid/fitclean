import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

interface AuditLogData {
  action: string;
  entity: string;
  entityId: string;
  beforeData?: Json;
  afterData?: Json;
}

export function useAuditLog() {
  const { user } = useAuth();

  const logAction = async ({
    action,
    entity,
    entityId,
    beforeData,
    afterData,
  }: AuditLogData) => {
    if (!user) return;

    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        user_email: user.email,
        action,
        entity,
        entity_id: entityId,
        before_data: beforeData ?? null,
        after_data: afterData ?? null,
      });
    } catch (error) {
      console.error("Failed to log audit action:", error);
    }
  };

  return { logAction };
}
