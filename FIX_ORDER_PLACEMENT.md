# Fix: Order Placement RLS Error

## Problem
Error when placing orders: `Failed to place order: Database error: new row violates row-level security policy for table "order_items"`

## Root Cause
The Row-Level Security (RLS) policies on the `order_items` table were too restrictive. When the server creates orders, it needs permission to insert order items without requiring the user's authentication context.

## Solution Applied

### 1. Code Changes (Already Applied ✓)
Updated `src/lib/supabase.ts` - the `createOrder` function now uses `supabaseAdmin` client instead of the regular `supabase` client. This bypasses RLS for server-side operations.

### 2. Database Migration Required
Run the new migration file to fix RLS policies:

**Option A: Using Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard: https://ieuvqzaywgsifrfgagld.supabase.co
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy and paste the contents of `migrations/fix_orders_rls_policies.sql`
5. Click "Run" button

**Option B: Using Supabase CLI**
```bash
supabase db push --include-all
```

## What the Migration Does
The migration adds proper RLS policies that:
- Allow users to view and create their own orders
- Allow the service role (server-side) to bypass RLS for order creation
- Allow admins to manage all orders
- Ensure security while enabling order placement

## Testing
After running the migration:
1. Go to your checkout page
2. Fill in the shipping and payment details
3. Click "Place Order"
4. You should now be able to successfully place an order without the RLS error

## Environment Variables Check
Make sure your `.env` file has:
```
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```
✓ This is already configured in your project.

## Additional Notes
- The service role key allows server-side operations to bypass RLS
- This is secure because it's only used on the server (API routes), never exposed to the client
- Users can still only view their own orders through the normal client
