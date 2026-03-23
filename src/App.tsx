import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Loader2 } from "lucide-react";
import { AdminRedirectPrompt } from "@/components/AdminRedirectPrompt";

// Store pages - eagerly loaded for speed
import Index from "./pages/Index";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import SearchPage from "./pages/SearchPage";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages (less critical paths)
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const CustomerLogin = lazy(() => import("./pages/CustomerLogin"));
const CustomerAccount = lazy(() => import("./pages/CustomerAccount"));
const LinksPage = lazy(() => import("./pages/LinksPage"));

// Admin pages - lazy loaded (only needed for admin users)
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const NoPermission = lazy(() => import("./pages/admin/NoPermission"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminProductForm = lazy(() => import("./pages/admin/AdminProductForm"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminOrderDetail = lazy(() => import("./pages/admin/AdminOrderDetail"));
const AdminFilters = lazy(() => import("./pages/admin/AdminFilters"));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminCustomerDetail = lazy(() => import("./pages/admin/AdminCustomerDetail"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const AdminLayoutPage = lazy(() => import("./pages/admin/AdminLayoutPage"));

// AdminLayout is not a page but a layout wrapper — lazy load too
const AdminLayout = lazy(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

const App = () => {
  React.useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled rejection:", event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ThemeProvider>
            <CartProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AdminRedirectPrompt />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Store routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/categoria/:category" element={<CategoryPage />} />
                    <Route path="/categoria/:category/:subcategory" element={<CategoryPage />} />
                    <Route path="/produto/:slug" element={<ProductPage />} />
                    <Route path="/carrinho" element={<CartPage />} />
                    <Route path="/busca" element={<SearchPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/conta/login" element={<CustomerLogin />} />
                    <Route path="/conta" element={<CustomerAccount />} />
                    <Route path="/links" element={<LinksPage />} />

                    {/* Admin routes */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/sem-permissao" element={<NoPermission />} />
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="categorias" element={<AdminCategories />} />
                      <Route path="produtos" element={<AdminProducts />} />
                      <Route path="produtos/novo" element={<AdminProductForm />} />
                      <Route path="produtos/:id" element={<AdminProductForm />} />
                      <Route path="pedidos" element={<AdminOrders />} />
                      <Route path="pedidos/:id" element={<AdminOrderDetail />} />
                      <Route path="filtros" element={<AdminFilters />} />
                      <Route path="banners" element={<AdminBanners />} />
                      <Route path="clientes" element={<AdminCustomers />} />
                      <Route path="clientes/:id" element={<AdminCustomerDetail />} />
                      <Route path="cupons" element={<AdminCoupons />} />

                      <Route path="pagamentos" element={<AdminPayments />} />
                      <Route path="relatorios" element={<AdminReports />} />
                      <Route path="layout" element={<AdminLayoutPage />} />
                      <Route path="configuracoes" element={<AdminSettings />} />
                      <Route path="usuarios" element={<AdminUsers />} />
                      <Route path="logs" element={<AdminLogs />} />
                    </Route>

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </CartProvider>
          </ThemeProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
