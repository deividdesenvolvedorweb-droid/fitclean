-- Add unlimited_stock column to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS unlimited_stock BOOLEAN NOT NULL DEFAULT false;