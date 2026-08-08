import { NextRequest, NextResponse } from 'next/server';

type FeeEntry = {
  wilaya_id: number;
  tarif: string;
  tarif_stopdesk: string;
};

let cachedLivraison: FeeEntry[] | null = null;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wilayaIdStr = searchParams.get('wilaya_id');
    
    if (!wilayaIdStr) {
      return NextResponse.json({ error: 'wilaya_id parameter is required' }, { status: 400 });
    }
    
    const wilayaId = parseInt(wilayaIdStr, 10);
    if (isNaN(wilayaId)) {
      return NextResponse.json({ error: 'wilaya_id must be a valid integer' }, { status: 400 });
    }

    if (!cachedLivraison) {
      const baseUrl = process.env.ECOTRACK_BASE_URL;
      const token = process.env.ECOTRACK_TOKEN;
      
      if (!baseUrl || !token) {
        console.error('ECOTRACK_BASE_URL or ECOTRACK_TOKEN is not set');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }

      const res = await fetch(`${baseUrl}/api/v1/get/fees`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch shipping fees, status: ${res.status}`);
      }

      const data = await res.json();
      
      if (!data.livraison || !Array.isArray(data.livraison)) {
        throw new Error('Invalid response format from ECOTRACK API: missing livraison array');
      }

      cachedLivraison = data.livraison;
    }

    const entry = cachedLivraison!.find(f => f.wilaya_id === wilayaId);
    
    if (!entry) {
      return NextResponse.json({ error: 'Wilaya not found in active fees list' }, { status: 404 });
    }

    return NextResponse.json({
      home: parseInt(entry.tarif, 10),
      desk: entry.tarif_stopdesk === "0" ? null : parseInt(entry.tarif_stopdesk, 10)
    });
  } catch (error) {
    console.error('[GET /api/shipping-fees]', error);
    return NextResponse.json({ error: 'Failed to fetch shipping fees' }, { status: 502 });
  }
}
