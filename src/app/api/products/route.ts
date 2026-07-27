import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import type { Product, ProductImage, Category } from '@/types';

export const runtime = 'edge';

// ─── GET /api/products ───────────────────────────────────────────────────────
// Public. Paginated with optional category slug filter.
// If no page/limit params → return all products.
export async function GET(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const categorySlug = searchParams.get('category');

    const paginated = pageParam !== null || limitParam !== null;
    const page = Math.max(1, parseInt(pageParam ?? '1', 10));
    const limit = Math.max(1, parseInt(limitParam ?? '12', 10));
    const offset = (page - 1) * limit;

    // Build WHERE clause for category filter
    let products: Product[];
    let total = 0;

    if (paginated) {
      if (categorySlug) {
        const rows = await sql`
          SELECT p.*, c.id as cat_id, c.name as cat_name, c.slug as cat_slug, c.created_at as cat_created_at
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE c.slug = ${categorySlug}
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        const countRows = await sql`
          SELECT COUNT(*) as count
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE c.slug = ${categorySlug}
        `;
        total = parseInt(countRows[0].count as string, 10);
        products = rows as unknown as Product[];
      } else {
        const rows = await sql`
          SELECT p.*, c.id as cat_id, c.name as cat_name, c.slug as cat_slug, c.created_at as cat_created_at
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        const countRows = await sql`SELECT COUNT(*) as count FROM products`;
        total = parseInt(countRows[0].count as string, 10);
        products = rows as unknown as Product[];
      }
    } else {
      if (categorySlug) {
        const rows = await sql`
          SELECT p.*, c.id as cat_id, c.name as cat_name, c.slug as cat_slug, c.created_at as cat_created_at
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE c.slug = ${categorySlug}
          ORDER BY p.created_at DESC
        `;
        products = rows as unknown as Product[];
      } else {
        const rows = await sql`
          SELECT p.*, c.id as cat_id, c.name as cat_name, c.slug as cat_slug, c.created_at as cat_created_at
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          ORDER BY p.created_at DESC
        `;
        products = rows as unknown as Product[];
      }
    }

    // Fetch images for all products in one query
    const productIds = products.map((p) => p.id);
    let images: ProductImage[] = [];
    if (productIds.length > 0) {
      images = await sql`
        SELECT * FROM product_images
        WHERE product_id = ANY(${productIds}::int[])
        ORDER BY "order" ASC
      ` as unknown as ProductImage[];
    }

    // Attach images and category to each product
    const data = products.map((row) => {
      const r = row as unknown as Record<string, unknown>;
      const product: Product = {
        id: r.id as number,
        name: r.name as string,
        description: r.description as string | null,
        price: r.price as number,
        category_id: r.category_id as number | null,
        stock: r.stock as number,
        is_available: r.is_available as boolean,
        colors: (r.colors as string[]) || [],
        sizes: (r.sizes as string[]) || [],
        fabric: (r.fabric as string) || null,
        created_at: r.created_at as string,
        images: images.filter((img) => img.product_id === r.id),
        category: r.cat_id
          ? ({
              id: r.cat_id as number,
              name: r.cat_name as string,
              slug: r.cat_slug as string,
              created_at: r.cat_created_at as string,
            } as Category)
          : undefined,
      };
      return product;
    });

    if (paginated) {
      return NextResponse.json({
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[GET /api/products]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /api/products ──────────────────────────────────────────────────────
// Admin only. Creates a new product with images.
export async function POST(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    await verifyAdmin(request);

    const body = await request.json();
    const { name, description, price, category_id, stock, is_available, colors, sizes, fabric, images } = body as {
      name: string;
      description?: string | null;
      price: number;
      category_id?: number | null;
      stock?: number;
      is_available?: boolean;
      colors?: string[];
      sizes?: string[];
      fabric?: string | null;
      images?: { url: string; is_primary: boolean; order: number }[];
    };

    if (!name || price === undefined || price === null) {
      return NextResponse.json({ error: 'name and price are required' }, { status: 400 });
    }

    const [product] = await sql`
      INSERT INTO products (name, description, price, category_id, stock, is_available, colors, sizes, fabric)
      VALUES (
        ${name},
        ${description ?? null},
        ${price},
        ${category_id ?? null},
        ${stock ?? 0},
        ${is_available ?? true},
        ${colors ?? []},
        ${sizes ?? []},
        ${fabric ?? null}
      )
      RETURNING *
    ` as unknown as Product[];

    let insertedImages: ProductImage[] = [];
    if (images && images.length > 0) {
      const imageValues = images.map((img) => ({
        product_id: product.id,
        url: img.url,
        is_primary: img.is_primary,
        order: img.order,
      }));
      for (const img of imageValues) {
        await sql`
          INSERT INTO product_images (product_id, url, is_primary, "order")
          VALUES (${img.product_id}, ${img.url}, ${img.is_primary}, ${img.order})
        `;
      }
      insertedImages = await sql`
        SELECT * FROM product_images WHERE product_id = ${product.id} ORDER BY "order" ASC
      ` as unknown as ProductImage[];
    }

    return NextResponse.json({ ...product, images: insertedImages }, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('[POST /api/products]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
