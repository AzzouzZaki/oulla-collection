import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import type { Order, OrderItem, OrderStatus } from '@/types';

export const runtime = 'edge';

const VALID_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

// ─── GET /api/orders/[id] ────────────────────────────────────────────────────
// Admin only. Returns a single order with its items.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sql) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    await verifyAdmin(request);

    const { id } = await params;
    const orderId = parseInt(id, 10);

    const rows = await sql`
      SELECT * FROM orders WHERE id = ${orderId}
    ` as unknown as Order[];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const items = await sql`
      SELECT * FROM order_items WHERE order_id = ${orderId}
    ` as unknown as OrderItem[];

    return NextResponse.json({ ...rows[0], items });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('[GET /api/orders/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PUT /api/orders/[id] ────────────────────────────────────────────────────
// Admin only. Updates order status with stock side-effects.
// shipped  → decrement stock per item
// cancelled (from shipped) → restore stock per item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sql) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    await verifyAdmin(request);

    const { id } = await params;
    const orderId = parseInt(id, 10);

    const body = await request.json();
    const { status } = body as { status: OrderStatus };

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch current order to know previous status
    const existing = await sql`
      SELECT * FROM orders WHERE id = ${orderId}
    ` as unknown as Order[];

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const previousStatus = existing[0].status;

    // Fetch order items for stock adjustments
    const items = await sql`
      SELECT * FROM order_items WHERE order_id = ${orderId}
    ` as unknown as OrderItem[];

    // ── Stock side-effects ────────────────────────────────────────────────────

    // When transitioning to 'shipped': decrement stock for each item
    if (status === 'shipped' && previousStatus !== 'shipped') {
      for (const item of items) {
        if (item.product_id === null) continue;
        const productRows = await sql`
          SELECT stock FROM products WHERE id = ${item.product_id}
        ` as { stock: number }[];
        if (productRows.length > 0 && productRows[0].stock - item.quantity < 0) {
          console.warn(
            `[PUT /api/orders/[id]] Stock for product ${item.product_id} will go negative after shipping order ${orderId}`
          );
        }
        await sql`
          UPDATE products SET stock = stock - ${item.quantity} WHERE id = ${item.product_id}
        `;
      }
    }

    // When cancelling an order that was previously 'shipped': restore stock
    if (status === 'cancelled' && previousStatus === 'shipped') {
      for (const item of items) {
        if (item.product_id === null) continue;
        await sql`
          UPDATE products SET stock = stock + ${item.quantity} WHERE id = ${item.product_id}
        `;
      }
    }

    // Update order status
    const [updated] = await sql`
      UPDATE orders SET status = ${status} WHERE id = ${orderId} RETURNING *
    ` as unknown as Order[];

    return NextResponse.json({ ...updated, items });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('[PUT /api/orders/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
