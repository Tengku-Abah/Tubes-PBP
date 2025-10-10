-- Migration untuk memperbaiki struktur tabel reviews
-- Menambahkan constraints yang diperlukan untuk data integrity

-- 1. Update product_id dan user_id menjadi NOT NULL (jika belum)
-- ALTER TABLE reviews ALTER COLUMN product_id SET NOT NULL;
-- ALTER TABLE reviews ALTER COLUMN user_id SET NOT NULL;

-- 2. Update rating menjadi NOT NULL dengan constraint
-- ALTER TABLE reviews ALTER COLUMN rating SET NOT NULL;
-- ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5);

-- 3. Update comment menjadi NOT NULL (jika diperlukan)
-- ALTER TABLE reviews ALTER COLUMN comment SET NOT NULL;

-- 4. Menambahkan index untuk performa
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON reviews(verified);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- 5. Menambahkan unique constraint untuk mencegah duplicate review
-- (Uncomment jika ingin mencegah user review produk yang sama lebih dari sekali)
-- ALTER TABLE reviews ADD CONSTRAINT unique_user_product_review UNIQUE (user_id, product_id);

-- 6. Update trigger untuk updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_reviews_updated_at();

-- 7. Menambahkan RLS policies jika belum ada
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policy untuk users bisa melihat semua reviews
CREATE POLICY "Users can view all reviews" ON reviews
    FOR SELECT USING (true);

-- Policy untuk users bisa insert review mereka sendiri
CREATE POLICY "Users can insert their own reviews" ON reviews
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Policy untuk users bisa update review mereka sendiri
CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (user_id = auth.uid()::text);

-- Policy untuk users bisa delete review mereka sendiri
CREATE POLICY "Users can delete their own reviews" ON reviews
    FOR DELETE USING (user_id = auth.uid()::text);

-- Policy untuk admin bisa melakukan semua operasi
CREATE POLICY "Admins can do everything" ON reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );
