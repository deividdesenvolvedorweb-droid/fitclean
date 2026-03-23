
ALTER TABLE public.payment_settings 
  ADD COLUMN IF NOT EXISTS pix_timeout_minutes integer NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS boleto_timeout_hours integer NOT NULL DEFAULT 72;
