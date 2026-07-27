import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import type { Category } from '@/types';

export const runtime = 'edge';

// ─── GET /api/categories ─────────────────────────────────────────────────────
// Public. Returns all categories.
export async function GET() {
  if (!sql) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const data = await sql`
      SELECT * FROM categories ORDER BY name ASC
    ` as unknown as Category[];

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[GET /api/categories]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /api/categories ────────────────────────────────────────────────────
// Admin only. Creates a new category.
export async function POST(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    await verifyAdmin(request);

    const body = await request.json();
    const { name, slug } = body as { name: string; slug: string };

    if (!name || !slug) {
      return NextResponse.json({ error: 'name and slug are required' }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await sql`SELECT id FROM categories WHERE slug = ${slug}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 400 });
    }

    const [category] = await sql`
      INSERT INTO categories (name, slug)
      VALUES (${name}, ${slug})
      RETURNING *
    ` as unknown as Category[];

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('[POST /api/categories]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
