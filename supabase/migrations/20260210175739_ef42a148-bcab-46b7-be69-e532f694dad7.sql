
-- Add Mercado Pago credentials to payment_settings
ALTER TABLE public.payment_settings
  ADD COLUMN IF NOT EXISTS mp_public_key TEXT,
  ADD COLUMN IF NOT EXISTS mp_access_token TEXT;

-- Add Mercado Pago tracking to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS mp_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_payment_status TEXT;
