-- ====================================
-- ENUM TYPES
-- ====================================

-- Roles for RBAC
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'support', 'viewer');

-- Order status
CREATE TYPE public.order_status AS ENUM ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'canceled', 'refunded');

-- Payment status
CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'rejected', 'chargeback');

-- Payment method
CREATE TYPE public.payment_method AS ENUM ('pix', 'credit_card', 'boleto');

-- Banner types
CREATE TYPE public.banner_type AS ENUM ('home_slider', 'category', 'promo_bar', 'topbar');

-- Coupon types
CREATE TYPE public.coupon_type AS ENUM ('percentage', 'fixed', 'free_shipping');

-- Filter types
CREATE TYPE public.filter_type AS ENUM ('checkbox', 'radio', 'slider', 'range', 'boolean');

-- Button variants
CREATE TYPE public.button_variant AS ENUM ('primary', 'outline', 'secondary');

-- ====================================
-- PROFILES TABLE (for auth.users reference)
-- ====================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ====================================
-- USER ROLES TABLE (RBAC)
-- ====================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ====================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECK
-- ====================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to check if user has any admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = 'admin'
    )
$$;

-- Function to check if user has manager or higher role
CREATE OR REPLACE FUNCTION public.is_manager_or_above(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('admin', 'manager')
    )
$$;

-- Function to check if user has support or higher role
CREATE OR REPLACE FUNCTION public.is_support_or_above(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('admin', 'manager', 'support')
    )
$$;

-- Function to check if user has any admin role (viewer included)
CREATE OR REPLACE FUNCTION public.has_any_admin_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('admin', 'manager', 'support', 'viewer')
    )
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles" ON public.user_roles
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update roles" ON public.user_roles
    FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles" ON public.user_roles
    FOR DELETE USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- ====================================
-- CATEGORIES TABLE
-- ====================================
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    icon TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories" ON public.categories
    FOR SELECT USING (active = true OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "Managers can insert categories" ON public.categories
    FOR INSERT WITH CHECK (public.is_manager_or_above(auth.uid()));

CREATE POLICY "Managers can update categories" ON public.categories
    FOR UPDATE USING (public.is_manager_or_above(auth.uid()));

CREATE POLICY "Admins can delete categories" ON public.categories
    FOR DELETE USING (public.is_admin(auth.uid()));

-- ====================================
-- PRODUCT ATTRIBUTES TABLE
-- ====================================
CREATE TABLE public.product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'text',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view attributes" ON public.product_attributes
    FOR SELECT USING (true);

CREATE POLICY "Managers can manage attributes" ON public.product_attributes
    FOR ALL USING (public.is_manager_or_above(auth.uid()));

-- ====================================
-- PRODUCT ATTRIBUTE VALUES TABLE
-- ====================================
CREATE TABLE public.product_attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attribute_id UUID REFERENCES public.product_attributes(id) ON DELETE CASCADE NOT NULL,
    value TEXT NOT NULL,
    slug TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(attribute_id, slug)
);

ALTER TABLE public.product_attribute_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view attribute values" ON public.product_attribute_values
    FOR SELECT USING (true);

CREATE POLICY "Managers can manage attribute values" ON public.product_attribute_values
    FOR ALL USING (public.is_manager_or_above(auth.uid()));

