-- Add image_url column to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create a new storage bucket for service images if it doesn't exist
-- (This comment is only for reference, you need to create the bucket in the Supabase dashboard
-- or via API if it doesn't already exist) 