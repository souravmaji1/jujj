import JSZip from 'jszip';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ffmpeg from 'fluent-ffmpeg';
import { writeFile, unlink, readFile } from 'fs/promises';
import path from 'path';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// Set FFmpeg path for fluent-ffmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { videoPaths, audioPath, subtitles, styleType, segmentIndex, duration } = await request.json();
    console.log('Render-video API received:', { videoPaths, audioPath, subtitles, styleType, segmentIndex, duration });

    if (!videoPaths || !Array.isArray(videoPaths) || videoPaths.length === 0 || !duration) {
      return NextResponse.json({ error: 'Video paths array and duration are required' }, { status: 400 });
    }

    const validStyles = ['none', 'hormozi', 'abdaal', 'neonGlow', 'retroWave', 'minimalPop'];
    if (!validStyles.includes(styleType)) {
      return NextResponse.json({ error: `Invalid styleType. Must be one of: ${validStyles.join(', ')}` }, { status: 400 });
    }

    if (!subtitles || !Array.isArray(subtitles) || subtitles.some(s => !s.text || !s.start || !s.end)) {
      console.warn('Invalid subtitles format, using empty array:', subtitles);
    }

    // Download and combine video clips
    const combinedVideoPath = path.join('/tmp', `combined_${Date.now()}.mp4`);
    const fileListPath = path.join('/tmp', `filelist_${Date.now()}.txt`);
    const downloadedFiles = [];

    try {
      // Download video clips from Supabase
      for (let i = 0; i < videoPaths.length; i++) {
        const videoPath = videoPaths[i];
        const fileName = `input_${i}.mp4`;
        const filePath = path.join('/tmp', fileName);
        const { data, error } = await supabase.storage
          .from('avatars')
          .download(videoPath);
        if (error) {
          throw new Error(`Failed to download video ${videoPath}: ${error.message}`);
        }
        const buffer = Buffer.from(await data.arrayBuffer());
        await writeFile(filePath, buffer);
        downloadedFiles.push(filePath);
      }

      // Create file list for FFmpeg
      const fileListContent = downloadedFiles.map(file => `file '${file}'`).join('\n');
      await writeFile(fileListPath, fileListContent);

      // Combine videos using fluent-ffmpeg
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(fileListPath)
          .inputOptions(['-f concat', '-safe 0'])
          .outputOptions(['-an', '-c:v copy'])
          .output(combinedVideoPath)
          .on('end', resolve)
          .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
          .run();
      });

      // Upload combined video to Supabase
      const combinedFileBuffer = await readFile(combinedVideoPath);
      const combinedFileName = `combined_${Date.now()}.mp4`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(combinedFileName, combinedFileBuffer);
      if (uploadError) {
        throw new Error(`Failed to upload combined video: ${uploadError.message}`);
      }

      const props = {
        videoPath: uploadData.path,
        audioPath: audioPath || '',
        subtitles: subtitles && Array.isArray(subtitles) ? subtitles : [],
        styleType,
        duration,
        outputFile: `rendered_${segmentIndex}_${Date.now()}.mp4`
      };
      console.log('Dispatching workflow with props:', JSON.stringify(props));

      const githubToken = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
      const repoOwner = 'souravmaji1';
      const repoName = 'Videosync';

      // Step 1: Trigger GitHub Actions workflow
      const dispatchResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            event_type: 'render-video',
            client_payload: props
          })
        }
      );

      if (!dispatchResponse.ok) {
        const errorData = await dispatchResponse.json();
        throw new Error(`Failed to trigger workflow: ${errorData.message}`);
      }

      // Step 2: Poll for workflow completion
      let workflowRunId = null;
      let attempts = 0;
      const maxAttempts = 60;

      while (attempts < maxAttempts) {
        const runsResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs`,
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: 'application/vnd.github.v3+json'
            }
          }
        );

        if (!runsResponse.ok) {
          throw new Error('Failed to fetch workflow runs');
        }

        const runsData = await runsResponse.json();
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
        const runResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs/${workflowRunId}`,
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: 'application/vnd.github.v3+json'
            }
          }
        );

        if (!runResponse.ok) {
          throw new Error('Failed to fetch workflow status');
        }

        const runData = await runResponse.json();
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
      const artifactsResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs/${workflowRunId}/artifacts`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );

      if (!artifactsResponse.ok) {
        throw new Error('Failed to fetch artifacts');
      }

      const artifactsData = await artifactsResponse.json();
      const artifact = artifactsData.artifacts.find(a => a.name === 'rendered-video');

      if (!artifact) {
        throw new Error('Rendered video artifact not found');
      }

      // Step 4: Download artifact ZIP using archive_download_url
      const artifactResponse = await fetch(artifact.archive_download_url, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });

      if (!artifactResponse.ok) {
        throw new Error(`Failed to download artifact: ${artifactResponse.statusText}`);
      }

      const artifactZip = await artifactResponse.arrayBuffer();

      // Step 5: Extract MP4 from ZIP
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(artifactZip);
      const mp4File = Object.values(zipContent.files).find(file => file.name.endsWith('.mp4'));

      if (!mp4File) {
        throw new Error('No MP4 file found in artifact ZIP');
      }

      const mp4Blob = await mp4File.async('blob');
      const mp4ArrayBuffer = await mp4Blob.arrayBuffer();

      // Step 6: Return the MP4 file as a response with appropriate headers
      return new NextResponse(mp4ArrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename=reel_with_subtitle_${segmentIndex + 1}.mp4`
        }
      });
    } finally {
      // Cleanup temporary files
      for (const file of downloadedFiles) {
        await unlink(file).catch(err => console.error(`Failed to delete ${file}:`, err));
      }
      await unlink(fileListPath).catch(err => console.error(`Failed to delete ${fileListPath}:`, err));
      await unlink(combinedVideoPath).catch(err => console.error(`Failed to delete ${combinedVideoPath}:`, err));
    }
  } catch (error) {
    console.error('Error in render-video API:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}