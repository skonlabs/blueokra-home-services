-- Drop and recreate UPDATE policy with WITH CHECK clause
DROP POLICY IF EXISTS "Users can update their own profile picture" ON storage.objects;
CREATE POLICY "Users can update their own profile picture" ON storage.objects
FOR UPDATE TO authenticated
USING ((bucket_id = 'profile-pictures'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))
WITH CHECK ((bucket_id = 'profile-pictures'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]));

-- Make profile pictures viewable by everyone (including anon)
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;
CREATE POLICY "Anyone can view profile pictures" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'profile-pictures'::text);