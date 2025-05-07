// app/api/youtube/channel/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request) {
  console.log("YouTube channel API called");
  
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    console.log("No Authorization header found");
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = authHeader.split(' ')[1];
  console.log("Access token received", accessToken ? "Token exists" : "No token");
  
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
      part: ['snippet', 'statistics'],
      mine: true,
    });

    console.log("YouTube API response received", response?.data);

    if (response.data.items && response.data.items.length > 0) {
      console.log("Channel found, returning data");
      return NextResponse.json(response.data.items[0]);
    }
    
    console.log("No channel found in response");
    return NextResponse.json({ error: 'No channel found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching channel info:', error);
    // Log the full error object
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Return more detailed error information for debugging
    return NextResponse.json({ 
      error: 'Failed to fetch channel info', 
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}