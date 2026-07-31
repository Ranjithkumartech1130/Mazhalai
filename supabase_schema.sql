-- ==========================================
-- Mazhalai Daycare - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create Tables

-- Global site content (Hero text, About text, Contact info)
CREATE TABLE IF NOT EXISTS site_content (
  id integer PRIMARY KEY DEFAULT 1,
  hero_title text DEFAULT 'Where Little Minds Blossom & Grow',
  hero_subtitle text DEFAULT 'Providing a safe, nurturing and joyful environment where children learn, explore and build confidence.',
  hero_image_url text,
  about_text text DEFAULT 'Mazhalai Preschool believes early childhood education creates the foundation for lifelong learning.',
  phone text DEFAULT '+91 95004 46103',
  email text DEFAULT 'info@mazhalaidaycare.com',
  address text DEFAULT '29, Om Shanthinagar, Opposite to Lathangi School, T.Kottampatty, Pollachi-02.',
  map_url text,
  facebook_url text,
  instagram_url text,
  whatsapp_number text DEFAULT '919500446103',
  -- Ensure only one row exists
  CONSTRAINT site_content_single_row CHECK (id = 1)
);

-- Insert initial row if empty
INSERT INTO site_content (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Programs (Play Group, Pre-KG, etc.)
CREATE TABLE IF NOT EXISTS programs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  age_group text NOT NULL,
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Initial Programs
INSERT INTO programs (title, age_group, description) VALUES
('Play Group', '1.5 - 2.5 Years', 'Introduction to learning through play, sensory activities and social interaction.'),
('Pre-KG', '2.5 - 3.5 Years', 'Language development, motor skills and early concepts.'),
('LKG / UKG', '3.5 - 5.5 Years', 'School readiness with reading, writing and mathematics foundation.');

-- Facilities
CREATE TABLE IF NOT EXISTS facilities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  image_url text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Gallery
CREATE TABLE IF NOT EXISTS gallery (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL, -- 'Classroom', 'Activities', 'Celebrations', 'Teachers', 'Events'
  image_url text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_name text NOT NULL,
  review text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. Configure Row Level Security (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Create Policies for Public Read Access (Everyone can read)
CREATE POLICY "Public Read Access" ON site_content FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON programs FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON facilities FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON gallery FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON testimonials FOR SELECT USING (true);

-- Create Policies for Authenticated Write Access (Only logged-in owners can edit)
-- We check (auth.role() = 'authenticated')

-- site_content
CREATE POLICY "Owner Edit Access" ON site_content FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Owner Insert Access" ON site_content FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- programs
CREATE POLICY "Owner Insert Access" ON programs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owner Update Access" ON programs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Owner Delete Access" ON programs FOR DELETE USING (auth.role() = 'authenticated');

-- facilities
CREATE POLICY "Owner Insert Access" ON facilities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owner Update Access" ON facilities FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Owner Delete Access" ON facilities FOR DELETE USING (auth.role() = 'authenticated');

-- gallery
CREATE POLICY "Owner Insert Access" ON gallery FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owner Update Access" ON gallery FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Owner Delete Access" ON gallery FOR DELETE USING (auth.role() = 'authenticated');

-- testimonials
CREATE POLICY "Owner Insert Access" ON testimonials FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owner Update Access" ON testimonials FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Owner Delete Access" ON testimonials FOR DELETE USING (auth.role() = 'authenticated');

-- ==========================================
-- 3. Storage Setup (Instructions)
-- ==========================================
-- NOTE: Storage buckets must be created via the Supabase Dashboard or API.
-- Please go to Storage in your Supabase dashboard and create a new PUBLIC bucket named "mazhalai-assets".
-- Then, apply this RLS policy to the storage.objects table:
--
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'mazhalai-assets' );
-- CREATE POLICY "Owner Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'mazhalai-assets' AND auth.role() = 'authenticated' );
-- CREATE POLICY "Owner Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'mazhalai-assets' AND auth.role() = 'authenticated' );
-- CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE USING ( bucket_id = 'mazhalai-assets' AND auth.role() = 'authenticated' );
