import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import type { Category } from '@/types';

export const runtime = 'edge';

// ─── PUT /api/categories/[id] ────────────────────────────────────────────────
// Admin only. Updates a category's name and slug.
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
    const categoryId = parseInt(id, 10);

    const body = await request.json();
    const { name, slug } = body as { name: string; slug: string };

    if (!name || !slug) {
      return NextResponse.json({ error: 'name and slug are required' }, { status: 400 });
    }

    const rows = await sql`
      UPDATE categories SET name = ${name}, slug = ${slug}
      WHERE id = ${categoryId}
      RETURNING *
    ` as unknown as Category[];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('[PUT /api/categories/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE /api/categories/[id] ─────────────────────────────────────────────
// Admin only. Deletes a category. Products get category_id = NULL via FK.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sql) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    await verifyAdmin(request);

    const { id } = await params;
    const categoryId = parseInt(id, 10);

    const rows = await sql`
      DELETE FROM categories WHERE id = ${categoryId} RETURNING id
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('[DELETE /api/categories/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
