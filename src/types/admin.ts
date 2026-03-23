// Admin types for the e-commerce panel

export type AppRole = 'admin' | 'manager' | 'support' | 'viewer';

export type OrderStatus = 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'canceled' | 'refunded';

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'chargeback';

export type PaymentMethod = 'pix' | 'credit_card' | 'boleto';

export type BannerType = 'home_slider' | 'category' | 'promo_bar' | 'topbar';

export type CouponType = 'percentage' | 'fixed' | 'free_shipping';

export type FilterType = 'checkbox' | 'radio' | 'slider' | 'range' | 'boolean';

export type ButtonVariant = 'primary' | 'outline' | 'secondary';

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: AppRole;
}

export interface RolePermissions {
  canViewDashboard: boolean;
  canViewOrders: boolean;
  canEditOrders: boolean;
  canManageProducts: boolean;
  canManageCategories: boolean;
  canManageBanners: boolean;
  canManageTheme: boolean;
  canViewCustomers: boolean;
  canManageCustomers: boolean;
  canManageCoupons: boolean;
  canManagePayments: boolean;
  canManageUsers: boolean;
  canViewLogs: boolean;
  canManageShipping: boolean;
  canManageFilters: boolean;
  canManageLayout: boolean;
  canExportData: boolean;
}

export const ROLE_PERMISSIONS: Record<AppRole, RolePermissions> = {
  admin: {
    canViewDashboard: true,
    canViewOrders: true,
    canEditOrders: true,
    canManageProducts: true,
    canManageCategories: true,
    canManageBanners: true,
    canManageTheme: true,
    canViewCustomers: true,
    canManageCustomers: true,
    canManageCoupons: true,
    canManagePayments: true,
    canManageUsers: true,
    canViewLogs: true,
    canManageShipping: true,
    canManageFilters: true,
    canManageLayout: true,
    canExportData: true,
  },
  manager: {
    canViewDashboard: true,
    canViewOrders: true,
    canEditOrders: true,
    canManageProducts: true,
    canManageCategories: true,
    canManageBanners: false,
    canManageTheme: false,
    canViewCustomers: true,
    canManageCustomers: true,
    canManageCoupons: true,
    canManagePayments: false,
    canManageUsers: false,
    canViewLogs: false,
    canManageShipping: false,
    canManageFilters: true,
    canManageLayout: false,
    canExportData: false,
  },
  support: {
    canViewDashboard: true,
    canViewOrders: true,
    canEditOrders: true,
    canManageProducts: false,
    canManageCategories: false,
    canManageBanners: false,
    canManageTheme: false,
    canViewCustomers: true,
    canManageCustomers: false,
    canManageCoupons: false,
    canManagePayments: false,
    canManageUsers: false,
    canViewLogs: false,
    canManageShipping: false,
    canManageFilters: false,
    canManageLayout: false,
    canExportData: false,
  },
  viewer: {
    canViewDashboard: true,
    canViewOrders: true,
    canEditOrders: false,
    canManageProducts: false,
    canManageCategories: false,
    canManageBanners: false,
    canManageTheme: false,
    canViewCustomers: true,
    canManageCustomers: false,
    canManageCoupons: false,
    canManagePayments: false,
    canManageUsers: false,
    canViewLogs: false,
    canManageShipping: false,
    canManageFilters: false,
    canManageLayout: false,
    canExportData: false,
  },
};

export const getRoleLabel = (role: AppRole): string => {
  const labels: Record<AppRole, string> = {
    admin: 'Administrador',
    manager: 'Gerente',
    support: 'Suporte',
    viewer: 'Visualizador',
  };
  return labels[role];
};

export const getOrderStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    pending_payment: 'Aguardando Pagamento',
    paid: 'Pago',
    processing: 'Processando',
    shipped: 'Enviado',
    delivered: 'Entregue',
    canceled: 'Cancelado',
    refunded: 'Reembolsado',
  };
  return labels[status];
};

export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  const labels: Record<PaymentStatus, string> = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    chargeback: 'Chargeback',
  };
  return labels[status];
};

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  const labels: Record<PaymentMethod, string> = {
    pix: 'Pix',
    credit_card: 'Cartão de Crédito',
    boleto: 'Boleto',
  };
  return labels[method];
};

export const getMpPaymentStatusLabel = (status: string, paymentMethod?: string): string => {
  const labels: Record<string, string> = {
    approved: 'Pago',
    authorized: 'Autorizado',
    pending: paymentMethod === 'pix' || paymentMethod === 'boleto' ? 'Gerado' : 'Pendente',
    in_process: 'Em Processamento',
    rejected: paymentMethod === 'credit_card' ? 'Recusado' : 'Rejeitado',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
    charged_back: 'Chargeback',
  };
  return labels[status] || status;
};

export const getMpPaymentStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    approved: 'bg-green-100 text-green-800',
    authorized: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    in_process: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    refunded: 'bg-gray-100 text-gray-800',
    charged_back: 'bg-red-200 text-red-900',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};
