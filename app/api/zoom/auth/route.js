
 // app/api/zoom/auth/route.js

import { NextResponse } from 'next/server';

export async function GET() {
  const zoomAuthUrl = new URL('https://zoom.us/oauth/authorize');
  
  zoomAuthUrl.searchParams.append('response_type', 'code');
  zoomAuthUrl.searchParams.append('client_id', process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID);
  zoomAuthUrl.searchParams.append('redirect_uri', process.env.NEXT_PUBLIC_ZOOM_REDIRECT_URI);
  zoomAuthUrl.searchParams.append('state', crypto.randomUUID());

  return NextResponse.redirect(zoomAuthUrl.toString());
}