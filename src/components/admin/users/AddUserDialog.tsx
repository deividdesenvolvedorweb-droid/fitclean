import { useState } from "react";
import { UserPlus, Shield, ShieldAlert, UserCog, Eye } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (email: string, role: AppRole) => void;
  isLoading?: boolean;
}

const roles: { value: AppRole; label: string; description: string; icon: React.ElementType }[] = [
  { value: "admin", label: "Administrador", description: "Acesso total a todas as funcionalidades", icon: ShieldAlert },
  { value: "manager", label: "Gerente", description: "Gerenciar produtos, categorias, pedidos e clientes", icon: Shield },
  { value: "support", label: "Suporte", description: "Visualizar e atualizar pedidos e clientes", icon: UserCog },
  { value: "viewer", label: "Visualizador", description: "Apenas visualização, sem permissão de edição", icon: Eye },
];

export function AddUserDialog({ open, onOpenChange, onConfirm, isLoading }: AddUserDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("viewer");

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = () => {
    if (!isValidEmail) return;
    onConfirm(email.trim(), role);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setEmail("");
      setRole("viewer");
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Adicionar Usuário
          </DialogTitle>
          <DialogDescription>
            Informe o e-mail de um usuário existente para conceder acesso ao painel administrativo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-user-email">E-mail do usuário</Label>
            <Input
              id="add-user-email"
              type="email"
              placeholder="usuario@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <p className="text-xs text-muted-foreground">O usuário precisa já ter uma conta criada no sistema.</p>
          </div>

          <div className="space-y-2">
            <Label>Nível de acesso</Label>
            <RadioGroup value={role} onValueChange={(v) => setRole(v as AppRole)} className="space-y-2">
              {roles.map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.value}>
                    <RadioGroupItem value={r.value} id={`add-${r.value}`} className="peer sr-only" />
                    <Label
                      htmlFor={`add-${r.value}`}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                        "hover:bg-muted/50",
                        "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      )}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{r.label}</p>
                        <p className="text-xs text-muted-foreground">{r.description}</p>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !isValidEmail}>
            {isLoading ? "Adicionando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
