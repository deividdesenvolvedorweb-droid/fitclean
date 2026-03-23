
-- Add is_digital column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_digital BOOLEAN NOT NULL DEFAULT false;

-- Allow customers to view and update their own data (linked by user_id)
CREATE POLICY "Customers can view own data"
ON public.customers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Customers can update own data"
ON public.customers
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow customers to insert themselves
CREATE POLICY "Authenticated can insert customers"
ON public.customers
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow customers to view their own addresses
CREATE POLICY "Customers can view own addresses"
ON public.customer_addresses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = customer_addresses.customer_id AND c.user_id = auth.uid()
  )
);

-- Allow customers to insert their own addresses
CREATE POLICY "Customers can insert own addresses"
ON public.customer_addresses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = customer_addresses.customer_id AND c.user_id = auth.uid()
  )
);

-- Allow customers to update their own addresses
CREATE POLICY "Customers can update own addresses"
ON public.customer_addresses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = customer_addresses.customer_id AND c.user_id = auth.uid()
  )
);

-- Allow customers to view their own orders
CREATE POLICY "Customers can view own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

-- Allow customers to view their own order items
CREATE POLICY "Customers can view own order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  )
);
