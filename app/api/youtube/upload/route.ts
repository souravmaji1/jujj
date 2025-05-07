import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = authHeader.split(' ')[1];
  const formData = await request.formData();
  const videoFile = formData.get('video') as File;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;

  if (!videoFile) {
    return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
  }

  try {
    // Create an OAuth2 client with the access token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    // Initialize the YouTube API client with the OAuth2 client
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    // Convert the File to a buffer and create a readable stream
    const fileBuffer = await videoFile.arrayBuffer();
    const fileStream = Readable.from(Buffer.from(fileBuffer));

    // Get MIME type from the file
    const contentType = videoFile.type || 'video/mp4';

    // Validate and sanitize the title
    let sanitizedTitle = title ? title.trim() : '';
    if (!sanitizedTitle) {
      sanitizedTitle = 'My Video ' + new Date().toISOString().split('T')[0];
    }
    if (sanitizedTitle.length > 100) {
      sanitizedTitle = sanitizedTitle.substring(0, 97) + '...';
    }
    
    console.log('Uploading video with title:', sanitizedTitle);
    
    // Upload the video
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: sanitizedTitle,
          description: description || 'Uploaded with Next.js YouTube Uploader',
          categoryId: '22', // People & Blogs category
        },
        status: {
          privacyStatus: 'private',
        },
      },
      media: {
        body: fileStream,
        mimeType: contentType,
      },
    }, {
      timeout: 180000, // 3 minutes timeout
      onUploadProgress: (evt) => {
        console.log(`Upload progress: ${evt.bytesRead}`);
      }
    });

    const videoId = response.data.id; // Extract YouTube video ID

    console.log('Video uploaded successfully:', response.data);

    return NextResponse.json({
      ...response.data,
      youtubeVideoId: videoId // Include video ID in response
    });
  } catch (error) {
    console.error('Error uploading video:', error.message);
    
    return NextResponse.json({ 
      error: 'Failed to upload video', 
      details: error.message || error.toString() 
    }, { status: 500 });
  }
}