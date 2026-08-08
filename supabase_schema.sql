-- ==========================================
-- Mazhalai Daycare - Supabase Schema v2
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
  icon text DEFAULT '🌱',
  tags text DEFAULT '',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Initial Programs
INSERT INTO programs (title, age_group, description, icon, tags) VALUES
('Play Group', '1.5 – 2.5 Years', 'A gentle, loving introduction to learning through guided play, sensory exploration, and joyful social interaction.', '🌱', 'Sensory Play, Social Skills'),
('Pre-KG', '2.5 – 3.5 Years', 'Focusing on language development, motor skills, and early cognitive concepts in a stimulating environment.', '🚀', 'Language, Motor Skills'),
('LKG / UKG', '3.5 – 5.5 Years', 'A comprehensive school readiness program emphasizing reading, writing, numeracy, and critical thinking skills.', '🎓', 'Reading, Writing, Math')
ON CONFLICT DO NOTHING;

-- Facilities
CREATE TABLE IF NOT EXISTS facilities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  image_url text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- GALLERY TABLE (Enhanced with full metadata)
-- ==========================================
-- Drop old gallery and recreate with full metadata fields
-- NOTE: If you already have data and don't want to lose it, use ALTER TABLE instead
CREATE TABLE IF NOT EXISTS gallery (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,           -- Full public URL from Supabase Storage
  storage_path text,                 -- The path inside the bucket (for deletion)
  title text,                        -- Optional display title
  description text,                  -- Caption / description of the photo
  category text NOT NULL DEFAULT 'Activities', -- 'Annual Day', 'Sports Day', 'Art & Craft', 'Celebrations', 'Activities'
  album text,                        -- Album name (e.g., "Graduation 2025")
  event_name text,                   -- Specific event name
  year integer,                      -- e.g., 2025
  date date,                         -- Specific date of the event
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing columns if table already exists (safe migration)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gallery' AND column_name='storage_path') THEN
    ALTER TABLE gallery ADD COLUMN storage_path text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gallery' AND column_name='title') THEN
    ALTER TABLE gallery ADD COLUMN title text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gallery' AND column_name='description') THEN
    ALTER TABLE gallery ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gallery' AND column_name='album') THEN
    ALTER TABLE gallery ADD COLUMN album text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gallery' AND column_name='event_name') THEN
    ALTER TABLE gallery ADD COLUMN event_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gallery' AND column_name='year') THEN
    ALTER TABLE gallery ADD COLUMN year integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gallery' AND column_name='date') THEN
    ALTER TABLE gallery ADD COLUMN date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gallery' AND column_name='created_by') THEN
    ALTER TABLE gallery ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ==========================================
-- EVENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  cover_image_url text,
  cover_image_path text,             -- Storage path for deletion
  category text DEFAULT 'General',  -- 'Annual Day', 'Sports Day', 'Cultural', 'Workshop', 'General'
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
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
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- ---- SITE CONTENT ----
DROP POLICY IF EXISTS "Public Read Access" ON site_content;
DROP POLICY IF EXISTS "Owner Edit Access" ON site_content;
DROP POLICY IF EXISTS "Owner Insert Access" ON site_content;
CREATE POLICY "Public Read" ON site_content FOR SELECT USING (true);
CREATE POLICY "Auth Update" ON site_content FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Insert" ON site_content FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ---- PROGRAMS ----
DROP POLICY IF EXISTS "Public Read Access" ON programs;
DROP POLICY IF EXISTS "Owner Insert Access" ON programs;
DROP POLICY IF EXISTS "Owner Update Access" ON programs;
DROP POLICY IF EXISTS "Owner Delete Access" ON programs;
CREATE POLICY "Public Read" ON programs FOR SELECT USING (true);
CREATE POLICY "Auth Insert" ON programs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update" ON programs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Delete" ON programs FOR DELETE USING (auth.role() = 'authenticated');

-- ---- FACILITIES ----
DROP POLICY IF EXISTS "Public Read Access" ON facilities;
DROP POLICY IF EXISTS "Owner Insert Access" ON facilities;
DROP POLICY IF EXISTS "Owner Update Access" ON facilities;
DROP POLICY IF EXISTS "Owner Delete Access" ON facilities;
CREATE POLICY "Public Read" ON facilities FOR SELECT USING (true);
CREATE POLICY "Auth Insert" ON facilities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update" ON facilities FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Delete" ON facilities FOR DELETE USING (auth.role() = 'authenticated');

-- ---- GALLERY ----
DROP POLICY IF EXISTS "Public Read Access" ON gallery;
DROP POLICY IF EXISTS "Owner Insert Access" ON gallery;
DROP POLICY IF EXISTS "Owner Update Access" ON gallery;
DROP POLICY IF EXISTS "Owner Delete Access" ON gallery;
CREATE POLICY "Public Read" ON gallery FOR SELECT USING (true);
CREATE POLICY "Auth Insert" ON gallery FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update" ON gallery FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Delete" ON gallery FOR DELETE USING (auth.role() = 'authenticated');

-- ---- EVENTS ----
CREATE POLICY "Public Read" ON events FOR SELECT USING (true);
CREATE POLICY "Auth Insert" ON events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update" ON events FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Delete" ON events FOR DELETE USING (auth.role() = 'authenticated');

-- ---- TESTIMONIALS ----
DROP POLICY IF EXISTS "Public Read Access" ON testimonials;
DROP POLICY IF EXISTS "Owner Insert Access" ON testimonials;
DROP POLICY IF EXISTS "Owner Update Access" ON testimonials;
DROP POLICY IF EXISTS "Owner Delete Access" ON testimonials;
CREATE POLICY "Public Read" ON testimonials FOR SELECT USING (true);
CREATE POLICY "Auth Insert" ON testimonials FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update" ON testimonials FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Delete" ON testimonials FOR DELETE USING (auth.role() = 'authenticated');

-- ==========================================
-- 3. Storage Setup
-- ==========================================
-- IMPORTANT: In Supabase Dashboard → Storage, create a PUBLIC bucket named "mazhalai-gallery"
-- Then run these storage RLS policies:

-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'mazhalai-gallery' );
-- CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'mazhalai-gallery' AND auth.role() = 'authenticated' );
-- CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'mazhalai-gallery' AND auth.role() = 'authenticated' );
-- CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE USING ( bucket_id = 'mazhalai-gallery' AND auth.role() = 'authenticated' );
