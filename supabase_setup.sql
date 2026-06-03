-- ============================================================
-- SAPPHERE SUPABASE SETUP — Run this in your Supabase SQL Editor
-- Project: https://jsdgekietlsnbgovpipa.supabase.co
-- ============================================================

-- STEP 1: Drop table if it exists (clean slate)
drop table if exists public.jewelry_products cascade;

-- STEP 2: Create the jewelry_products table
create table public.jewelry_products (
  id            text         primary key,
  name          text         not null,
  cat           text         not null default 'necklace',
  price         numeric      not null,
  "originalPrice" numeric    default null,
  desc          text         default '',
  img           text         default '',
  badge         text         default '',
  rating        text         default '5.0',
  reviews       text         default '0',
  featured      boolean      default false,
  created_at    timestamptz  default now()
);

-- STEP 3: Enable Row Level Security
alter table public.jewelry_products enable row level security;

-- STEP 4: Drop any old policies (clean)
drop policy if exists "Public read jewelry_products"   on public.jewelry_products;
drop policy if exists "Public insert jewelry_products" on public.jewelry_products;
drop policy if exists "Public update jewelry_products" on public.jewelry_products;
drop policy if exists "Public delete jewelry_products" on public.jewelry_products;

-- STEP 5: Create new RLS policies — allow anon key full CRUD
create policy "Public read jewelry_products"
  on public.jewelry_products for select
  using (true);

create policy "Public insert jewelry_products"
  on public.jewelry_products for insert
  with check (true);

create policy "Public update jewelry_products"
  on public.jewelry_products for update
  using (true)
  with check (true);

create policy "Public delete jewelry_products"
  on public.jewelry_products for delete
  using (true);

-- STEP 6: Enable Realtime (run separately if this errors)
-- Go to Supabase Dashboard > Database > Replication > Enable for jewelry_products
-- OR run: alter publication supabase_realtime add table public.jewelry_products;

