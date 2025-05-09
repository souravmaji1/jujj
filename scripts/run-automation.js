const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const AdmZip = require('adm-zip');

// Initialize Supabase client
// Initialize Supabase client
const supabaseUrl = 'https://fmkjdrdiifebucfpkbsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZta2pkcmRpaWZlYnVjZnBrYnN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMTczMzcsImV4cCI6MjA1Nzc5MzMzN30.DpHqHHbpHnW981laR2u37syuQ8L_QEf6116vqsSMwGI';
const supabase = createClient(supabaseUrl, supabaseKey);
// Pexels API configuration
const PEXELS_API_URL = 'https://api.pexels.com/videos/search';

// GitHub API configuration
const GITHUB_API_URL = 'https://api.github.com/repos/souravmaji1/jujj';
const GITHUB_TOKEN = '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';

// Function to fetch videos from Pexels based on genres
async function fetchPexelsVideos(genres) {
  try {
    const query = genres[0] || 'vlog'; // Use first genre or fallback
    const response = await axios.get(PEXELS_API_URL, {
      headers: {
        Authorization: 'YZEvlBMM1hpvg0aZ6MMqzfudkMSgasdeorLGZAwoyt3R8uoM0l6mtVwU',
      },
      params: {
        query,
        per_page: 3, // Fetch 3 videos
      },
    });

    const videos = response.data.videos.map((video, index) => ({
      src: video.video_files[0].link,
      start: index * 10,
      end: (index + 1) * 10,
    }));

    return videos;
  } catch (error) {
    console.error('Error fetching Pexels videos:', error.message);
    return [];
  }
}

// Function to dispatch render-video event and handle the result
async function dispatchAndProcessRender(userId, videoUrls) {
  try {
    const duration = videoUrls.length * 10; // 10s per clip
   const props = {
  videoUrls,
  audioUrl: '',
  duration,
  totalDurationInFrames: Math.round(duration * 30), // Assuming 30 FPS
  audioVolume: 0.5, // Default volume
  outputFile: `rendered_${Date.now()}.mp4`
};

    // Step 1: Dispatch the render-video event
    const dispatchResponse = await axios.post(
      `${GITHUB_API_URL}/dispatches`,
      {
        event_type: 'render-video',
        client_payload: props,
      },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`Dispatched render-video for user ${userId}:`, dispatchResponse.status);

    // Step 2: Poll for workflow completion
    let workflowRunId = null;
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      const runsResponse = await axios.get(`${GITHUB_API_URL}/actions/runs`, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      const runsData = runsResponse.data;
      const recentRun = runsData.workflow_runs.find(
        run => run.event === 'repository_dispatch' && run.status !== 'completed'
      );

      if (recentRun) {
        workflowRunId = recentRun.id;
        console.log('Workflow triggered, run ID:', workflowRunId);
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    if (!workflowRunId) {
      throw new Error('Workflow not triggered within timeout');
    }

    // Poll for workflow completion
    attempts = 0;
    while (attempts < maxAttempts) {
      const runResponse = await axios.get(`${GITHUB_API_URL}/actions/runs/${workflowRunId}`, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      const runData = runResponse.data;
      if (runData.status === 'completed') {
        if (runData.conclusion !== 'success') {
          throw new Error(`Workflow failed: ${runData.conclusion}`);
        }
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Workflow did not complete within timeout');
    }

    // Step 3: Fetch artifacts
    const artifactsResponse = await axios.get(`${GITHUB_API_URL}/actions/runs/${workflowRunId}/artifacts`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const artifactsData = artifactsResponse.data;
    const artifact = artifactsData.artifacts.find(a => a.name === 'rendered-video');

    if (!artifact) {
      throw new Error('Rendered video artifact not found');
    }

    // Step 4: Download artifact ZIP
    const artifactResponse = await axios.get(artifact.archive_download_url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      responseType: 'arraybuffer',
    });

    const artifactZip = artifactResponse.data;

    // Step 5: Extract MP4 from ZIP
    const zip = new AdmZip(Buffer.from(artifactZip));
    const zipEntries = zip.getEntries();
    const mp4Entry = zipEntries.find(entry => entry.entryName.endsWith('.mp4'));

    if (!mp4Entry) {
      throw new Error('No MP4 file found in artifact ZIP');
    }

    const mp4Buffer = zip.readFile(mp4Entry);

    // Step 6: Upload to Supabase Storage
    const fileName = `rendered_${userId}_${Date.now()}.mp4`;
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, mp4Buffer, { contentType: 'video/mp4' });

    if (uploadError) {
      throw new Error(`Failed to upload video to Supabase: ${uploadError.message}`);
    }

    // Get public URL of the uploaded video
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const videoUrl = urlData.publicUrl;

    // Step 7: Update youtube_influencer table
    // Fetch current rendered_videos array
    const { data: currentData, error: fetchError } = await supabase
      .from('youtube_influencer')
      .select('rendered_videos')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch rendered_videos: ${fetchError.message}`);
    }

    // Append new video URL to the array
    const updatedVideos = [...(currentData.rendered_videos || []), videoUrl];

    // Update the table with the new array
    const { error: updateError } = await supabase
      .from('youtube_influencer')
      .update({
        rendered_videos: updatedVideos,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Failed to update rendered_videos: ${updateError.message}`);
    }

    console.log(`Video for user ${userId} uploaded and saved: ${videoUrl}`);
  } catch (error) {
    console.error(`Error processing render for user ${userId}:`, error.message);
  }
}

// Main function to process influencers
async function processInfluencers() {
  try {
    const { data: influencers, error } = await supabase
      .from('youtube_influencer')
      .select('user_id, video_genres');

    if (error) {
      throw new Error('Failed to fetch influencers: ' + error.message);
    }

    if (!influencers || influencers.length === 0) {
      console.log('No influencers found.');
      return;
    }

    for (const influencer of influencers) {
      const { user_id, video_genres } = influencer;

      if (!video_genres || video_genres.length === 0) {
        console.log(`No video genres for user ${user_id}. Skipping.`);
        continue;
      }

      console.log(`Processing influencer ${user_id} with genres:`, video_genres);

      const videoUrls = await fetchPexelsVideos(video_genres);
      if (videoUrls.length === 0) {
        console.log(`No videos found for user ${user_id}. Skipping.`);
        continue;
      }

      await dispatchAndProcessRender(user_id, videoUrls);
    }
  } catch (error) {
    console.error('Error processing influencers:', error.message);
  }
}

// Run the process
processInfluencers().catch(error => {
  console.error('Automation failed:', error.message);
  process.exit(1);
});