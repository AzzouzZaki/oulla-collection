import { NextResponse } from 'next/server';

let cachedWilayas: { wilaya_id: number; wilaya_name: string }[] | null = null;

export async function GET() {
  try {
    if (cachedWilayas) {
      return NextResponse.json(cachedWilayas);
    }

    const baseUrl = process.env.ECOTRACK_BASE_URL;
    const token = process.env.ECOTRACK_TOKEN;
    
    if (!baseUrl) {
      console.error('ECOTRACK_BASE_URL is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const res = await fetch(`${baseUrl}/api/v1/get/wilayas`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('ECOTRACK API Error:', res.status, errorText);
      throw new Error(`Failed to fetch wilayas, status: ${res.status}`);
    }

    const data = await res.json();
    
    const wilayasList = Array.isArray(data) ? data : (data.data || []);
    
    cachedWilayas = wilayasList;

    return NextResponse.json(cachedWilayas);
  } catch (error) {
    console.error('[GET /api/wilayas]', error);
    return NextResponse.json({ error: 'Failed to fetch wilayas' }, { status: 502 });
  }
}
