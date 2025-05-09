

  //  const githubToken = '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';
  import JSZip from 'jszip';
  import { NextResponse } from 'next/server';
  
  export async function POST(request) {
    try {
      const { videoUrls, audioUrl, duration } = await request.json();
      console.log('Render-video API received:', { videoUrls, audioUrl, duration });
  
      if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0 || !duration) {
        return NextResponse.json({ error: 'Video URLs array and duration are required' }, { status: 400 });
      }
  
      const props = {
        videoUrls, // Array of { src, start, end }
        audioUrl: audioUrl || '',
        duration,
        totalDurationInFrames: Math.round(duration * 30), // Assuming 30 FPS
        audioVolume: 0.5, // Default volume
        outputFile: `rendered_${Date.now()}.mp4`
      };
      console.log('Dispatching workflow with props:', JSON.stringify(props));
  
      const githubToken = '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';
      const repoOwner = 'souravmaji1';
      const repoName = 'jujj';
  
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
  
      // Step 4: Download artifact ZIP
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
  
      // Step 6: Return the MP4 file
      return new NextResponse(mp4ArrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename=${props.outputFile}`
        }
      });
    } catch (error) {
      console.error('Error in render-video API:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }