
ALTER TABLE public.payment_settings 
  ADD COLUMN IF NOT EXISTS installment_type text NOT NULL DEFAULT 'sem_juros',
  ADD COLUMN IF NOT EXISTS installment_interest_rate numeric NOT NULL DEFAULT 1.99,
  ADD COLUMN IF NOT EXISTS mp_fee_pix numeric NOT NULL DEFAULT 0.99,
  ADD COLUMN IF NOT EXISTS mp_fee_credit numeric NOT NULL DEFAULT 4.98,
  ADD COLUMN IF NOT EXISTS mp_fee_boleto numeric NOT NULL DEFAULT 3.49;
