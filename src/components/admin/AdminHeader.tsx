import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, ExternalLink, LogOut, Menu, Settings, User } from 'lucide-react';
import { getRoleLabel } from '@/types/admin';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  isMobile: boolean;
}

export function AdminHeader({ onToggleSidebar, isMobile }: AdminHeaderProps) {
  const { user, role, signOut } = useAuth();

  const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-card px-3 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-4">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="h-9 w-9">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <span className="hidden sm:inline">Ver loja</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full">
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                  {user?.email ? getInitials(user.email) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none truncate">{user?.email}</p>
                {role && (
                  <p className="text-xs leading-none text-muted-foreground">{getRoleLabel(role)}</p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin/perfil" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" /> Meu Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/admin/configuracoes" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" /> Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
