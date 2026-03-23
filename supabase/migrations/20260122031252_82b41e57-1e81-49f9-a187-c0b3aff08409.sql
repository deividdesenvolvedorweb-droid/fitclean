-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('products', 'products', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for banner images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('banners', 'banners', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for products bucket
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products' 
  AND public.has_any_admin_role(auth.uid())
);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products' 
  AND public.has_any_admin_role(auth.uid())
);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products' 
  AND public.has_any_admin_role(auth.uid())
);

-- RLS policies for banners bucket
CREATE POLICY "Anyone can view banner images"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Admins can upload banner images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'banners' 
  AND public.has_any_admin_role(auth.uid())
);

CREATE POLICY "Admins can update banner images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'banners' 
  AND public.has_any_admin_role(auth.uid())
);

CREATE POLICY "Admins can delete banner images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'banners' 
  AND public.has_any_admin_role(auth.uid())
);