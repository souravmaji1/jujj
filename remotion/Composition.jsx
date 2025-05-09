import { AbsoluteFill, Audio, Video as RemotionVideo, Sequence, Composition } from 'remotion';

// Constants
export const FPS = 30;
export const DURATION_IN_FRAMES = 900; // 10 seconds at 30 FPS


export const VideoComposition = ({ videoUrls, audioUrl, audioVolume, totalDurationInFrames }) => {
  console.log('Props received:', { videoUrls, audioUrl, audioVolume, totalDurationInFrames });
  return (
    <AbsoluteFill style={{ backgroundColor: '#111827' }}>
      <Sequence from={0} durationInFrames={totalDurationInFrames}>
        {videoUrls && videoUrls.length > 0 ? (
          videoUrls.map((clip, index) => {
            const startFrame = Math.round(clip.start * FPS);
            const durationInSeconds = Math.max(clip.end - clip.start, 1 / FPS);
            const durationInFrames = Math.round(durationInSeconds * FPS);

            return (
              <Sequence key={index} from={startFrame} durationInFrames={durationInFrames}>
                <RemotionVideo
                  src={clip.src}
                  startFrom={0} // Start from the beginning of the clip
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => console.error(`Error loading video ${clip.src}:`, e.message)}
                />
              </Sequence>
            );
          })
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#888',
            }}
          >
            No clips selected
          </div>
        )}
      </Sequence>
      {audioUrl && (
        <Audio
          src={audioUrl}
          volume={audioVolume}
          startFrom={0}
          endAt={totalDurationInFrames}
          onError={(e) => console.error(`Error loading audio ${audioUrl}:`, e.message)}
        />
      )}
    </AbsoluteFill>
  );
};

/**
 * RemotionComposition component
 */
export const RemotionComposition = () => {
  return (
    <Composition
      id="VideoWithAudio"
      component={VideoComposition}
      durationInFrames={DURATION_IN_FRAMES} // Use constant or dynamic value
      fps={FPS}
      width={606}
      height={1080}
      defaultProps={{
        videoUrls: [], // Empty array for no clips
        audioUrl: null, // Null for no audio
        audioVolume: 0.5, // Default volume (0 to 1)
        totalDurationInFrames: DURATION_IN_FRAMES, // Consistent with composition duration
      }}
    />
  );
};