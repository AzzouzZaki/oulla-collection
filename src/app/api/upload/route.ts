import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { verifyAdmin } from '@/lib/auth';

// No edge runtime — formData parsing requires Node.js APIs

// ─── POST /api/upload ────────────────────────────────────────────────────────
// Admin only. Uploads a file to Cloudinary under the 'oulla-collection' folder.
export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to a Buffer for Cloudinary upload_stream
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Wrap cloudinary upload_stream in a Promise
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'oulla-collection' },
          (error, result) => {
            if (error || !result) return reject(error ?? new Error('Upload failed'));
            resolve({ secure_url: result.secure_url, public_id: result.public_id });
          }
        );
        uploadStream.end(buffer);
      }
    );

    return NextResponse.json({ url: result.secure_url, public_id: result.public_id }, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('[POST /api/upload]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
