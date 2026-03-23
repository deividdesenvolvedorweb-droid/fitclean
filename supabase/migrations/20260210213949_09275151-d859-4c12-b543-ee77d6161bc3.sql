
-- Create layout storage bucket for media uploads in the layout builder
INSERT INTO storage.buckets (id, name, public) VALUES ('layout', 'layout', true);

-- Allow public read access to layout bucket
CREATE POLICY "Layout images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'layout');

-- Allow authenticated users (admins) to upload to layout bucket
CREATE POLICY "Admins can upload layout media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'layout' AND auth.uid() IS NOT NULL);

-- Allow authenticated users (admins) to update layout media
CREATE POLICY "Admins can update layout media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'layout' AND auth.uid() IS NOT NULL);

-- Allow authenticated users (admins) to delete layout media
CREATE POLICY "Admins can delete layout media"
ON storage.objects FOR DELETE
USING (bucket_id = 'layout' AND auth.uid() IS NOT NULL);

-- Add description_blocks column to products table
ALTER TABLE public.products ADD COLUMN description_blocks jsonb;
