// app/api/zoom/auth/callback/route.js


import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  // Debug: Log received code
  console.log('Zoom OAuth Code:', code);

  try {
    const tokenResponse = await axios.post('https://zoom.us/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'http://localhost:3000/api/zoom/auth/callback' // Hardcode for dev
      },
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID}:${process.env.NEXT_PUBLIC_ZOOM_CLIENT_SECRET}`).toString('base64')}`,
      }
    });

    // Debug: Log tokens
    console.log('Zoom Tokens Received:', {
      access_token: !!tokenResponse.data.access_token,
      refresh_token: !!tokenResponse.data.refresh_token
    });

    const redirect = new URL('/', request.url);
    const response = NextResponse.redirect(redirect);

    // Set cookies with DEV-specific settings
    response.cookies.set('zoom_dev_access', tokenResponse.data.access_token, {
      httpOnly: false, // Disable for easier debugging
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Zoom Auth Error:', error.response?.data || error.message);
    return new Response('Authentication failed', { status: 500 });
  }
}