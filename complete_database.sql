-- =====================================================
-- SCRIPT DATABASE LENGKAP UNTUK UMKM STORE
-- =====================================================

-- 1. HAPUS TABLE LAMA (jika ada)
-- =====================================================
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. BUAT TABLE USERS
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'pembeli' CHECK (role IN ('admin', 'pembeli')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BUAT TABLE PRODUCTS
-- =====================================================
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    image TEXT,
    category TEXT,
    stock INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    reviews_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BUAT TABLE REVIEWS
-- =====================================================
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BUAT TABLE ORDERS
-- =====================================================
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_number TEXT UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled')),
    shipping_address TEXT,
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BUAT TABLE CART_ITEMS
-- =====================================================
CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- 8. BUAT RLS POLICIES UNTUK USERS
-- =====================================================
CREATE POLICY "Enable insert for public" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for public" ON users
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users" ON users
    FOR UPDATE USING (true);

-- 9. BUAT RLS POLICIES UNTUK PRODUCTS
-- =====================================================
CREATE POLICY "Enable select for public" ON products
    FOR SELECT USING (true);

CREATE POLICY "Enable all for admin" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- 10. BUAT RLS POLICIES UNTUK REVIEWS
-- =====================================================
CREATE POLICY "Enable select for public" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON reviews
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for review owner" ON reviews
    FOR UPDATE USING (true);

-- 11. BUAT RLS POLICIES UNTUK ORDERS
-- =====================================================
CREATE POLICY "Enable select for order owner" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON orders
    FOR INSERT WITH CHECK (true);

-- 12. BUAT RLS POLICIES UNTUK CART_ITEMS
-- =====================================================
CREATE POLICY "Enable select for cart owner" ON cart_items
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for cart owner" ON cart_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for cart owner" ON cart_items
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for cart owner" ON cart_items
    FOR DELETE USING (true);

-- 13. INSERT DATA ADMIN USER
-- =====================================================
INSERT INTO users (email, password, name, role) VALUES 
('admin@gmail.com', '$2b$10$voXgrTXntv2g17ERAGbfo.VdpIWNwn9PIb29g8M3FvOTlxP3.nrMi', 'Admin User', 'admin');

-- 14. INSERT SAMPLE PRODUCTS
-- =====================================================
INSERT INTO products (name, price, description, image, category, stock, rating, reviews_count) VALUES 
-- Electronics
('Laptop Gaming ASUS ROG Strix', 15000000, 'Laptop gaming dengan performa tinggi untuk gaming dan productivity', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500', 'Electronics', 10, 4.5, 25),
('Smartphone Samsung Galaxy S24', 12000000, 'Smartphone flagship dengan kamera terbaik dan performa tinggi', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500', 'Electronics', 15, 4.3, 18),
('iPhone 15 Pro Max', 18000000, 'iPhone terbaru dengan chip A17 Pro dan kamera 48MP', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500', 'Electronics', 8, 4.8, 45),
('MacBook Air M2', 16000000, 'Laptop Apple dengan chip M2 untuk performa maksimal', 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500', 'Electronics', 6, 4.7, 32),
('iPad Pro 12.9"', 14000000, 'Tablet profesional dengan layar Liquid Retina XDR', 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=500', 'Electronics', 12, 4.6, 28),
('Kamera Canon EOS R5', 25000000, 'Kamera mirrorless profesional dengan 45MP', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500', 'Electronics', 5, 4.9, 15),
('Headphone Sony WH-1000XM5', 4500000, 'Headphone noise cancelling terbaru dengan kualitas suara premium', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 'Electronics', 20, 4.6, 35),
('AirPods Pro 2nd Gen', 3500000, 'Earbuds Apple dengan noise cancellation dan spatial audio', 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500', 'Electronics', 25, 4.5, 40),
('Mouse Gaming Logitech G Pro X', 800000, 'Mouse gaming profesional untuk esports', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500', 'Electronics', 30, 4.4, 22),
('Keyboard Mechanical Razer', 1200000, 'Keyboard mechanical dengan switch optik', 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500', 'Electronics', 18, 4.3, 19),
('Monitor Gaming 27" 4K', 5000000, 'Monitor gaming dengan refresh rate 144Hz dan resolusi 4K', 'https://images.unsplash.com/photo-1527443224154-c4a3942d2acf?w=500', 'Electronics', 14, 4.7, 26),
('Webcam Logitech C920', 800000, 'Webcam HD untuk streaming dan video conference', 'https://images.unsplash.com/photo-1587560699334-cc4ff634909a?w=500', 'Electronics', 22, 4.2, 17),

-- Fashion
('Sepatu Nike Air Max 270', 1800000, 'Sepatu olahraga dengan teknologi Air Max terbaru', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500', 'Fashion', 20, 4.7, 32),
('Sepatu Adidas Ultraboost 22', 2200000, 'Sepatu running dengan teknologi Boost untuk kenyamanan maksimal', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 'Fashion', 15, 4.6, 28),
('Jaket The North Face', 1200000, 'Jaket outdoor tahan air dan angin', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500', 'Fashion', 12, 4.4, 20),
('Tas Ransel Eiger Adventure', 650000, 'Tas ransel outdoor dengan kualitas terbaik', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 'Fashion', 8, 4.2, 15),
('Jam Tangan Casio G-Shock', 800000, 'Jam tangan tahan air dan shock untuk aktivitas outdoor', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', 'Fashion', 25, 4.4, 20),
('Jam Tangan Apple Watch Series 9', 4500000, 'Smartwatch Apple dengan fitur kesehatan lengkap', 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500', 'Fashion', 18, 4.8, 38),
('Kemeja Flanel Uniqlo', 350000, 'Kemeja flanel dengan bahan katun premium', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500', 'Fashion', 30, 4.1, 12),
('Celana Jeans Levi''s 501', 800000, 'Celana jeans klasik dengan fit slim', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', 'Fashion', 25, 4.3, 24),
('Topi Baseball New Era', 250000, 'Topi baseball dengan logo tim favorit', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500', 'Fashion', 40, 4.0, 8),
('Sandal Crocs Classic', 300000, 'Sandal nyaman untuk aktivitas sehari-hari', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500', 'Fashion', 35, 4.2, 16),

-- Audio
('Speaker JBL Charge 5', 1500000, 'Speaker bluetooth dengan bass yang powerful', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500', 'Audio', 20, 4.5, 25),
('Earbuds Sony WF-1000XM4', 2500000, 'Earbuds dengan noise cancellation aktif', 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500', 'Audio', 15, 4.6, 30),
('Headphone Audio-Technica ATH-M50x', 2000000, 'Headphone monitoring profesional untuk audio', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 'Audio', 12, 4.7, 18),
('Speaker HomePod mini', 1800000, 'Speaker pintar Apple dengan Siri', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500', 'Audio', 10, 4.4, 22),
('Microphone Blue Yeti', 1200000, 'Microphone USB untuk streaming dan recording', 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500', 'Audio', 8, 4.8, 15),
('Amplifier Marshall DSL40CR', 8000000, 'Amplifier gitar dengan suara klasik Marshall', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500', 'Audio', 5, 4.9, 12),
('Gitar Akustik Yamaha F310', 2500000, 'Gitar akustik untuk pemula dan profesional', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500', 'Audio', 15, 4.5, 20),
('Piano Digital Casio PX-S1000', 12000000, 'Piano digital dengan 88 tuts weighted', 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=500', 'Audio', 6, 4.7, 14),

-- Accessories
('Power Bank Anker 20000mAh', 500000, 'Power bank dengan kapasitas besar dan fast charging', 'https://images.unsplash.com/photo-1609592807940-21a47bbf2b20?w=500', 'Accessories', 30, 4.3, 28),
('Charger Wireless Samsung', 300000, 'Charger wireless dengan fast charging 15W', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500', 'Accessories', 25, 4.2, 20),
('Case iPhone 15 Pro Max', 200000, 'Case pelindung iPhone dengan desain premium', 'https://images.unsplash.com/photo-1601972602288-d1b3b5a0b3b3?w=500', 'Accessories', 40, 4.1, 15),
('Screen Protector Tempered Glass', 100000, 'Pelindung layar tempered glass untuk smartphone', 'https://images.unsplash.com/photo-1601972602288-d1b3b5a0b3b3?w=500', 'Accessories', 50, 4.0, 12),
('Cable USB-C to Lightning', 150000, 'Kabel charging untuk iPhone dan iPad', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500', 'Accessories', 35, 4.2, 18),
('Stand Laptop Adjustable', 400000, 'Stand laptop yang dapat disesuaikan tinggi dan sudut', 'https://images.unsplash.com/photo-1527443224154-c4a3942d2acf?w=500', 'Accessories', 20, 4.4, 16),
('Mouse Pad Gaming RGB', 200000, 'Mouse pad gaming dengan lighting RGB', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500', 'Accessories', 25, 4.1, 14),
('Headphone Stand Wooden', 300000, 'Stand headphone dari kayu dengan desain minimalis', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 'Accessories', 15, 4.3, 10),
('Laptop Sleeve 15.6"', 250000, 'Sarung laptop dengan bahan neoprene', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 'Accessories', 30, 4.0, 8),
('USB Hub 4 Port', 150000, 'Hub USB dengan 4 port untuk koneksi multiple device', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500', 'Accessories', 40, 4.2, 22);

-- 15. INSERT SAMPLE REVIEWS
-- =====================================================
INSERT INTO reviews (product_id, user_id, user_name, user_avatar, rating, comment, verified) VALUES 
-- Reviews untuk Electronics
(1, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 5, 'Laptop gaming yang sangat bagus, performa tinggi!', true),
(2, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'Smartphone dengan kamera yang luar biasa', true),
(3, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 5, 'iPhone terbaru dengan performa yang sangat baik', true),
(4, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 5, 'MacBook dengan chip M2 sangat cepat', true),
(5, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'iPad Pro dengan layar yang sangat jernih', true),
(6, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 5, 'Kamera profesional dengan kualitas foto yang luar biasa', true),
(7, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'Headphone dengan noise cancellation yang sangat baik', true),
(8, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 5, 'AirPods dengan kualitas suara yang premium', true),

-- Reviews untuk Fashion
(13, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 5, 'Sepatu Nike yang sangat nyaman untuk olahraga', true),
(14, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'Sepatu Adidas dengan teknologi Boost yang luar biasa', true),
(15, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'Jaket The North Face tahan air dan angin', true),
(16, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'Tas ransel Eiger dengan kualitas yang sangat baik', true),
(17, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'Jam tangan Casio G-Shock tahan air dan shock', true),
(18, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 5, 'Apple Watch dengan fitur kesehatan yang lengkap', true),

-- Reviews untuk Audio
(24, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'Speaker JBL dengan bass yang powerful', true),
(25, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'Earbuds Sony dengan noise cancellation yang baik', true),
(26, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 5, 'Headphone Audio-Technica untuk monitoring profesional', true),
(27, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'Speaker HomePod mini dengan Siri yang responsif', true),
(28, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 5, 'Microphone Blue Yeti untuk streaming yang sangat baik', true),
(29, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 5, 'Amplifier Marshall dengan suara klasik yang autentik', true),
(30, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'Gitar Yamaha dengan kualitas suara yang baik', true),
(31, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'Piano digital Casio dengan 88 tuts weighted', true),

-- Reviews untuk Accessories
(32, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'Power bank Anker dengan kapasitas besar', true),
(33, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'Charger wireless Samsung dengan fast charging', true),
(34, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'Case iPhone dengan desain premium', true),
(35, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'Screen protector tempered glass yang jernih', true),
(36, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'Kabel USB-C to Lightning dengan kualitas baik', true),
(37, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'Stand laptop adjustable yang sangat praktis', true),
(38, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'Mouse pad gaming RGB dengan lighting yang menarik', true),
(39, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'Laptop sleeve dengan bahan neoprene yang nyaman', true),
(40, (SELECT id FROM users WHERE email = 'admin@gmail.com'), 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', 4, 'USB Hub dengan 4 port yang sangat praktis', true);

-- 16. INSERT SAMPLE ORDERS
-- =====================================================
INSERT INTO orders (user_id, order_number, total_amount, status, shipping_address, payment_method) VALUES 
((SELECT id FROM users WHERE email = 'admin@gmail.com'), 'ORD-20241201-000001', 15000000, 'completed', 'Jl. Sudirman No. 123, Jakarta', 'Credit Card'),
((SELECT id FROM users WHERE email = 'admin@gmail.com'), 'ORD-20241201-000002', 12000000, 'processing', 'Jl. Thamrin No. 456, Jakarta', 'Bank Transfer'),
((SELECT id FROM users WHERE email = 'admin@gmail.com'), 'ORD-20241201-000003', 18000000, 'pending', 'Jl. Gatot Subroto No. 789, Jakarta', 'E-Wallet'),
((SELECT id FROM users WHERE email = 'admin@gmail.com'), 'ORD-20241201-000004', 25000000, 'shipped', 'Jl. HR Rasuna Said No. 321, Jakarta', 'Credit Card'),
((SELECT id FROM users WHERE email = 'admin@gmail.com'), 'ORD-20241201-000005', 8000000, 'delivered', 'Jl. Senayan No. 654, Jakarta', 'Bank Transfer'),
((SELECT id FROM users WHERE email = 'admin@gmail.com'), 'ORD-20241201-000006', 4500000, 'completed', 'Jl. Kuningan No. 987, Jakarta', 'E-Wallet'),
((SELECT id FROM users WHERE email = 'admin@gmail.com'), 'ORD-20241201-000007', 2200000, 'processing', 'Jl. Menteng No. 147, Jakarta', 'Credit Card'),
((SELECT id FROM users WHERE email = 'admin@gmail.com'), 'ORD-20241201-000008', 3500000, 'pending', 'Jl. Kebayoran No. 258, Jakarta', 'Bank Transfer'),
((SELECT id FROM users WHERE email = 'admin@gmail.com'), 'ORD-20241201-000009', 1200000, 'shipped', 'Jl. Pondok Indah No. 369, Jakarta', 'E-Wallet'),
((SELECT id FROM users WHERE email = 'admin@gmail.com'), 'ORD-20241201-000010', 2000000, 'delivered', 'Jl. Kemang No. 741, Jakarta', 'Credit Card');

-- 17. INSERT SAMPLE CART ITEMS
-- =====================================================
INSERT INTO cart_items (user_id, product_id, quantity) VALUES 
((SELECT id FROM users WHERE email = 'admin@gmail.com'), 1, 1),
((SELECT id FROM users WHERE email = 'admin@gmail.com'), 2, 2),
((SELECT id FROM users WHERE email = 'admin@gmail.com'), 13, 1),
((SELECT id FROM users WHERE email = 'admin@gmail.com'), 24, 1),
((SELECT id FROM users WHERE email = 'admin@gmail.com'), 32, 2);

-- 18. BUAT INDEX UNTUK PERFORMANCE
-- =====================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);

-- 17. BUAT FUNCTION UNTUK UPDATE UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 18. BUAT TRIGGER UNTUK AUTO UPDATE UPDATED_AT
-- =====================================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 19. BUAT FUNCTION UNTUK GENERATE ORDER NUMBER
-- =====================================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('orders_id_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 20. BUAT TRIGGER UNTUK AUTO GENERATE ORDER NUMBER
-- =====================================================
CREATE TRIGGER set_order_number BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- =====================================================
-- SCRIPT SELESAI
-- =====================================================
-- Jalankan script ini di SQL Editor di Supabase
-- Setelah selesai, restart development server: npm run dev
-- =====================================================
