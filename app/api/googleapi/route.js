// app/api/debug/googleapis/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    // Check if googleapis is properly loaded
    const apiVersion = google.version || 'unknown';
    
    // Check if YouTube API is accessible
    const youtubeAPI = google.youtube?.name || 'YouTube API not found';
    
    // Check OAuth2 client
    const oauth2Client = new google.auth.OAuth2();
    const oauth2Status = oauth2Client ? 'OAuth2 client created successfully' : 'Failed to create OAuth2 client';
    
    return NextResponse.json({
      status: 'API check successful',
      googleapisVersion: apiVersion,
      youtubeAPI,
      oauth2Status,
      environment: {
        nodeVersion: process.version,
        platform: process.platform
      }
    });
  } catch (error) {
    console.error('Error checking Google APIs:', error);
    
    return NextResponse.json({
      status: 'API check failed',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}