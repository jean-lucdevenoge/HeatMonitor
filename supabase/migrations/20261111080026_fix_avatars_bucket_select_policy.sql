-- Drop the broad SELECT policy on the public avatars bucket.
-- Public buckets serve objects via URL without any RLS SELECT policy,
-- so this policy is unnecessary and only lets clients enumerate all files.
DROP POLICY IF EXISTS "Allow authenticated users to view avatars bucket" ON storage.objects;
