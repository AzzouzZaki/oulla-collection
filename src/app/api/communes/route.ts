import { NextRequest, NextResponse } from 'next/server';

type CommuneEntry = {
  nom: string;
  wilaya_id: number;
  code_postal: string;
  has_stop_desk: number;
};

let cachedCommunes: CommuneEntry[] | null = null;

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

    if (!cachedCommunes) {
      const baseUrl = process.env.ECOTRACK_BASE_URL;
      const token = process.env.ECOTRACK_TOKEN;
      
      if (!baseUrl) {
        console.error('ECOTRACK_BASE_URL is not set');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }

      const res = await fetch(`${baseUrl}/api/v1/get/communes`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('ECOTRACK API Error:', res.status, errorText);
        throw new Error(`Failed to fetch communes, status: ${res.status}`);
      }

      const data = await res.json();
      
      if (Array.isArray(data)) {
        cachedCommunes = data;
      } else if (data && typeof data === 'object') {
        if (data.data && Array.isArray(data.data)) {
          cachedCommunes = data.data;
        } else {
          cachedCommunes = Object.values(data) as CommuneEntry[];
        }
      } else {
        throw new Error('Invalid response format from ECOTRACK API for communes');
      }
    }

    const stopDesks = cachedCommunes!
      .filter(c => c.wilaya_id === wilayaId && c.has_stop_desk === 1)
      .map(c => c.nom)
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json(stopDesks);
  } catch (error) {
    console.error('[GET /api/communes]', error);
    return NextResponse.json({ error: 'Failed to fetch communes' }, { status: 502 });
  }
}
