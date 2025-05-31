import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const response = await fetch(
      `https://api.opensea.io/api/v2/listings/collection/${params.slug}/all`,
      {
        headers: {
          'X-API-KEY': process.env.NEXT_PUBLIC_OPENSEA_API_KEY || '',
          accept: 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`OpenSea API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching all listings:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
} 