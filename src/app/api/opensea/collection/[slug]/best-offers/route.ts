import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const response = await fetch(
      `https://api.opensea.io/api/v2/offers/collection/${slug}`,
      {
        headers: {
          'X-API-KEY': process.env.NEXT_PUBLIC_OPENSEA_API_KEY || '',
          'accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`OpenSea API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Sort offers by price (highest first) and take top 5
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortedOffers = data.offers.sort((a: any, b: any) => {
      const priceA = Number(a.price.current.value);
      const priceB = Number(b.price.current.value);
      return priceB - priceA;
    }).slice(0, 5);

    return NextResponse.json({ offers: sortedOffers });
  } catch (error) {
    console.error('Error fetching best offers:', error);
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
  }
} 