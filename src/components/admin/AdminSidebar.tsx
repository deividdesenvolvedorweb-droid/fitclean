import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, ShoppingCart, Package, FolderTree, Filter, Image,
  Users, Ticket, CreditCard, BarChart3, Settings, UserCog,
  ClipboardList, LogOut, ChevronLeft, ChevronRight, X, LayoutTemplate,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { getRoleLabel } from '@/types/admin';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  permission?: string;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, permission: 'canViewDashboard' },
  { title: 'Layout', href: '/admin/layout', icon: LayoutTemplate, permission: 'canManageLayout' },
  { title: 'Pedidos', href: '/admin/pedidos', icon: ShoppingCart, permission: 'canViewOrders' },
  { title: 'Produtos', href: '/admin/produtos', icon: Package, permission: 'canManageProducts' },
  { title: 'Categorias', href: '/admin/categorias', icon: FolderTree, permission: 'canManageCategories' },
  { title: 'Filtros', href: '/admin/filtros', icon: Filter, permission: 'canManageFilters' },
  { title: 'Banners', href: '/admin/banners', icon: Image, permission: 'canManageBanners' },
  { title: 'Clientes', href: '/admin/clientes', icon: Users, permission: 'canViewCustomers' },
  { title: 'Cupons', href: '/admin/cupons', icon: Ticket, permission: 'canManageCoupons' },
  
  { title: 'Pagamentos', href: '/admin/pagamentos', icon: CreditCard, permission: 'canManagePayments' },
  { title: 'Relatórios', href: '/admin/relatorios', icon: BarChart3, permission: 'canViewDashboard' },
  { title: 'Configurações', href: '/admin/configuracoes', icon: Settings, permission: 'canManageTheme' },
  { title: 'Usuários', href: '/admin/usuarios', icon: UserCog, permission: 'canManageUsers' },
  { title: 'Logs', href: '/admin/logs', icon: ClipboardList, permission: 'canViewLogs' },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export function AdminSidebar({ isOpen, onClose, isMobile }: AdminSidebarProps) {
  const location = useLocation();
  const { user, role, permissions, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNavItems = navItems.filter((item) => {
    if (!item.permission) return true;
    return permissions?.[item.permission as keyof typeof permissions];
  });

  const handleSignOut = async () => {
    await signOut();
  };

  const handleLinkClick = () => {
    if (isMobile) onClose();
  };

  // On mobile, hide when not open
  if (isMobile && !isOpen) return null;

  const sidebarContent = (
    <aside
      className={cn(
        'flex flex-col bg-sidebar border-r border-sidebar-border h-screen transition-all duration-300',
        isMobile ? 'w-64' : collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {(!collapsed || isMobile) && (
          <Link to="/admin" className="flex items-center gap-2" onClick={handleLinkClick}>
            <div className="bg-primary text-primary-foreground rounded-lg p-1.5">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <span className="font-display font-bold text-lg">Admin</span>
          </Link>
        )}
        {isMobile ? (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn('h-8 w-8', collapsed && 'mx-auto')}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-2 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/admin' && location.pathname.startsWith(item.href));
            const showLabel = isMobile || !collapsed;

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  !showLabel && 'justify-center px-2'
                )}
                title={!showLabel ? item.title : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {showLabel && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User section */}
      <div className="border-t border-sidebar-border p-4">
        {(isMobile || !collapsed) && (
          <div className="mb-3">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.email}</p>
            {role && (
              <p className="text-xs text-muted-foreground">{getRoleLabel(role)}</p>
            )}
          </div>
        )}
        <Separator className={cn('mb-3', !isMobile && collapsed && 'hidden')} />
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size={!isMobile && collapsed ? 'icon' : 'sm'}
            onClick={handleSignOut}
            className={cn('w-full text-muted-foreground hover:text-destructive', !isMobile && collapsed && 'w-10')}
            title={!isMobile && collapsed ? 'Sair' : undefined}
          >
            <LogOut className="h-4 w-4" />
            {(isMobile || !collapsed) && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        {/* Sidebar */}
        <div className="relative z-50">
          {sidebarContent}
        </div>
      </div>
    );
  }

  return sidebarContent;
}
