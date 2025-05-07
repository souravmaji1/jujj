import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const videoIds = searchParams.get('videoIds');

  if (!videoIds) {
    return NextResponse.json({ error: 'No video IDs provided' }, { status: 400 });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let accessToken = authHeader.split(' ')[1];

  try {
    // Check if access token is expired
    const { data: googleAccount, error: googleError } = await supabase
      .from('user_google_accounts')
      .select('access_token, expires_at, refresh_token')
      .eq('access_token', accessToken)
      .single();

    if (googleError || !googleAccount) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
    }

    if (Date.now() > googleAccount.expires_at) {
      // Refresh the access token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: googleAccount.refresh_token,
          grant_type: 'refresh_token'
        })
      });

      if (!refreshResponse.ok) {
        return NextResponse.json({ error: 'Failed to refresh access token' }, { status: 500 });
      }

      const { access_token, expires_in } = await refreshResponse.json();
      accessToken = access_token;

      // Update Supabase with new token
      await supabase
        .from('user_google_accounts')
        .update({
          access_token,
          expires_at: Date.now() + (expires_in * 1000)
        })
        .eq('access_token', googleAccount.access_token);
    }

    // Fetch video stats from YouTube API
    const youtubeResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${process.env.GOOGLE_API_KEY}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (!youtubeResponse.ok) {
      const errorData = await youtubeResponse.json();
      return NextResponse.json({ error: errorData.error.message }, { status: youtubeResponse.status });
    }

    const youtubeData = await youtubeResponse.json();
    console.log(JSON.stringify(youtubeData, null, 2));
    return NextResponse.json(youtubeData);
  } catch (error) {
    console.error('Error fetching YouTube stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}