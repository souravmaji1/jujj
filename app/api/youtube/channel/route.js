import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SECRET;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  console.log("YouTube channel API called");

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    console.log("No Authorization header found");
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = authHeader.split(' ')[1];
  if (!accessToken) {
    console.log("No access token provided");
    return NextResponse.json({ error: 'No access token provided' }, { status: 401 });
  }

  const userId = request.headers.get('X-Clerk-User-ID');
  if (!userId) {
    console.log("No Clerk User ID provided");
    return NextResponse.json({ error: 'No Clerk User ID provided' }, { status: 401 });
  }

  try {
    // Create an OAuth2 client with the access token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    console.log("OAuth2 client created");

    // Initialize the YouTube API client with the OAuth2 client
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    console.log("YouTube client initialized, attempting to fetch channel data");

    // Fetch the channel information
    const response = await youtube.channels.list({
      part: ['snippet', 'statistics', 'contentDetails'],
      mine: true,
    });

    console.log("YouTube API response received", response?.data);

    if (response.data.items && response.data.items.length > 0) {
      const channel = response.data.items[0];
      const channelData = {
        channel_id: channel.id,
        channel_title: channel.snippet.title, // Changed from 'title' to 'channel_title'
        description: channel.snippet.description,
        custom_url: channel.snippet.customUrl || null,
        published_at: channel.snippet.publishedAt,
        thumbnail_url: channel.snippet.thumbnails?.default?.url || null,
        subscriber_count: parseInt(channel.statistics.subscriberCount) || 0,
        video_count: parseInt(channel.statistics.videoCount) || 0,
        view_count: parseInt(channel.statistics.viewCount) || 0,
        user_id: userId, // Use the Clerk user ID
      };

      console.log("Channel data prepared for Supabase", channelData);

      // Check if the user already exists in the youtube_influencer table
      const { data: existingRecord, error: checkError } = await supabase
        .from('youtube_influencer')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing record:', checkError);
        throw new Error(`Failed to check existing record: ${checkError.message}`);
      }

      let data;
      if (!existingRecord) {
        // No existing record, perform an insert
        console.log("No existing record found, inserting new record");
        const { data: insertData, error: insertError } = await supabase
          .from('youtube_influencer')
          .insert([channelData]);

        if (insertError) {
          console.error('Error inserting to youtube_influencer:', insertError);
          throw new Error(`Failed to insert channel data to Supabase: ${insertError.message}`);
        }
        data = insertData;
      } else {
        // Existing record found, perform an update
        console.log("Existing record found, updating record");
        const { data: updateData, error: updateError } = await supabase
          .from('youtube_influencer')
          .update(channelData)
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error updating youtube_influencer:', updateError);
          throw new Error(`Failed to update channel data in Supabase: ${updateError.message}`);
        }
        data = updateData;
      }

      console.log("Channel data saved to Supabase", data);
      return NextResponse.json(channel);
    }

    console.log("No channel found in response");
    return NextResponse.json({ error: 'No channel found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching channel info:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch or save channel info',
        details: error.message,
      },
      { status: 500 }
    );
  }
}