-- STEP 7: Seed default products
insert into public.jewelry_products (id, name, cat, price, "originalPrice", desc, img, badge, rating, reviews, featured)
values
  ('flora-bead',       'Flora Bead Choker',         'necklace', 1899, 2099, 'A playful, graceful gold chain adorned with hand-strung multi-colored floral bead charms.',                                           'photosjewewllry/WhatsApp Image 2026-05-29 at 5.41.49 PM.jpeg',   'BESTSELLER',  '4.9', '84',  true),
  ('earring-suite',    'Atelier Earring Suite',      'earring',  2499, 2999, 'Curated suite of three distinct gold earrings: floral studs, double heart hoops, and bamboo hoops.',                                 'photosjewewllry/WhatsApp Image 2026-05-29 at 5.42.16 PM.jpeg',   'LIMITED',     '4.8', '46',  true),
  ('aura-heart',       'Aura Heart Pendant',         'necklace', 1599, 1899, 'A classic minimal gold chain holding a polished solid gold heart pendant on a premium display stand.',                              'photosjewewllry/WhatsApp Image 2026-05-29 at 5.42.13 PM (1).jpeg','ROYAL CHOICE','5.0', '112', true),
  ('silken-heart',     'Silken Heart Choker',        'necklace', 1699, 1999, 'A delicate hollow gold heart pendant layered elegantly over natural liquid-silk champagne drapery.',                                 'photosjewewllry/WhatsApp Image 2026-05-29 at 5.42.13 PM (3).jpeg','POPULAR',     '4.9', '73',  true),
  ('layered-necklace', 'Royal Layered Necklace',     'necklace', 1899, 2099, 'Intricately styled layered necklace blending warm yellow gold bars and custom sweep links.',                                         'photosjewewllry/WhatsApp Image 2026-05-29 at 5.41.49 PM.jpeg',   '10% OFF',     '5.0', '128', false),
  ('gold-choker',      'Gold Bead Choker',           'necklace', 1499, 1799, 'Minimalist elegant gold bead choker, perfect for stacking and everyday elegance.',                                                   'photosjewewllry/WhatsApp Image 2026-05-29 at 5.41.58 PM.jpeg',   'BESTSELLER',  '5.0', '84',  false),
  ('pearl-strand',     'Intimate Pearl Strand',      'necklace', 2199, 2499, 'Elegant genuine pearl strand displaying subtle cream iridescent tones and safe gold locks.',                                         'photosjewewllry/WhatsApp Image 2026-05-29 at 5.42.09 PM.jpeg',   'NEW',         '4.0', '56',  false),
  ('floral-studs',     'Floral Stud Earrings',       'earring',   899, 1059, 'Dainty floral stud earrings designed to frame the face with light-catching golden petals.',                                          'photosjewewllry/WhatsApp Image 2026-05-29 at 5.42.13 PM (2).jpeg','15% OFF',     '5.0', '203', false),
  ('gold-bracelet',    'Velvet Gold Bracelet',       'bracelet', 1299, 1499, 'Sleek and polished gold bracelet designed with smooth link loops and custom security sweeps.',                                        'photosjewewllry/WhatsApp Image 2026-05-29 at 5.42.16 PM (1).jpeg','NEW',         '4.0', '37',  false),
  ('gold-ring',        'Rose Gold Statement Ring',   'ring',     1199, 1399, 'Bold rose gold band ring, hand-polished to capture modern architectural sophistication.',                                             'photosjewewllry/WhatsApp Image 2026-05-29 at 5.42.17 PM.jpeg',   'TOP RATED',   '5.0', '91',  false),
  ('crystal-drops',    'Crystal Drop Earrings',      'earring',   999, 1249, 'Dazzling crystal drop earrings that cascade gracefully to add royalty and glamour.',                                                  'photosjewewllry/WhatsApp Image 2026-05-29 at 5.42.17 PM (1).jpeg','20% OFF',     '5.0', '165', false),
  ('combo-set',        'Bridal Combo Set',           'set',      3499, 4199, 'A rich jewelry suite containing matching royal layered choker and drop studs.',                                                       'photosjewewllry/WhatsApp Image 2026-05-29 at 5.42.17 PM (2).jpeg','COMBO',       '5.0', '52',  false),
  ('tennis-bracelet',  'Diamond Tennis Bracelet',    'bracelet', 2799, 3299, 'Classic high-end tennis bracelet hand-set with highly brilliant sparkling faceted simulated diamonds.',                               'photosjewewllry/WhatsApp Image 2026-05-29 at 5.42.18 PM.jpeg',   'NEW',         '5.0', '44',  false),
  ('festive-set',      'Festive Gold Set',           'set',      2999, 3599, 'Elegant traditional gold-sweep matching choker and bangle set designed for celebrations.',                                           'photosjewewllry/WhatsApp Image 2026-05-29 at 5.42.18 PM (1).jpeg','FESTIVE',     '4.0', '68',  false),
  ('luxury-set',       'Sapphire Luxury Set',        'set',      4499, 5499, 'Our crown jewel masterpiece suite, featuring royal blue sapphires in intricate golden settings.',                                    'photosjewewllry/WhatsApp Image 2026-05-29 at 5.42.18 PM (2).jpeg','LUXURY',      '5.0', '31',  false),
  ('emerald-ring',     'Emerald Solitaire Ring',     'ring',     1899, 2299, 'A breathtaking solitaire ring showcasing a deep forest green faceted emerald cut gem.',                                              'photosjewewllry/WhatsApp Image 2026-05-29 at 6.42.16 PM.jpeg',   'TRENDING',    '5.0', '77',  false),
  ('floral-stud-2',    'Vintage Floral Stud',        'earring',   799, 999,  'Delicate vintage-inspired floral studs with pearl center and gold petals.',                                                          'photosjewewllry/WhatsApp Image 2026-05-29 at 5.42.13 PM.jpeg',   'POPULAR',     '4.8', '56',  false),
  ('hero-set',         'ChatGPT Hero Jewel Set',     'set',      5999, 6999, 'Our prestige centerpiece set, an exclusive collaboration design with high-end gem-encrusted golden frameworks.',                     'photosjewewllry/ChatGPT Image May 30, 2026, 11_13_53 AM.png',    'EXCLUSIVE',   '5.0', '21',  false)
on conflict (id) do nothing;

-- ============================================================
-- VERIFICATION: Run this to confirm the table was created
-- ============================================================
-- select count(*) from public.jewelry_products;
