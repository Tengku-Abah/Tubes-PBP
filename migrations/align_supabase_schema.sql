-- Align Supabase schema with application expectations
-- Safe to run multiple times (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)

BEGIN;

-- USERS table adjustments
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS user_avatar text,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'pembeli',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ORDERS table (create if missing)
CREATE TABLE IF NOT EXISTS public.orders (
  id serial PRIMARY KEY,
  user_id text NOT NULL,
  order_number text NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  shipping_address text,
  payment_method text NOT NULL DEFAULT 'cash_on_delivery',
  payment_status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ORDER_ITEMS table (create if missing)
CREATE TABLE IF NOT EXISTS public.order_items (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id integer NOT NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- PRODUCTS table adjustments to match app usage
ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS image text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- REVIEWS table (create if missing) used by review APIs
CREATE TABLE IF NOT EXISTS public.reviews (
  id serial PRIMARY KEY,
  product_id integer NOT NULL,
  user_id text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content text,
  verified boolean DEFAULT false,
  user_avatar text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

COMMIT;