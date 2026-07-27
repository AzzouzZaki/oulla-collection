import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import type { Order, OrderItem, OrderStatus } from '@/types';

export const runtime = 'edge';

// ─── GET /api/orders ─────────────────────────────────────────────────────────
// Admin only. Paginated orders with optional status/date filters + items.
export async function GET(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10));
    const offset = (page - 1) * limit;
    const status = searchParams.get('status') as OrderStatus | null;
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    const validStatuses: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Build orders query with optional filters
    let orders: Order[];
    let total = 0;

    if (status && dateFrom && dateTo) {
      orders = await sql`
        SELECT * FROM orders
        WHERE status = ${status} AND created_at >= ${dateFrom}::date AND created_at <= (${dateTo}::date + interval '1 day')
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as unknown as Order[];
      const countRows = await sql`
        SELECT COUNT(*) as count FROM orders
        WHERE status = ${status} AND created_at >= ${dateFrom}::date AND created_at <= (${dateTo}::date + interval '1 day')
      `;
      total = parseInt(countRows[0].count as string, 10);
    } else if (status && dateFrom) {
      orders = await sql`
        SELECT * FROM orders
        WHERE status = ${status} AND created_at >= ${dateFrom}::date
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as unknown as Order[];
      const countRows = await sql`
        SELECT COUNT(*) as count FROM orders WHERE status = ${status} AND created_at >= ${dateFrom}::date
      `;
      total = parseInt(countRows[0].count as string, 10);
    } else if (status && dateTo) {
      orders = await sql`
        SELECT * FROM orders
        WHERE status = ${status} AND created_at <= (${dateTo}::date + interval '1 day')
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as unknown as Order[];
      const countRows = await sql`
        SELECT COUNT(*) as count FROM orders WHERE status = ${status} AND created_at <= (${dateTo}::date + interval '1 day')
      `;
      total = parseInt(countRows[0].count as string, 10);
    } else if (dateFrom && dateTo) {
      orders = await sql`
        SELECT * FROM orders
        WHERE created_at >= ${dateFrom}::date AND created_at <= (${dateTo}::date + interval '1 day')
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as unknown as Order[];
      const countRows = await sql`
        SELECT COUNT(*) as count FROM orders WHERE created_at >= ${dateFrom}::date AND created_at <= (${dateTo}::date + interval '1 day')
      `;
      total = parseInt(countRows[0].count as string, 10);
    } else if (status) {
      orders = await sql`
        SELECT * FROM orders WHERE status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as unknown as Order[];
      const countRows = await sql`SELECT COUNT(*) as count FROM orders WHERE status = ${status}`;
      total = parseInt(countRows[0].count as string, 10);
    } else if (dateFrom) {
      orders = await sql`
        SELECT * FROM orders WHERE created_at >= ${dateFrom}::date
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as unknown as Order[];
      const countRows = await sql`SELECT COUNT(*) as count FROM orders WHERE created_at >= ${dateFrom}::date`;
      total = parseInt(countRows[0].count as string, 10);
    } else if (dateTo) {
      orders = await sql`
        SELECT * FROM orders WHERE created_at <= (${dateTo}::date + interval '1 day')
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as unknown as Order[];
      const countRows = await sql`SELECT COUNT(*) as count FROM orders WHERE created_at <= (${dateTo}::date + interval '1 day')`;
      total = parseInt(countRows[0].count as string, 10);
    } else {
      orders = await sql`
        SELECT * FROM orders ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      ` as unknown as Order[];
      const countRows = await sql`SELECT COUNT(*) as count FROM orders`;
      total = parseInt(countRows[0].count as string, 10);
    }

    // Fetch all items for the returned orders in one query
    const orderIds = orders.map((o) => o.id);
    let allItems: OrderItem[] = [];
    if (orderIds.length > 0) {
      allItems = await sql`
        SELECT * FROM order_items WHERE order_id = ANY(${orderIds}::int[])
      ` as unknown as OrderItem[];
    }

    const data = orders.map((order) => ({
      ...order,
      items: allItems.filter((item) => item.order_id === order.id),
    }));

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('[GET /api/orders]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /api/orders ────────────────────────────────────────────────────────
// Public. Customers place orders. Prices fetched from DB — never trusted from client.
export async function POST(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_address,
      wilaya,
      customer_instagram,
      notes,
      items,
    } = body as {
      customer_name: string;
      customer_phone: string;
      customer_address: string;
      wilaya: string;
      customer_instagram?: string | null;
      notes?: string | null;
      items: { product_id: number; quantity: number }[];
    };

    // Validate required fields
    if (!customer_name || !customer_phone || !customer_address || !wilaya) {
      return NextResponse.json(
        { error: 'customer_name, customer_phone, customer_address, and wilaya are required' },
        { status: 400 }
      );
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items must be a non-empty array' }, { status: 400 });
    }

    // Validate each item and fetch prices from DB
    const enrichedItems: { product_id: number; quantity: number; unit_price: number }[] = [];
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { error: 'Each item must have a valid product_id and quantity >= 1' },
          { status: 400 }
        );
      }

      const productRows = await sql`
        SELECT id, price, is_available, name FROM products WHERE id = ${item.product_id}
      ` as { id: number; price: number; is_available: boolean; name: string }[];

      if (productRows.length === 0) {
        return NextResponse.json(
          { error: `Product with id ${item.product_id} not found` },
          { status: 400 }
        );
      }

      const product = productRows[0];
      if (!product.is_available) {
        return NextResponse.json(
          { error: `Product "${product.name}" is currently unavailable` },
          { status: 400 }
        );
      }

      enrichedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price,
      });
    }

    // Calculate total server-side
    const total_price = enrichedItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    // Insert order
    const [order] = await sql`
      INSERT INTO orders (customer_name, customer_phone, customer_instagram, customer_address, wilaya, total_price, notes)
      VALUES (
        ${customer_name},
        ${customer_phone},
        ${customer_instagram ?? null},
        ${customer_address},
        ${wilaya},
        ${total_price},
        ${notes ?? null}
      )
      RETURNING *
    ` as unknown as Order[];

    // Insert order items
    for (const item of enrichedItems) {
      await sql`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (${order.id}, ${item.product_id}, ${item.quantity}, ${item.unit_price})
      `;
    }

    const orderItems = await sql`
      SELECT * FROM order_items WHERE order_id = ${order.id}
    ` as unknown as OrderItem[];

    return NextResponse.json({ ...order, items: orderItems }, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('[POST /api/orders]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
