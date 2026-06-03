-- Create fresh jewelry products table
CREATE TABLE IF NOT EXISTS public.jewelry_products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cat TEXT NOT NULL,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    badge TEXT,
    featured BOOLEAN DEFAULT false,
    description TEXT,
    img TEXT,
    rating TEXT DEFAULT '5.0',
    reviews TEXT DEFAULT '0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.jewelry_products ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access
CREATE POLICY "Allow public read access" 
ON public.jewelry_products 
FOR SELECT 
USING (true);

-- Allow anonymous read, write, update, delete for simple admin operations
CREATE POLICY "Allow full access to anyone" 
ON public.jewelry_products 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Enable Realtime for live cross-device synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE public.jewelry_products;
