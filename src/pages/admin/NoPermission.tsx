import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, ArrowLeft, LogOut } from 'lucide-react';

export default function NoPermission() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="bg-destructive/10 p-4 rounded-full">
              <ShieldX className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-display">Sem Permissão</CardTitle>
          <CardDescription className="text-base">
            Sua conta não possui permissões para acessar o painel administrativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Logado como: <strong>{user?.email}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Entre em contato com um administrador para solicitar acesso.
          </p>
          
          <div className="flex flex-col gap-2 pt-4">
            <Button asChild variant="outline">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para a loja
              </Link>
            </Button>
            <Button variant="ghost" onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair e entrar com outra conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
