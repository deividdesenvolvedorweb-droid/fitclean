-- ============================================================
-- SCRIPT COMPLETO DE MIGRAÇÃO - FitClean E-commerce
-- Compatível com Supabase (nova conta)
-- Inclui: Enums, Sequences, Functions, Tables, Triggers,
--         RLS, Policies, Storage, Realtime
-- Data: 2026-03-07
-- ============================================================

-- ==================== ENUMS ====================
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'support', 'viewer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.banner_type AS ENUM ('home_slider', 'category', 'promo_bar', 'topbar'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.button_variant AS ENUM ('primary', 'outline', 'secondary'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.coupon_type AS ENUM ('percentage', 'fixed', 'free_shipping'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.filter_type AS ENUM ('checkbox', 'radio', 'slider', 'range', 'boolean'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.order_status AS ENUM ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'canceled', 'refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payment_method AS ENUM ('pix', 'credit_card', 'boleto'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'rejected', 'chargeback'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==================== SEQUENCES ====================
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

-- ==================== FUNCTIONS ====================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
    NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('public.order_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
    SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
    SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_manager_or_above(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
    SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'manager'))
$$;

CREATE OR REPLACE FUNCTION public.is_support_or_above(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
    SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'manager', 'support'))
$$;

CREATE OR REPLACE FUNCTION public.has_any_admin_role(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
    SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'manager', 'support', 'viewer'))
$$;

-- ==================== TABLES ====================

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    full_name text,
    email text,
    phone text,
    avatar_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    role app_role NOT NULL,
    created_by uuid,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- categories
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image_url text,
    icon text,
    parent_id uuid REFERENCES public.categories(id),
    sort_order integer NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- products
