-- Add policies for anonymous access to menu_items
CREATE POLICY "Allow anonymous to read menu_items" 
ON public.menu_items
FOR SELECT 
TO anon
USING (true);

-- Add policies for anonymous access to services
CREATE POLICY "Allow anonymous to read services" 
ON services
FOR SELECT 
TO anon
USING (true);

-- Also add the building_id column to services if it doesn't exist
ALTER TABLE services ADD COLUMN IF NOT EXISTS building_id UUID REFERENCES public.buildings(id); 