import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart3,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { useReports, useReportPresets } from "@/hooks/admin/useReports";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { LoadingState } from "@/components/admin/shared/LoadingState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getOrderStatusLabel, getPaymentMethodLabel } from "@/types/admin";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function AdminReports() {
  const presets = useReportPresets();
  const [dateRange, setDateRange] = useState(presets.last30Days);
  const [activePreset, setActivePreset] = useState<string>("last30Days");
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handlePreset = (key: string, preset: typeof dateRange) => {
    setActivePreset(key);
    setDateRange(preset);
    setCustomStart(undefined);
    setCustomEnd(undefined);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      setActivePreset("custom");
      setDateRange({
        startDate: customStart,
        endDate: customEnd,
        label: `${format(customStart, "dd/MM/yy")} - ${format(customEnd, "dd/MM/yy")}`,
      });
      setPopoverOpen(false);
    }
  };

  const {
    kpis,
    isLoadingKpis,
    kpisError,
    salesByDay,
    isLoadingSalesByDay,
    topProducts,
    isLoadingTopProducts,
    ordersByStatus,
    paymentMethods,
  } = useReports({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  if (isLoadingKpis) return <LoadingState />;

  if (kpisError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Relatórios" description="Acompanhe o desempenho da sua loja" icon={BarChart3} />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium">Erro ao carregar relatórios</p>
            <p className="text-sm text-muted-foreground mt-1">{kpisError.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Acompanhe o desempenho da sua loja"
        icon={BarChart3}
      />

      {/* Date Range Filter */}
      <div className="flex gap-2 flex-wrap items-center">
        {Object.entries(presets).map(([key, preset]) => (
          <Button
            key={key}
            variant={activePreset === key ? "default" : "outline"}
            size="sm"
            onClick={() => handlePreset(key, preset)}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {preset.label}
          </Button>
        ))}

        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={activePreset === "custom" ? "default" : "outline"}
              size="sm"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {activePreset === "custom"
                ? dateRange.label
                : "Personalizado"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Data Início</p>
                  <Calendar
                    mode="single"
                    selected={customStart}
                    onSelect={setCustomStart}
                    disabled={(date) => date > new Date()}
                    locale={ptBR}
                    className={cn("p-2 pointer-events-auto border rounded-md")}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Data Fim</p>
                  <Calendar
                    mode="single"
                    selected={customEnd}
                    onSelect={setCustomEnd}
                    disabled={(date) => date > new Date() || (customStart ? date < customStart : false)}
                    locale={ptBR}
                    className={cn("p-2 pointer-events-auto border rounded-md")}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  {customStart && customEnd
                    ? `${format(customStart, "dd/MM/yyyy")} → ${format(customEnd, "dd/MM/yyyy")}`
                    : "Selecione as datas"}
                </p>
                <Button
                  size="sm"
                  disabled={!customStart || !customEnd}
                  onClick={handleCustomApply}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <div className="rounded-md bg-emerald-500/10 p-1.5">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis?.totalRevenue ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">{dateRange.label}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <div className="rounded-md bg-sky-500/10 p-1.5">
              <ShoppingCart className="h-4 w-4 text-sky-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.totalOrders ?? 0}</div>
            <p className="text-xs text-muted-foreground">{dateRange.label}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <div className="rounded-md bg-amber-500/10 p-1.5">
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis?.averageTicket ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">{dateRange.label}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
            <div className="rounded-md bg-violet-500/10 p-1.5">
              <Users className="h-4 w-4 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.newCustomers ?? 0}</div>
            <p className="text-xs text-muted-foreground">{dateRange.label}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sales by Day */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vendas por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSalesByDay ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : salesByDay.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Sem dados para o período</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => format(new Date(v), "dd/MM", { locale: ptBR })}
                    className="text-xs"
                  />
                  <YAxis
                    tickFormatter={(v) => `R$ ${v}`}
                    className="text-xs"
                  />
                  <Tooltip
                    labelFormatter={(v) => format(new Date(v), "dd/MM/yyyy", { locale: ptBR })}
                    formatter={(value: number) => [formatCurrency(value), "Receita"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersByStatus.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center">
                <p className="text-muted-foreground">Sem dados</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                    label={({ status, count }) => `${getOrderStatusLabel(status)}: ${count}`}
                  >
                    {ordersByStatus.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, getOrderStatusLabel(name as any)]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethods.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center">
                <p className="text-muted-foreground">Sem dados</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={paymentMethods}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="method"
                    tickFormatter={(v) => getPaymentMethodLabel(v as any)}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => [value, "Pedidos"]}
                    labelFormatter={(v) => getPaymentMethodLabel(v as any)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTopProducts ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : topProducts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Sem dados para o período
            </p>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.product_name}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{product.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.quantity} unidades vendidas
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold">{formatCurrency(product.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
