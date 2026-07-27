import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import cloudinary from '@/lib/cloudinary';
import { verifyAdmin } from '@/lib/auth';
import type { Product, ProductImage, Category } from '@/types';

// ─── GET /api/products/[id] ──────────────────────────────────────────────────
// Public. Returns a single product with images and category.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sql) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const { id } = await params;

    const rows = await sql`
      SELECT p.*, c.id as cat_id, c.name as cat_name, c.slug as cat_slug, c.created_at as cat_created_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ${parseInt(id, 10)}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const r = rows[0] as Record<string, unknown>;
    const images = await sql`
      SELECT * FROM product_images WHERE product_id = ${r.id} ORDER BY "order" ASC
    ` as unknown as ProductImage[];

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
      images,
      category: r.cat_id
        ? ({
            id: r.cat_id as number,
            name: r.cat_name as string,
            slug: r.cat_slug as string,
            created_at: r.cat_created_at as string,
          } as Category)
        : undefined,
    };

    return NextResponse.json(product);
  } catch (error) {
    console.error('[GET /api/products/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PUT /api/products/[id] ──────────────────────────────────────────────────
// Admin only. Updates product fields and replaces images.
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
    const productId = parseInt(id, 10);

    const body = await request.json();
    const { name, description, price, category_id, stock, is_available, colors, sizes, fabric, images } = body as {
      name?: string;
      description?: string | null;
      price?: number;
      category_id?: number | null;
      stock?: number;
      is_available?: boolean;
      colors?: string[];
      sizes?: string[];
      fabric?: string | null;
      images?: { url: string; is_primary: boolean; order: number }[];
    };

    // Check product exists
    const existing = await sql`SELECT id FROM products WHERE id = ${productId}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update product — only set fields that are provided
    const [updated] = await sql`
      UPDATE products SET
        name         = COALESCE(${name ?? null}, name),
        description  = COALESCE(${description ?? null}, description),
        price        = COALESCE(${price ?? null}, price),
        category_id  = CASE WHEN ${category_id !== undefined} THEN ${category_id ?? null} ELSE category_id END,
        stock        = COALESCE(${stock ?? null}, stock),
        is_available = COALESCE(${is_available ?? null}, is_available),
        colors       = COALESCE(${colors ?? null}, colors),
        sizes        = COALESCE(${sizes ?? null}, sizes),
        fabric       = COALESCE(${fabric ?? null}, fabric)
      WHERE id = ${productId}
      RETURNING *
    ` as unknown as Product[];

    // Replace images
    if (images !== undefined) {
      await sql`DELETE FROM product_images WHERE product_id = ${productId}`;
      for (const img of images) {
        await sql`
          INSERT INTO product_images (product_id, url, is_primary, "order")
          VALUES (${productId}, ${img.url}, ${img.is_primary}, ${img.order})
        `;
      }
    }

    const updatedImages = await sql`
      SELECT * FROM product_images WHERE product_id = ${productId} ORDER BY "order" ASC
    ` as unknown as ProductImage[];

    return NextResponse.json({ ...updated, images: updatedImages });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('[PUT /api/products/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE /api/products/[id] ───────────────────────────────────────────────
// Admin only. Deletes Cloudinary images, then deletes the product.
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
    const productId = parseInt(id, 10);

    // Check product exists
    const existing = await sql`SELECT id FROM products WHERE id = ${productId}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch all Cloudinary image URLs to delete
    const imageRows = await sql`
      SELECT url FROM product_images WHERE product_id = ${productId}
    ` as { url: string }[];

    // Delete from Cloudinary
    for (const { url } of imageRows) {
      try {
        // Extract public_id from Cloudinary URL:
        // e.g. https://res.cloudinary.com/<cloud>/image/upload/v123/oulla-collection/abc.jpg
        // → public_id = oulla-collection/abc
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
        if (match) {
          await cloudinary.uploader.destroy(match[1]);
        }
      } catch (cdnError) {
        console.warn('[DELETE /api/products/[id]] Cloudinary delete failed:', cdnError);
      }
    }

    // Delete product (cascade handles product_images; order_items get product_id nulled)
    await sql`DELETE FROM products WHERE id = ${productId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('[DELETE /api/products/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
