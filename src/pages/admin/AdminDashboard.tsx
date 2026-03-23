import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/admin/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard,
  DollarSign, 
  ShoppingCart, 
  Users, 
  AlertTriangle,
  Clock,
  X
} from 'lucide-react';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function AdminDashboard() {
  const { role } = useAuth();
  const [showWelcome, setShowWelcome] = useState(() => {
    return localStorage.getItem('admin_welcome_dismissed') !== 'true';
  });

  const dismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('admin_welcome_dismissed', 'true');
  };

  // Today's confirmed sales (exclude canceled, refunded, pending_payment)

  // Today's confirmed sales (exclude canceled, refunded, pending_payment)
  const { data: todaySales } = useQuery({
    queryKey: ["admin", "dashboard", "today-sales"],
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const { data, error } = await supabase
        .from("orders")
        .select("total")
        .gte("created_at", startOfDay)
        .not("status", "in", '("canceled","refunded","pending_payment")');
      if (error) throw error;
      const total = (data || []).reduce((sum, o) => sum + Number(o.total), 0);
      return { total, count: data?.length || 0 };
    },
  });

  // Smart pending orders: boleto < 2 days, pix < 2 hours, null/other = 2 hours
  const { data: pendingCount } = useQuery({
    queryKey: ["admin", "dashboard", "pending"],
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, payment_method, created_at")
        .eq("status", "pending_payment");
      if (error) throw error;
      if (!data) return 0;
      const now = new Date();
      return data.filter((o) => {
        const diffMs = now.getTime() - new Date(o.created_at).getTime();
        if (o.payment_method === 'boleto') {
          return diffMs < 2 * 24 * 60 * 60 * 1000; // 2 days
        }
        // pix, null, or any other method = 2 hours window
        return diffMs < 2 * 60 * 60 * 1000;
      }).length;
    },
  });

  // Total customers
  const { data: customerCount } = useQuery({
    queryKey: ["admin", "dashboard", "customers"],
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("customers")
        .select("id", { count: "exact", head: true });
      if (error) {
        console.error("Error fetching customer count:", error);
        return 0;
      }
      return count || 0;
    },
  });

  // Low stock products
  const { data: lowStockProducts } = useQuery({
    queryKey: ["admin", "dashboard", "low-stock"],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      // Fetch all active physical products to check stock vs min_stock
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock, min_stock, slug")
        .eq("active", true)
        .eq("unlimited_stock", false)
        .eq("is_digital", false)
        .order("stock", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data || []).filter(p => p.stock <= p.min_stock).slice(0, 10);
    },
  });

  // Recent orders
  const { data: recentOrders } = useQuery({
    queryKey: ["admin", "dashboard", "recent-orders"],
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, total, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  const stats = [
    { title: 'Vendas Hoje', value: formatCurrency(todaySales?.total ?? 0), icon: DollarSign, subtitle: `${todaySales?.count ?? 0} pedidos confirmados`, iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600' },
    { title: 'Pedidos Pendentes', value: String(pendingCount ?? 0), icon: Clock, subtitle: 'Aguardando pagamento', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600' },
    { title: 'Total Clientes', value: String(customerCount ?? 0), icon: Users, subtitle: 'Cadastrados', iconBg: 'bg-sky-500/10', iconColor: 'text-sky-600' },
  ];

  const statusLabels: Record<string, string> = {
    pending_payment: 'Pendente',
    paid: 'Pago',
    processing: 'Processando',
    shipped: 'Enviado',
    delivered: 'Entregue',
    canceled: 'Cancelado',
    refunded: 'Reembolsado',
  };

  const statusConfig: Record<string, { className: string }> = {
    pending_payment: { className: 'border-amber-500/20 bg-amber-500/10 text-amber-600' },
    paid: { className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600' },
    processing: { className: 'border-sky-500/20 bg-sky-500/10 text-sky-600' },
    shipped: { className: 'border-violet-500/20 bg-violet-500/10 text-violet-600' },
    delivered: { className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700' },
    canceled: { className: 'border-destructive/20 bg-destructive/10 text-destructive' },
    refunded: { className: 'border-border bg-muted text-muted-foreground' },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral da sua loja"
        icon={LayoutDashboard}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">{stat.title}</CardTitle>
              <div className={`rounded-md p-1.5 ${stat.iconBg}`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Estoque Baixo
            </CardTitle>
            <CardDescription>Produtos que precisam de reposição</CardDescription>
          </CardHeader>
          <CardContent>
            {!lowStockProducts || lowStockProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum produto com estoque baixo</p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map(p => (
                  <Link key={p.id} to={`/admin/produtos/${p.id}`} className="flex justify-between text-sm hover:bg-muted/50 rounded px-2 py-1 -mx-2 transition-colors">
                    <span className="truncate">{p.name}</span>
                    <span className="text-destructive font-medium">{p.stock} un.</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Últimos Pedidos
            </CardTitle>
            <CardDescription>Pedidos recentes da loja</CardDescription>
          </CardHeader>
          <CardContent>
            {!recentOrders || recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum pedido ainda</p>
            ) : (
              <div className="space-y-1">
                {recentOrders.map(o => (
                  <Link key={o.id} to={`/admin/pedidos/${o.id}`} className="flex justify-between items-center text-sm hover:bg-muted/50 rounded px-2 py-1.5 -mx-2 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium">{o.order_number}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusConfig[o.status]?.className || ''}`}>
                        {statusLabels[o.status] || o.status}
                      </Badge>
                    </div>
                    <span className="font-medium">{formatCurrency(Number(o.total))}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dismissible Welcome Banner */}
      {showWelcome && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Bem-vindo ao Painel Admin!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Use o menu lateral para navegar entre as seções. Comece cadastrando produtos e configurando sua loja.
                </p>
              </div>
              <button onClick={dismissWelcome} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/50">
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}