import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://universities.hipolabs.com/search', {
      headers: {
        'Accept': 'application/json',
      },
      // Cache for 1 hour to reduce API calls
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch universities: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching universities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch universities' },
      { status: 500 }
    );
  }
}