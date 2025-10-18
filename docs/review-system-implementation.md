# Review System - Order-Based Implementation

## Overview
Review system yang memungkinkan user untuk mereview produk yang sudah dibeli. User dapat mereview **produk yang sama berkali-kali** selama produk tersebut berasal dari **order yang berbeda**.

## Database Schema Changes

### Migration File: `add_order_context_to_reviews.sql`

Menambahkan kolom baru ke tabel `reviews`:
- `order_id` (integer, nullable) - Reference ke tabel orders
- `order_item_id` (integer, nullable) - Reference ke tabel order_items  
- `comment` (text) - Alias untuk content
- `user_name` (text) - Cached user name

### Constraints
1. **Unique Constraint**: `(order_id, order_item_id, user_id)` 
   - User hanya bisa review satu kali per order_item
   - User bisa review produk yang sama dari order berbeda

2. **Foreign Keys**:
   - `order_id` → `orders.id` (ON DELETE SET NULL)
   - `order_item_id` → `order_items.id` (ON DELETE SET NULL)

## API Changes

### POST /api/reviews

**Request Body:**
```json
{
  "productId": 123,
  "orderId": 456,           // Required for order-based reviews
  "orderItemId": 789,       // Required for order-based reviews
  "rating": 5,
  "comment": "Great product! Highly recommended..."
}
```

**Validations:**
1. ✅ User must be authenticated
2. ✅ Rating: 1-5
3. ✅ Comment: minimum 10 characters
4. ✅ Order must belong to the user
5. ✅ Order item must exist and match product_id
6. ✅ User cannot review same order_item twice
7. ✅ User can review same product from different orders

**Response Scenarios:**

**Success (201):**
```json
{
  "success": true,
  "message": "Review added successfully",
  "data": { ... }
}
```

**Error (409) - Already Reviewed:**
```json
{
  "success": false,
  "message": "You have already reviewed this product from this order"
}
```

**Error (404) - Order Not Found:**
```json
{
  "success": false,
  "message": "Order not found or access denied"
}
```

## Frontend Integration

### Review Page URL Structure
```
/Review?orderId=123&orderItemId=456&productId=789
```

### Example: Add Review Button in Order View

```tsx
// In view-order page, for each order item:
<button
  onClick={() => {
    router.push(
      `/Review?orderId=${order.id}&orderItemId=${item.id}&productId=${item.product_id}`
    );
  }}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
>
  Tulis Ulasan
</button>
```

### Checking if Order Item Already Reviewed

```tsx
// Fetch reviews for specific order items
const checkReviewed = async (orderId: number, orderItemId: number) => {
  const response = await fetch(
    `/api/reviews?orderId=${orderId}&orderItemId=${orderItemId}`
  );
  const data = await response.json();
  return data.data && data.data.length > 0;
};
```

## Use Cases

### ✅ Scenario 1: User buys same product twice
```
Order #1 → Product A → Can Review ✓
Order #2 → Product A → Can Review ✓ (Different order)
```

### ❌ Scenario 2: User tries to review twice from same order
```
Order #1 → Product A → Review #1 ✓
Order #1 → Product A → Review #2 ✗ (Already reviewed)
```

### ✅ Scenario 3: Multiple items in one order
```
Order #1 → Product A → Can Review ✓
Order #1 → Product B → Can Review ✓
Order #1 → Product C → Can Review ✓
```

## Migration Steps

1. **Run SQL Migration:**
   ```sql
   -- Execute: migrations/add_order_context_to_reviews.sql
   ```

2. **Test API Endpoint:**
   ```bash
   # Test POST with order context
   curl -X POST http://localhost:3000/api/reviews \
     -H "Content-Type: application/json" \
     -d '{
       "productId": 1,
       "orderId": 1,
       "orderItemId": 1,
       "rating": 5,
       "comment": "Excellent product quality and fast shipping!"
     }'
   ```

3. **Update Frontend:**
   - Add review buttons to order view page
   - Pass orderId, orderItemId, productId to Review page
   - Handle review status (already reviewed / can review)

## Benefits

1. **Accurate Review System** - Reviews are tied to actual purchases
2. **Multiple Reviews** - Users can review products bought multiple times
3. **Order Tracking** - Know which order a review came from
4. **Prevent Spam** - One review per order item only
5. **Review History** - Users can see their review history per order

## Next Steps

- [ ] Add review status indicator on order items
- [ ] Show "Reviewed" badge on reviewed items
- [ ] Add "Edit Review" functionality
- [ ] Add review summary on product pages
- [ ] Add review moderation for admin
