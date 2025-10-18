import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

/**
 * POST endpoint untuk user membatalkan pesanan mereka sendiri
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    // Get user ID from request headers
    const userId = request.headers.get('user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 401 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    // First, verify the order belongs to the user and is in pending status
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      console.error('Order fetch error:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (order.user_id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: You can only cancel your own orders' },
        { status: 403 }
      );
    }

    // Verify status - only pending orders can be cancelled
    if (order.status.toLowerCase() !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Only pending orders can be cancelled' },
        { status: 400 }
      );
    }

    // Update the order status to cancelled using supabaseAdmin to bypass RLS
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Order update error:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to cancel order: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      data: updatedOrder
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
