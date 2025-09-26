-- Fix RLS policies for admin operations
-- =====================================================

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Enable all for admin" ON products;
DROP POLICY IF EXISTS "Enable select for public" ON products;

-- 2. Create more permissive policies for products
CREATE POLICY "Enable all operations for products" ON products
    FOR ALL USING (true);

-- 3. Alternative: Create policy that allows all operations without authentication
-- (Use this if the above doesn't work)
-- DROP POLICY IF EXISTS "Enable all operations for products" ON products;
-- CREATE POLICY "Enable all for products" ON products
--     FOR ALL USING (true);

-- 4. Check if policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'products';
