import { useState, useEffect } from "react";
import { Shield, ShieldAlert, UserCog, Eye } from "lucide-react";
import { AppRole } from "@/hooks/admin/useAdminUsers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface UserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRole: AppRole;
  userName: string;
  onConfirm: (role: AppRole) => void;
  isLoading?: boolean;
}

const roles: { value: AppRole; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: "admin",
    label: "Administrador",
    description: "Acesso total a todas as funcionalidades",
    icon: ShieldAlert,
  },
  {
    value: "manager",
    label: "Gerente",
    description: "Gerenciar produtos, categorias, pedidos e clientes",
    icon: Shield,
  },
  {
    value: "support",
    label: "Suporte",
    description: "Visualizar e atualizar pedidos e clientes",
    icon: UserCog,
  },
  {
    value: "viewer",
    label: "Visualizador",
    description: "Apenas visualização, sem permissão de edição",
    icon: Eye,
  },
];

export function UserRoleDialog({
  open,
  onOpenChange,
  currentRole,
  userName,
  onConfirm,
  isLoading,
}: UserRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<AppRole>(currentRole);

  useEffect(() => {
    setSelectedRole(currentRole);
  }, [currentRole]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Permissão</DialogTitle>
          <DialogDescription>
            Alterar nível de acesso de <strong>{userName}</strong>
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={selectedRole}
          onValueChange={(value) => setSelectedRole(value as AppRole)}
          className="space-y-3"
        >
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div key={role.value}>
                <RadioGroupItem
                  value={role.value}
                  id={role.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={role.value}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors",
                    "hover:bg-muted/50",
                    "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  )}
                >
                  <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{role.label}</p>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(selectedRole)}
            disabled={isLoading || selectedRole === currentRole}
          >
            {isLoading ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
