
ALTER TABLE public.product_variants 
  ADD COLUMN IF NOT EXISTS payment_config jsonb DEFAULT NULL;

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS min_variant_price numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_variant_price numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_variants boolean NOT NULL DEFAULT false;
