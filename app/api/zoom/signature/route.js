import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { meetingNumber, role } = body;
    
    // These should be environment variables
    const API_KEY = process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID;
    const API_SECRET = process.env.NEXT_PUBLIC_ZOOM_CLIENT_SECRET;
    
    if (!API_KEY || !API_SECRET) {
      return NextResponse.json(
        { error: 'Zoom API credentials not configured' }, 
        { status: 500 }
      );
    }

    // Create the signature
    const timestamp = new Date().getTime() - 30000;
    const msg = Buffer.from(API_KEY + meetingNumber + timestamp + role).toString('base64');
    const hash = crypto.createHmac('sha256', API_SECRET).update(msg).digest('base64');
    const signature = Buffer.from(`${API_KEY}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');

    return NextResponse.json({ signature });
  } catch (error) {
    console.error('Error generating signature:', error);
    return NextResponse.json(
      { error: 'Failed to generate signature' }, 
      { status: 500 }
    );
  }
}