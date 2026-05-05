import { NextRequest, NextResponse } from 'next/server';

import { dbHelpers } from '@/lib/supabase';
import { getApiUser, getCookieUser } from '@/lib/api-auth';

/**
 * POST endpoint untuk user membatalkan pesanan mereka sendiri
 */
export async function POST(request: NextRequest) {
  try {
    const user = getApiUser(request) || getCookieUser(request);
    const body = await request.json();
    const { orderId } = body;

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    const { data: order, error: fetchError } = await dbHelpers.getOrderById(Number(orderId));

    if (fetchError || !order) {
      console.error('Order fetch error:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    if (String(order.user_id) !== String(user.id)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: You can only cancel your own orders' },
        { status: 403 }
      );
    }

    if (String(order.status).toLowerCase() !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Only pending orders can be cancelled' },
        { status: 400 }
      );
    }

    const { data: updatedOrder, error: updateError } = await dbHelpers.updateOrder(Number(orderId), {
      status: 'cancelled'
    });

    if (updateError) {
      console.error('Order update error:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to cancel order' },
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