-- ====================================
-- COLLECTIONS TABLE
-- ====================================
CREATE TABLE public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    type TEXT NOT NULL DEFAULT 'manual', -- 'manual' or 'dynamic'
    rules JSONB, -- For dynamic collections
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active collections" ON public.collections
    FOR SELECT USING (active = true OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "Managers can manage collections" ON public.collections
    FOR ALL USING (public.is_manager_or_above(auth.uid()));

-- ====================================
-- PRODUCTS TABLE
-- ====================================
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    specifications JSONB,
    price DECIMAL(10, 2) NOT NULL,
    compare_at_price DECIMAL(10, 2),
    cost DECIMAL(10, 2),
    sku TEXT,
    barcode TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    allow_backorder BOOLEAN NOT NULL DEFAULT false,
    weight DECIMAL(10, 3),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    secondary_category_ids UUID[],
    tags TEXT[],
    images TEXT[],
    main_image_index INTEGER NOT NULL DEFAULT 0,
    featured BOOLEAN NOT NULL DEFAULT false,
    bestseller BOOLEAN NOT NULL DEFAULT false,
    free_shipping BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    seo_title TEXT,
    seo_description TEXT,
    og_image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (active = true OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "Managers can insert products" ON public.products
    FOR INSERT WITH CHECK (public.is_manager_or_above(auth.uid()));

CREATE POLICY "Managers can update products" ON public.products
    FOR UPDATE USING (public.is_manager_or_above(auth.uid()));

CREATE POLICY "Admins can delete products" ON public.products
    FOR DELETE USING (public.is_admin(auth.uid()));

-- ====================================
-- PRODUCT VARIANTS TABLE
-- ====================================
CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    sku TEXT,
    price DECIMAL(10, 2),
    compare_at_price DECIMAL(10, 2),
    stock INTEGER NOT NULL DEFAULT 0,
    attributes JSONB NOT NULL DEFAULT '{}',
    image_url TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active variants" ON public.product_variants
    FOR SELECT USING (active = true OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "Managers can manage variants" ON public.product_variants
    FOR ALL USING (public.is_manager_or_above(auth.uid()));

-- ====================================
-- PRODUCT COLLECTIONS (junction)
-- ====================================
CREATE TABLE public.product_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(product_id, collection_id)
);

ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product collections" ON public.product_collections
    FOR SELECT USING (true);

CREATE POLICY "Managers can manage product collections" ON public.product_collections
    FOR ALL USING (public.is_manager_or_above(auth.uid()));

-- ====================================
-- CUSTOMERS TABLE
-- ====================================
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    cpf TEXT,
    tags TEXT[],
    notes TEXT,
    blocked BOOLEAN NOT NULL DEFAULT false,
    blocked_reason TEXT,
    total_spent DECIMAL(12, 2) NOT NULL DEFAULT 0,
    order_count INTEGER NOT NULL DEFAULT 0,
    last_order_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view customers" ON public.customers
    FOR SELECT USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Managers can manage customers" ON public.customers
    FOR ALL USING (public.is_manager_or_above(auth.uid()));

-- ====================================
-- CUSTOMER ADDRESSES TABLE
-- ====================================
CREATE TABLE public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    label TEXT,
    recipient_name TEXT NOT NULL,
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    complement TEXT,
    neighborhood TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view addresses" ON public.customer_addresses
    FOR SELECT USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Managers can manage addresses" ON public.customer_addresses
    FOR ALL USING (public.is_manager_or_above(auth.uid()));

-- ====================================
-- ORDERS TABLE
-- ====================================
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status public.order_status NOT NULL DEFAULT 'pending_payment',
    payment_status public.payment_status NOT NULL DEFAULT 'pending',
    payment_method public.payment_method,
    subtotal DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    coupon_code TEXT,
    shipping_address JSONB,
    billing_address JSONB,
    tracking_code TEXT,
    carrier TEXT,
    notes TEXT,
    internal_notes TEXT,
    payment_id TEXT,
    payment_data JSONB,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view orders" ON public.orders
    FOR SELECT USING (public.has_any_admin_role(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Support can update orders" ON public.orders
    FOR UPDATE USING (public.is_support_or_above(auth.uid()));

CREATE POLICY "Authenticated can insert orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ====================================
-- ORDER ITEMS TABLE
-- ====================================
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT,
    variant_attributes JSONB,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view order items" ON public.order_items
    FOR SELECT USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Authenticated can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ====================================
-- ORDER STATUS HISTORY TABLE
-- ====================================
CREATE TABLE public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    from_status public.order_status,
    to_status public.order_status NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view status history" ON public.order_status_history
    FOR SELECT USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Support can insert status history" ON public.order_status_history
    FOR INSERT WITH CHECK (public.is_support_or_above(auth.uid()));

-- ====================================
-- BANNERS TABLE
-- ====================================
CREATE TABLE public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type public.banner_type NOT NULL DEFAULT 'home_slider',
    title TEXT,
    subtitle TEXT,
    image_desktop TEXT NOT NULL,
    image_mobile TEXT,
    button_text TEXT,
    button_link TEXT,
    button_bg_color TEXT DEFAULT '#f97316',
    button_text_color TEXT DEFAULT '#ffffff',
    button_variant public.button_variant DEFAULT 'primary',
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners" ON public.banners
    FOR SELECT USING (
        (active = true AND (start_at IS NULL OR start_at <= now()) AND (end_at IS NULL OR end_at >= now()))
        OR public.has_any_admin_role(auth.uid())
    );

CREATE POLICY "Admins can manage banners" ON public.banners
    FOR ALL USING (public.is_admin(auth.uid()));

-- ====================================
-- COUPONS TABLE
-- ====================================
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    type public.coupon_type NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    min_cart_value DECIMAL(10, 2),
    max_discount DECIMAL(10, 2),
    usage_limit INTEGER,
    usage_per_customer INTEGER DEFAULT 1,
    used_count INTEGER NOT NULL DEFAULT 0,
    applicable_products UUID[],
    applicable_categories UUID[],
    stackable BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all coupons" ON public.coupons
    FOR SELECT USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Managers can manage coupons" ON public.coupons
    FOR ALL USING (public.is_manager_or_above(auth.uid()));

-- ====================================
-- COUPON USAGE TABLE
-- ====================================
CREATE TABLE public.coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    discount_applied DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view coupon usage" ON public.coupon_usage
    FOR SELECT USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Authenticated can insert usage" ON public.coupon_usage
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ====================================
-- SHIPPING RULES TABLE
-- ====================================
CREATE TABLE public.shipping_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'fixed', -- 'fixed', 'weight', 'free_above'
    min_zip TEXT,
    max_zip TEXT,
    min_weight DECIMAL(10, 3),
    max_weight DECIMAL(10, 3),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    free_above DECIMAL(10, 2),
    estimated_days_min INTEGER,
    estimated_days_max INTEGER,
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active shipping rules" ON public.shipping_rules
    FOR SELECT USING (active = true OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can manage shipping rules" ON public.shipping_rules
    FOR ALL USING (public.is_admin(auth.uid()));

-- ====================================
-- STORE PICKUP LOCATIONS TABLE
-- ====================================
CREATE TABLE public.pickup_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    phone TEXT,
    hours TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pickup_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pickup locations" ON public.pickup_locations
    FOR SELECT USING (active = true OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can manage pickup locations" ON public.pickup_locations
    FOR ALL USING (public.is_admin(auth.uid()));

-- ====================================
-- SEARCH FILTERS TABLE
-- ====================================
CREATE TABLE public.search_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    type public.filter_type NOT NULL,
    source TEXT NOT NULL, -- 'tag', 'attribute', 'field', 'computed'
    source_key TEXT, -- e.g., attribute slug or field name
    config JSONB, -- min/max for range, options for checkbox, etc.
    category_ids UUID[],
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.search_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active filters" ON public.search_filters
    FOR SELECT USING (active = true OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "Managers can manage filters" ON public.search_filters
    FOR ALL USING (public.is_manager_or_above(auth.uid()));

-- ====================================
-- THEME SETTINGS TABLE
-- ====================================
CREATE TABLE public.theme_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version INTEGER NOT NULL DEFAULT 1,
    is_current BOOLEAN NOT NULL DEFAULT false,
    primary_color TEXT NOT NULL DEFAULT '#f97316',
    secondary_color TEXT NOT NULL DEFAULT '#8b5cf6',
    accent_color TEXT NOT NULL DEFAULT '#8b5cf6',
    banner_cta_color TEXT NOT NULL DEFAULT '#f97316',
    font_primary TEXT NOT NULL DEFAULT 'Inter',
    font_secondary TEXT NOT NULL DEFAULT 'Plus Jakarta Sans',
    border_radius TEXT NOT NULL DEFAULT '0.5rem',
    button_style TEXT NOT NULL DEFAULT 'filled',
    badge_sale_color TEXT NOT NULL DEFAULT '#8b5cf6',
    badge_oos_color TEXT NOT NULL DEFAULT '#6b7280',
    badge_free_shipping_color TEXT NOT NULL DEFAULT '#22c55e',
    store_name TEXT NOT NULL DEFAULT 'Loja',
    store_logo TEXT,
    favicon TEXT,
    meta_title TEXT,
    meta_description TEXT,
    ga4_id TEXT,
    meta_pixel_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view current theme" ON public.theme_settings
    FOR SELECT USING (is_current = true OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can manage theme" ON public.theme_settings
    FOR ALL USING (public.is_admin(auth.uid()));

-- ====================================
-- PAYMENT SETTINGS TABLE
-- ====================================
CREATE TABLE public.payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'mercadopago',
    environment TEXT NOT NULL DEFAULT 'sandbox', -- 'sandbox' or 'production'
    max_installments INTEGER NOT NULL DEFAULT 12,
    min_installment_value DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
    pix_enabled BOOLEAN NOT NULL DEFAULT true,
    credit_card_enabled BOOLEAN NOT NULL DEFAULT true,
    boleto_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payment settings" ON public.payment_settings
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage payment settings" ON public.payment_settings
    FOR ALL USING (public.is_admin(auth.uid()));

-- ====================================
-- WEBHOOK LOGS TABLE
-- ====================================
CREATE TABLE public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'received', -- 'received', 'processed', 'failed'
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook logs" ON public.webhook_logs
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can insert webhook logs" ON public.webhook_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update webhook logs" ON public.webhook_logs
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- ====================================
-- AUDIT LOGS TABLE
-- ====================================
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    before_data JSONB,
    after_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- ====================================
-- SHOWCASE SECTIONS TABLE (Vitrines)
-- ====================================
CREATE TABLE public.showcase_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'featured', 'bestseller', 'discount', 'new'
    title TEXT,
    subtitle TEXT,
    product_ids UUID[],
    max_products INTEGER DEFAULT 8,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.showcase_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active showcases" ON public.showcase_sections
    FOR SELECT USING (active = true OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can manage showcases" ON public.showcase_sections
    FOR ALL USING (public.is_admin(auth.uid()));

-- ====================================
-- TRIGGERS FOR UPDATED_AT
-- ====================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_addresses_updated_at BEFORE UPDATE ON public.customer_addresses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipping_rules_updated_at BEFORE UPDATE ON public.shipping_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pickup_locations_updated_at BEFORE UPDATE ON public.pickup_locations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_search_filters_updated_at BEFORE UPDATE ON public.search_filters
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_theme_settings_updated_at BEFORE UPDATE ON public.theme_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_settings_updated_at BEFORE UPDATE ON public.payment_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_showcase_sections_updated_at BEFORE UPDATE ON public.showcase_sections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================
-- FUNCTION TO GENERATE ORDER NUMBER
-- ====================================
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('public.order_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
    EXECUTE FUNCTION public.generate_order_number();

-- ====================================
-- INDEXES FOR PERFORMANCE
-- ====================================
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_active ON public.products(active);
CREATE INDEX idx_products_tags ON public.products USING GIN(tags);

CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX idx_orders_number ON public.orders(order_number);

CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);

CREATE INDEX idx_banners_type ON public.banners(type);
CREATE INDEX idx_banners_active ON public.banners(active);

CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_user ON public.customers(user_id);