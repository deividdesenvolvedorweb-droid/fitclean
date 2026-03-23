-- Create store_settings table for dynamic store configuration
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Store Info
  store_name TEXT NOT NULL DEFAULT 'Minha Loja',
  store_description TEXT,
  store_logo TEXT,
  favicon TEXT,
  
  -- Contact
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  
  -- Social Media
  instagram_url TEXT,
  facebook_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  twitter_url TEXT,
  
  -- Shipping Display
  free_shipping_threshold NUMERIC DEFAULT 299,
  
  -- Payment Display
  max_installments INTEGER DEFAULT 12,
  pix_discount_percent NUMERIC DEFAULT 5,
  
  -- Announcement Bar
  announcement_text TEXT,
  announcement_active BOOLEAN DEFAULT true,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Analytics
  ga4_id TEXT,
  meta_pixel_id TEXT,
  
  -- Control
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view current settings
CREATE POLICY "Anyone can view current store settings"
ON public.store_settings
FOR SELECT
USING (is_current = true OR has_any_admin_role(auth.uid()));

-- Managers can manage settings
CREATE POLICY "Managers can manage store settings"
ON public.store_settings
FOR ALL
USING (is_manager_or_above(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.store_settings (
  store_name,
  store_description,
  phone,
  whatsapp,
  email,
  address,
  city,
  state,
  instagram_url,
  facebook_url,
  youtube_url,
  free_shipping_threshold,
  max_installments,
  pix_discount_percent,
  announcement_text,
  announcement_active,
  meta_title,
  meta_description
) VALUES (
  'BeautyStore',
  'Produtos profissionais de estética com a qualidade que você merece. Entrega para todo o Brasil.',
  '(11) 99999-9999',
  '(11) 99999-9999',
  'contato@beautystore.com.br',
  'Rua Exemplo, 123',
  'São Paulo',
  'SP',
  'https://instagram.com/beautystore',
  'https://facebook.com/beautystore',
  'https://youtube.com/beautystore',
  299,
  12,
  5,
  'Frete Grátis em compras acima de R$ 299 | Parcele em até 12x sem juros',
  true,
  'BeautyStore - Produtos Profissionais de Estética',
  'Encontre os melhores produtos de estética profissional. Entrega para todo o Brasil com frete grátis acima de R$ 299.'
);