import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield } from "lucide-react";
import { useState } from "react";

export function AdminRedirectPrompt() {
  const { hasAnyAdminRole, user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    // Only trigger on storefront pages (not admin pages)
    if (location.pathname.startsWith("/admin")) return;

    // Only show when an admin user just logged in (user id changed)
    if (user && hasAnyAdminRole && lastUserIdRef.current !== user.id) {
      lastUserIdRef.current = user.id;
      // Small delay to let the page settle after login
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }

    if (!user) {
      lastUserIdRef.current = null;
    }
  }, [user, hasAnyAdminRole, loading, location.pathname]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Painel Administrativo
          </AlertDialogTitle>
          <AlertDialogDescription>
            Você está logado como administrador. Deseja ir para o painel administrativo?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continuar na loja</AlertDialogCancel>
          <AlertDialogAction onClick={() => navigate("/admin")}>
            Ir para o Admin
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
