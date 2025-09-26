-- Add odometer image column to bons table
ALTER TABLE public.bons ADD COLUMN odometer_image_url TEXT;

-- Create storage bucket for odometer images
INSERT INTO storage.buckets (id, name, public) VALUES ('odometer-images', 'odometer-images', true);

-- Create storage policies for odometer images
CREATE POLICY "Authenticated users can upload odometer images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'odometer-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view odometer images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'odometer-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update their own odometer images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'odometer-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete their own odometer images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'odometer-images' AND auth.uid() IS NOT NULL);