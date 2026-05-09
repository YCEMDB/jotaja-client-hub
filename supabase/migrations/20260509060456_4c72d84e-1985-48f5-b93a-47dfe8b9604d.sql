
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "product_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "product_images_team_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND public.has_restaurant_access(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "product_images_team_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_restaurant_access(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "product_images_team_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_restaurant_access(auth.uid(), ((storage.foldername(name))[1])::uuid)
);
