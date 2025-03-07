-- Add notifications column to user_profiles table (or create it if it doesn't exist)
-- Check if a user_profiles table exists, if not create it
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  notifications BOOLEAN DEFAULT TRUE NOT NULL
);

-- If the table already exists but doesn't have the notifications column, add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'notifications'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN notifications BOOLEAN DEFAULT TRUE NOT NULL;
  END IF;
END $$;

-- Create or replace a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, notifications)
  VALUES (NEW.id, TRUE)
  ON CONFLICT (id) 
  DO UPDATE SET id = EXCLUDED.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create RLS policies for the user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own profile
CREATE POLICY "Users can read their own profile" 
  ON public.user_profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Allow public access to the table (still restricted by RLS)
GRANT SELECT, UPDATE ON public.user_profiles TO authenticated;