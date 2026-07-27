import { NextRequest, NextResponse } from 'next/server';
import { generateAvatarSvg } from '@/lib/dicebear';

// Renders the user's Dicebear avatar as an SVG directly from our own server —
// no request ever leaves the app to api.dicebear.com. The route param is the
// (lowercased, trimmed) email seed, so the same account always gets the same
// avatar without storing any image bytes in Firestore.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ seed: string }> }) {
  const { seed } = await params;
  const svg = generateAvatarSvg(decodeURIComponent(seed));

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      // Same seed always produces the same avatar, so this is safe to cache hard.
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
