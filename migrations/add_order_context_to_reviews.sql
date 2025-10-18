-- Migration: Add order context to reviews table
-- This allows users to review the same product multiple times from different orders
-- Created: 2025-10-18

BEGIN;

-- Add order_id and order_item_id columns to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS order_id integer,
ADD COLUMN IF NOT EXISTS order_item_id integer;

-- Add comment column if not exists (alias for content)
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS comment text;

-- Migrate data from content to comment if needed
UPDATE public.reviews 
SET comment = content 
WHERE comment IS NULL AND content IS NOT NULL;

-- Add user_name column if not exists
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS user_name text;

-- Create foreign key constraints
ALTER TABLE public.reviews
ADD CONSTRAINT fk_reviews_order
FOREIGN KEY (order_id) 
REFERENCES public.orders(id) 
ON DELETE SET NULL;

ALTER TABLE public.reviews
ADD CONSTRAINT fk_reviews_order_item
FOREIGN KEY (order_item_id) 
REFERENCES public.order_items(id) 
ON DELETE SET NULL;

-- Create unique constraint: user can only review each order_item once
-- But can review same product multiple times from different orders
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_order_item_user
ON public.reviews(order_id, order_item_id, user_id)
WHERE order_id IS NOT NULL AND order_item_id IS NOT NULL;

-- Create index for queries filtering by order
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_item_id ON public.reviews(order_item_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_reviews_product_user ON public.reviews(product_id, user_id);

-- Add comment to table
COMMENT ON TABLE public.reviews IS 'Product reviews linked to orders - users can review same product from different orders';
COMMENT ON COLUMN public.reviews.order_id IS 'Reference to the order this review is for';
COMMENT ON COLUMN public.reviews.order_item_id IS 'Reference to the specific order item being reviewed';
COMMENT ON COLUMN public.reviews.comment IS 'Review text content';
COMMENT ON COLUMN public.reviews.user_name IS 'Cached user name at time of review';

COMMIT;
