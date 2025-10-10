-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_order_items_updated_at 
    BEFORE UPDATE ON order_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for order_items
CREATE POLICY "Users can view their own order items" ON order_items
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM orders WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert order items for their orders" ON order_items
    FOR INSERT WITH CHECK (
        order_id IN (
            SELECT id FROM orders WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update their own order items" ON order_items
    FOR UPDATE USING (
        order_id IN (
            SELECT id FROM orders WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete their own order items" ON order_items
    FOR DELETE USING (
        order_id IN (
            SELECT id FROM orders WHERE user_id = auth.uid()::text
        )
    );