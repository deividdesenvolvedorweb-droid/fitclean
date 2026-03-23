import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, subDays, format, addDays } from "date-fns";

interface ReportParams {
  startDate: Date;
  endDate: Date;
}

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  product_name: string;
  quantity: number;
  revenue: number;
}

interface KPIs {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  newCustomers: number;
}

export function useReports(params: ReportParams) {
  const { startDate, endDate } = params;

  const start = startOfDay(startDate).toISOString();
  const end = endOfDay(endDate).toISOString();

  const kpisQuery = useQuery({
    queryKey: ["admin-report-kpis", start, end],
    queryFn: async (): Promise<KPIs> => {
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("total, status")
        .gte("created_at", start)
        .lte("created_at", end)
        .not("status", "in", '("canceled","refunded")');

      if (ordersError) throw ordersError;

      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;
      const totalOrders = orders?.length ?? 0;
      const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const { count: newCustomers, error: customersError } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start)
        .lte("created_at", end);

      if (customersError) throw customersError;

      return {
        totalRevenue,
        totalOrders,
        averageTicket,
        newCustomers: newCustomers ?? 0,
      };
    },
  });

  const salesByDayQuery = useQuery({
    queryKey: ["admin-report-sales-by-day", start, end],
    queryFn: async (): Promise<SalesData[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("created_at, total")
        .gte("created_at", start)
        .lte("created_at", end)
        .not("status", "in", '("canceled","refunded")');

      if (error) throw error;

      const grouped: Record<string, { revenue: number; orders: number }> = {};
      data?.forEach((order) => {
        const date = format(new Date(order.created_at), "yyyy-MM-dd");
        if (!grouped[date]) grouped[date] = { revenue: 0, orders: 0 };
        grouped[date].revenue += Number(order.total);
        grouped[date].orders += 1;
      });

      const result: SalesData[] = [];
      let current = startOfDay(startDate);
      const endDay = startOfDay(endDate);
      while (current <= endDay) {
        const dateStr = format(current, "yyyy-MM-dd");
        result.push({
          date: dateStr,
          revenue: grouped[dateStr]?.revenue ?? 0,
          orders: grouped[dateStr]?.orders ?? 0,
        });
        current = addDays(current, 1);
      }

      return result;
    },
  });

  const topProductsQuery = useQuery({
    queryKey: ["admin-report-top-products", start, end],
    queryFn: async (): Promise<TopProduct[]> => {
      // Get order items directly by joining through orders date range
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id")
        .gte("created_at", start)
        .lte("created_at", end)
        .not("status", "in", '("canceled","refunded")');

      if (ordersError) throw ordersError;
      if (!orders || orders.length === 0) return [];

      // Batch in groups of 500 to avoid Supabase .in() limit
      const allItems: { product_name: string; quantity: number; total_price: number }[] = [];
      const batchSize = 500;
      for (let i = 0; i < orders.length; i += batchSize) {
        const batch = orders.slice(i, i + batchSize).map((o) => o.id);
        const { data: items, error: itemsError } = await supabase
          .from("order_items")
          .select("product_name, quantity, total_price")
          .in("order_id", batch);
        if (itemsError) throw itemsError;
        if (items) allItems.push(...items);
      }

      const grouped: Record<string, { quantity: number; revenue: number }> = {};
      allItems.forEach((item) => {
        const name = item.product_name;
        if (!grouped[name]) grouped[name] = { quantity: 0, revenue: 0 };
        grouped[name].quantity += item.quantity;
        grouped[name].revenue += Number(item.total_price);
      });

      return Object.entries(grouped)
        .map(([product_name, d]) => ({ product_name, quantity: d.quantity, revenue: d.revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    },
  });

  const ordersByStatusQuery = useQuery({
    queryKey: ["admin-report-orders-by-status", start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("status")
        .gte("created_at", start)
        .lte("created_at", end);

      if (error) throw error;

      const grouped: Record<string, number> = {};
      data?.forEach((order) => {
        grouped[order.status] = (grouped[order.status] || 0) + 1;
      });

      return Object.entries(grouped).map(([status, count]) => ({ status, count }));
    },
  });

  const paymentMethodsQuery = useQuery({
    queryKey: ["admin-report-payment-methods", start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("payment_method, total")
        .gte("created_at", start)
        .lte("created_at", end)
        .not("status", "in", '("canceled","refunded")')
        .not("payment_method", "is", null);

      if (error) throw error;

      const grouped: Record<string, { count: number; total: number }> = {};
      data?.forEach((order) => {
        const method = order.payment_method || "unknown";
        if (!grouped[method]) grouped[method] = { count: 0, total: 0 };
        grouped[method].count += 1;
        grouped[method].total += Number(order.total);
      });

      return Object.entries(grouped).map(([method, d]) => ({
        method,
        count: d.count,
        total: d.total,
      }));
    },
  });

  return {
    kpis: kpisQuery.data,
    isLoadingKpis: kpisQuery.isLoading,
    kpisError: kpisQuery.error,
    salesByDay: salesByDayQuery.data ?? [],
    isLoadingSalesByDay: salesByDayQuery.isLoading,
    topProducts: topProductsQuery.data ?? [],
    isLoadingTopProducts: topProductsQuery.isLoading,
    ordersByStatus: ordersByStatusQuery.data ?? [],
    isLoadingOrdersByStatus: ordersByStatusQuery.isLoading,
    paymentMethods: paymentMethodsQuery.data ?? [],
    isLoadingPaymentMethods: paymentMethodsQuery.isLoading,
  };
}

export function useReportPresets() {
  return useMemo(() => {
    const today = new Date();
    return {
      today: { startDate: today, endDate: today, label: "Hoje" },
      last7Days: { startDate: subDays(today, 6), endDate: today, label: "Últimos 7 dias" },
      last30Days: { startDate: subDays(today, 29), endDate: today, label: "Últimos 30 dias" },
      last90Days: { startDate: subDays(today, 89), endDate: today, label: "Últimos 90 dias" },
    };
  }, []);
}
