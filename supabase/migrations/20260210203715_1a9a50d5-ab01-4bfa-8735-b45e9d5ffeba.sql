
-- Seed default theme_settings if empty
INSERT INTO public.theme_settings (is_current, store_name, primary_color, secondary_color, accent_color)
SELECT true, 'Minha Loja', '#f97316', '#8b5cf6', '#8b5cf6'
WHERE NOT EXISTS (SELECT 1 FROM public.theme_settings WHERE is_current = true);

-- Create home_blocks table
CREATE TABLE IF NOT EXISTS public.home_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  config jsonb DEFAULT '{}',
  sort_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.home_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active home blocks"
  ON public.home_blocks FOR SELECT
  USING ((active = true) OR has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can manage home blocks"
  ON public.home_blocks FOR ALL
  USING (is_admin(auth.uid()));