CREATE TABLE IF NOT EXISTS public.products (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    description_blocks jsonb,
    price numeric NOT NULL,
    compare_at_price numeric,
    cost numeric,
    sku text,
    barcode text,
    stock integer NOT NULL DEFAULT 0,
    min_stock integer NOT NULL DEFAULT 0,
    unlimited_stock boolean NOT NULL DEFAULT false,
    allow_backorder boolean NOT NULL DEFAULT false,
    weight numeric,
    images text[],
    main_image_index integer NOT NULL DEFAULT 0,
    category_id uuid REFERENCES public.categories(id),
    secondary_category_ids text[],
    tags text[],
    featured boolean NOT NULL DEFAULT false,
    bestseller boolean NOT NULL DEFAULT false,
    free_shipping boolean NOT NULL DEFAULT false,
    active boolean NOT NULL DEFAULT true,
    is_digital boolean NOT NULL DEFAULT false,
    has_variants boolean NOT NULL DEFAULT false,
    min_variant_price numeric,
    max_variant_price numeric,
    specifications jsonb,
    payment_config jsonb,
    seo_title text,
    seo_description text,
    og_image text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- product_attributes
CREATE TABLE IF NOT EXISTS public.product_attributes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL,
    type text NOT NULL DEFAULT 'text',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- product_attribute_values
CREATE TABLE IF NOT EXISTS public.product_attribute_values (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    attribute_id uuid NOT NULL REFERENCES public.product_attributes(id),
    value text NOT NULL,
    slug text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- product_variants
CREATE TABLE IF NOT EXISTS public.product_variants (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES public.products(id),
    sku text,
    price numeric,
    compare_at_price numeric,
    stock integer NOT NULL DEFAULT 0,
    attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
    image_url text,
    payment_config jsonb,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- collections
CREATE TABLE IF NOT EXISTS public.collections (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image_url text,
    type text NOT NULL DEFAULT 'manual',
    rules jsonb,
    sort_order integer NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- product_collections
CREATE TABLE IF NOT EXISTS public.product_collections (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES public.products(id),
    collection_id uuid NOT NULL REFERENCES public.collections(id),
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- customers
CREATE TABLE IF NOT EXISTS public.customers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    email text NOT NULL,
    full_name text,
    phone text,
    cpf text,
    tags text[],
    notes text,
    blocked boolean NOT NULL DEFAULT false,
    blocked_reason text,
    total_spent numeric NOT NULL DEFAULT 0,
    order_count integer NOT NULL DEFAULT 0,
    last_order_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- customer_addresses
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid NOT NULL REFERENCES public.customers(id),
    recipient_name text NOT NULL,
    street text NOT NULL,
    number text NOT NULL,
    complement text,
    neighborhood text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    zip_code text NOT NULL,
    label text,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- orders
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number text NOT NULL,
    customer_id uuid REFERENCES public.customers(id),
    user_id uuid,
    status order_status NOT NULL DEFAULT 'pending_payment',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    payment_method payment_method,
    payment_id text,
    mp_payment_id text,
    mp_payment_status text,
    payment_data jsonb,
    subtotal numeric NOT NULL,
    discount numeric NOT NULL DEFAULT 0,
    shipping_cost numeric NOT NULL DEFAULT 0,
    total numeric NOT NULL,
    coupon_code text,
    shipping_address jsonb,
    billing_address jsonb,
    tracking_code text,
    carrier text,
    notes text,
    internal_notes text,
    shipped_at timestamptz,
    delivered_at timestamptz,
    canceled_at timestamptz,
    refunded_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- order_items
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id),
    product_id uuid REFERENCES public.products(id),
    variant_id uuid REFERENCES public.product_variants(id),
    product_name text NOT NULL,
    product_sku text,
    variant_attributes jsonb,
    quantity integer NOT NULL,
    unit_price numeric NOT NULL,
    total_price numeric NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- order_status_history
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id),
    from_status order_status,
    to_status order_status NOT NULL,
    changed_by uuid,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- banners
CREATE TABLE IF NOT EXISTS public.banners (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text,
    subtitle text,
    image_desktop text NOT NULL,
    image_mobile text,
    button_text text,
    button_link text,
    button_bg_color text DEFAULT '#f97316',
    button_text_color text DEFAULT '#ffffff',
    button_variant button_variant DEFAULT 'primary',
    type banner_type NOT NULL DEFAULT 'home_slider',
    category_id uuid REFERENCES public.categories(id),
    sort_order integer NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    start_at timestamptz,
    end_at timestamptz,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- coupons
CREATE TABLE IF NOT EXISTS public.coupons (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code text NOT NULL,
    type coupon_type NOT NULL,
    value numeric NOT NULL,
    min_cart_value numeric,
    max_discount numeric,
    usage_limit integer,
    usage_per_customer integer DEFAULT 1,
    used_count integer NOT NULL DEFAULT 0,
    applicable_products text[],
    applicable_categories text[],
    stackable boolean NOT NULL DEFAULT false,
    active boolean NOT NULL DEFAULT true,
    start_at timestamptz,
    end_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- coupon_usage
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id uuid NOT NULL REFERENCES public.coupons(id),
    order_id uuid REFERENCES public.orders(id),
    customer_id uuid REFERENCES public.customers(id),
    discount_applied numeric NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- shipping_rules
CREATE TABLE IF NOT EXISTS public.shipping_rules (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    type text NOT NULL DEFAULT 'fixed',
    min_zip text,
    max_zip text,
    min_weight numeric,
    max_weight numeric,
    price numeric NOT NULL DEFAULT 0,
    free_above numeric,
    estimated_days_min integer,
    estimated_days_max integer,
    active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- pickup_locations
CREATE TABLE IF NOT EXISTS public.pickup_locations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    zip_code text NOT NULL,
    phone text,
    hours text,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- search_filters
CREATE TABLE IF NOT EXISTS public.search_filters (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL,
    type filter_type NOT NULL,
    source text NOT NULL,
    source_key text,
    config jsonb,
    category_ids text[],
    sort_order integer NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- showcase_sections
CREATE TABLE IF NOT EXISTS public.showcase_sections (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL,
    title text,
    subtitle text,
    type text NOT NULL DEFAULT 'manual',
    product_ids text[],
    max_products integer DEFAULT 8,
    sort_order integer NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- theme_settings
CREATE TABLE IF NOT EXISTS public.theme_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    store_name text NOT NULL DEFAULT 'Loja',
    store_logo text,
    primary_color text NOT NULL DEFAULT '#f97316',
    secondary_color text NOT NULL DEFAULT '#8b5cf6',
    accent_color text NOT NULL DEFAULT '#8b5cf6',
    banner_cta_color text NOT NULL DEFAULT '#f97316',
    badge_sale_color text NOT NULL DEFAULT '#8b5cf6',
    badge_oos_color text NOT NULL DEFAULT '#6b7280',
    badge_free_shipping_color text NOT NULL DEFAULT '#22c55e',
    font_primary text NOT NULL DEFAULT 'Inter',
    font_secondary text NOT NULL DEFAULT 'Plus Jakarta Sans',
    border_radius text NOT NULL DEFAULT '0.5rem',
    button_style text NOT NULL DEFAULT 'filled',
    favicon text,
    meta_title text,
    meta_description text,
    ga4_id text,
    meta_pixel_id text,
    version integer NOT NULL DEFAULT 1,
    is_current boolean NOT NULL DEFAULT false,
    updated_by uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- store_settings
CREATE TABLE IF NOT EXISTS public.store_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    store_name text NOT NULL DEFAULT 'Minha Loja',
    store_description text,
    store_logo text,
    favicon text,
    phone text,
    whatsapp text,
    email text,
    address text,
    city text,
    state text,
    zip_code text,
    instagram_url text,
    facebook_url text,
    youtube_url text,
    tiktok_url text,
    twitter_url text,
    announcement_text text,
    announcement_active boolean DEFAULT true,
    free_shipping_threshold numeric DEFAULT 299,
    max_installments integer DEFAULT 12,
    pix_discount_percent numeric DEFAULT 5,
    meta_title text,
    meta_description text,
    ga4_id text,
    meta_pixel_id text,
    is_current boolean DEFAULT true,
    updated_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- payment_settings
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider text NOT NULL DEFAULT 'mercadopago',
    environment text NOT NULL DEFAULT 'sandbox',
    mp_public_key text,
    mp_access_token text,
    max_installments integer NOT NULL DEFAULT 12,
    min_installment_value numeric NOT NULL DEFAULT 5.00,
    pix_enabled boolean NOT NULL DEFAULT true,
    credit_card_enabled boolean NOT NULL DEFAULT true,
    boleto_enabled boolean NOT NULL DEFAULT true,
    pix_timeout_minutes integer NOT NULL DEFAULT 120,
    boleto_timeout_hours integer NOT NULL DEFAULT 72,
    installment_type text NOT NULL DEFAULT 'sem_juros',
    installment_interest_rate numeric NOT NULL DEFAULT 1.99,
    mp_fee_pix numeric NOT NULL DEFAULT 0.99,
    mp_fee_credit numeric NOT NULL DEFAULT 4.98,
    mp_fee_boleto numeric NOT NULL DEFAULT 3.49,
    updated_by uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- home_blocks
CREATE TABLE IF NOT EXISTS public.home_blocks (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb,
    sort_order integer DEFAULT 0,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    user_email text,
    action text NOT NULL,
    entity text NOT NULL,
    entity_id uuid,
    before_data jsonb,
    after_data jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- webhook_logs
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider text NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    status text NOT NULL DEFAULT 'received',
    error_message text,
    processed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ==================== TRIGGERS ====================
DROP TRIGGER IF EXISTS generate_order_number_trigger ON public.orders;
CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
    EXECUTE FUNCTION public.generate_order_number();

-- updated_at triggers para todas as tabelas
DO $$ 
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'profiles','categories','products','product_variants','collections',
        'customers','customer_addresses','orders','banners','coupons',
        'shipping_rules','pickup_locations','search_filters','showcase_sections',
        'theme_settings','store_settings','payment_settings','home_blocks'
    ]
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%I', t, t);
        EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
    END LOOP;
END $$;

-- ==================== RLS ENABLE ====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcase_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- ==================== RLS POLICIES ====================

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_any_admin_role(auth.uid()));

-- user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (is_admin(auth.uid()));

-- categories
CREATE POLICY "Anyone can view active categories" ON public.categories FOR SELECT USING ((active = true) OR has_any_admin_role(auth.uid()));
CREATE POLICY "Managers can insert categories" ON public.categories FOR INSERT WITH CHECK (is_manager_or_above(auth.uid()));
CREATE POLICY "Managers can update categories" ON public.categories FOR UPDATE USING (is_manager_or_above(auth.uid()));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (is_admin(auth.uid()));

-- products
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING ((active = true) OR has_any_admin_role(auth.uid()));
CREATE POLICY "Managers can insert products" ON public.products FOR INSERT WITH CHECK (is_manager_or_above(auth.uid()));
CREATE POLICY "Managers can update products" ON public.products FOR UPDATE USING (is_manager_or_above(auth.uid()));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (is_admin(auth.uid()));

-- product_attributes
CREATE POLICY "Anyone can view attributes" ON public.product_attributes FOR SELECT USING (true);
CREATE POLICY "Managers can manage attributes" ON public.product_attributes FOR ALL USING (is_manager_or_above(auth.uid()));

-- product_attribute_values
CREATE POLICY "Anyone can view attribute values" ON public.product_attribute_values FOR SELECT USING (true);
CREATE POLICY "Managers can manage attribute values" ON public.product_attribute_values FOR ALL USING (is_manager_or_above(auth.uid()));

-- product_variants
CREATE POLICY "Anyone can view active variants" ON public.product_variants FOR SELECT USING ((active = true) OR has_any_admin_role(auth.uid()));
CREATE POLICY "Managers can manage variants" ON public.product_variants FOR ALL USING (is_manager_or_above(auth.uid()));

-- collections
CREATE POLICY "Anyone can view active collections" ON public.collections FOR SELECT USING ((active = true) OR has_any_admin_role(auth.uid()));
CREATE POLICY "Managers can manage collections" ON public.collections FOR ALL USING (is_manager_or_above(auth.uid()));

-- product_collections
CREATE POLICY "Anyone can view product collections" ON public.product_collections FOR SELECT USING (true);
CREATE POLICY "Managers can manage product collections" ON public.product_collections FOR ALL USING (is_manager_or_above(auth.uid()));

-- customers
CREATE POLICY "Customers can view own data" ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Customers can update own data" ON public.customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can insert customers" ON public.customers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can view customers" ON public.customers FOR SELECT USING (has_any_admin_role(auth.uid()));
CREATE POLICY "Managers can manage customers" ON public.customers FOR ALL USING (is_manager_or_above(auth.uid()));

-- customer_addresses
CREATE POLICY "Customers can view own addresses" ON public.customer_addresses FOR SELECT USING (EXISTS (SELECT 1 FROM customers c WHERE c.id = customer_addresses.customer_id AND c.user_id = auth.uid()));
CREATE POLICY "Customers can insert own addresses" ON public.customer_addresses FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM customers c WHERE c.id = customer_addresses.customer_id AND c.user_id = auth.uid()));
CREATE POLICY "Customers can update own addresses" ON public.customer_addresses FOR UPDATE USING (EXISTS (SELECT 1 FROM customers c WHERE c.id = customer_addresses.customer_id AND c.user_id = auth.uid()));
CREATE POLICY "Staff can view addresses" ON public.customer_addresses FOR SELECT USING (has_any_admin_role(auth.uid()));
CREATE POLICY "Managers can manage addresses" ON public.customer_addresses FOR ALL USING (is_manager_or_above(auth.uid()));

-- orders
CREATE POLICY "Customers can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view orders" ON public.orders FOR SELECT USING (has_any_admin_role(auth.uid()) OR auth.uid() = user_id);
CREATE POLICY "Authenticated can insert orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Support can update orders" ON public.orders FOR UPDATE USING (is_support_or_above(auth.uid()));

-- order_items
CREATE POLICY "Customers can view own order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));
CREATE POLICY "Staff can view order items" ON public.order_items FOR SELECT USING (has_any_admin_role(auth.uid()));
CREATE POLICY "Authenticated can insert order items" ON public.order_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- order_status_history
CREATE POLICY "Staff can view status history" ON public.order_status_history FOR SELECT USING (has_any_admin_role(auth.uid()));
CREATE POLICY "Support can insert status history" ON public.order_status_history FOR INSERT WITH CHECK (is_support_or_above(auth.uid()));

-- banners
CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT USING (((active = true) AND (start_at IS NULL OR start_at <= now()) AND (end_at IS NULL OR end_at >= now())) OR has_any_admin_role(auth.uid()));
CREATE POLICY "Admins can manage banners" ON public.banners FOR ALL USING (is_admin(auth.uid()));

-- coupons
CREATE POLICY "Admins can view all coupons" ON public.coupons FOR SELECT USING (has_any_admin_role(auth.uid()));
CREATE POLICY "Managers can manage coupons" ON public.coupons FOR ALL USING (is_manager_or_above(auth.uid()));

-- coupon_usage
CREATE POLICY "Authenticated can insert usage" ON public.coupon_usage FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can view coupon usage" ON public.coupon_usage FOR SELECT USING (has_any_admin_role(auth.uid()));

-- shipping_rules
CREATE POLICY "Anyone can view active shipping rules" ON public.shipping_rules FOR SELECT USING ((active = true) OR has_any_admin_role(auth.uid()));
CREATE POLICY "Admins can manage shipping rules" ON public.shipping_rules FOR ALL USING (is_admin(auth.uid()));

-- pickup_locations
CREATE POLICY "Anyone can view active pickup locations" ON public.pickup_locations FOR SELECT USING ((active = true) OR has_any_admin_role(auth.uid()));
CREATE POLICY "Admins can manage pickup locations" ON public.pickup_locations FOR ALL USING (is_admin(auth.uid()));

-- search_filters
CREATE POLICY "Anyone can view active filters" ON public.search_filters FOR SELECT USING ((active = true) OR has_any_admin_role(auth.uid()));
CREATE POLICY "Managers can manage filters" ON public.search_filters FOR ALL USING (is_manager_or_above(auth.uid()));

-- showcase_sections
CREATE POLICY "Anyone can view active showcases" ON public.showcase_sections FOR SELECT USING ((active = true) OR has_any_admin_role(auth.uid()));
CREATE POLICY "Admins can manage showcases" ON public.showcase_sections FOR ALL USING (is_admin(auth.uid()));

-- theme_settings
CREATE POLICY "Anyone can view current theme" ON public.theme_settings FOR SELECT USING ((is_current = true) OR has_any_admin_role(auth.uid()));
CREATE POLICY "Admins can manage theme" ON public.theme_settings FOR ALL USING (is_admin(auth.uid()));

-- store_settings
CREATE POLICY "Anyone can view current store settings" ON public.store_settings FOR SELECT USING ((is_current = true) OR has_any_admin_role(auth.uid()));
CREATE POLICY "Managers can manage store settings" ON public.store_settings FOR ALL USING (is_manager_or_above(auth.uid()));

-- payment_settings
CREATE POLICY "Authenticated users can read payment settings" ON public.payment_settings FOR SELECT USING (true);
CREATE POLICY "Admins can view payment settings" ON public.payment_settings FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage payment settings" ON public.payment_settings FOR ALL USING (is_admin(auth.uid()));

-- home_blocks
CREATE POLICY "Anyone can view active home blocks" ON public.home_blocks FOR SELECT USING ((active = true) OR has_any_admin_role(auth.uid()));
CREATE POLICY "Admins can manage home blocks" ON public.home_blocks FOR ALL USING (is_admin(auth.uid()));

-- audit_logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- webhook_logs
CREATE POLICY "Service can insert webhook logs" ON public.webhook_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view webhook logs" ON public.webhook_logs FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update webhook logs" ON public.webhook_logs FOR UPDATE USING (is_admin(auth.uid()));

-- ==================== STORAGE BUCKETS ====================
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('layout', 'layout', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies - permitir upload público e leitura pública
DO $$
DECLARE
    b text;
BEGIN
    FOREACH b IN ARRAY ARRAY['products', 'banners', 'layout']
    LOOP
        -- Leitura pública
        EXECUTE format(
            'CREATE POLICY "Public read %s" ON storage.objects FOR SELECT USING (bucket_id = %L)',
            b, b
        );
        -- Upload para admins
        EXECUTE format(
            'CREATE POLICY "Admin upload %s" ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L AND public.is_manager_or_above(auth.uid()))',
            b, b
        );
        -- Update para admins
        EXECUTE format(
            'CREATE POLICY "Admin update %s" ON storage.objects FOR UPDATE USING (bucket_id = %L AND public.is_manager_or_above(auth.uid()))',
            b, b
        );
        -- Delete para admins
        EXECUTE format(
            'CREATE POLICY "Admin delete %s" ON storage.objects FOR DELETE USING (bucket_id = %L AND public.is_manager_or_above(auth.uid()))',
            b, b
        );
    END LOOP;
END $$;

-- ==================== REALTIME ====================
-- Habilitar realtime para TODAS as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_attributes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_attribute_values;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_variants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_collections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_addresses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.banners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coupon_usage;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipping_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pickup_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.search_filters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.showcase_sections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.theme_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.home_blocks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.webhook_logs;

-- ==================== SEED DATA ====================
INSERT INTO public.theme_settings (store_name, is_current)
SELECT 'Loja', true
WHERE NOT EXISTS (SELECT 1 FROM public.theme_settings WHERE is_current = true);

INSERT INTO public.store_settings (store_name, is_current)
SELECT 'Minha Loja', true
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings WHERE is_current = true);

INSERT INTO public.payment_settings (provider, environment)
SELECT 'mercadopago', 'sandbox'
WHERE NOT EXISTS (SELECT 1 FROM public.payment_settings LIMIT 1);

-- ============================================================
-- PRONTO! Execute este SQL no SQL Editor da nova conta Supabase.
-- Depois, crie um usuário admin e insira manualmente:
--   INSERT INTO public.user_roles (user_id, role) 
--   VALUES ('SEU-USER-UUID', 'admin');
-- ============================================================
