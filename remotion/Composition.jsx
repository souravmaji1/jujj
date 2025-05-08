import { AbsoluteFill, Audio, Video as RemotionVideo, Sequence, Composition } from 'remotion';

// Constants
export const FPS = 30;
export const DURATION_IN_FRAMES = 300; // 10 seconds at 30 FPS

/**
 * VideoComposition component
 * @param {Object} props
 * @param {{ src: string, start: number, end: number }[]} props.clips - Array of video clips
 * @param {string | null} props.audioTrack - URL of the audio track
 * @param {number} props.audioVolume - Audio volume (0 to 1)
 * @param {number} props.totalDurationInFrames - Total duration in frames
 */
const VideoComposition = ({ clips, audioTrack, audioVolume, totalDurationInFrames }) => {
  let currentFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#111827' }}>
      <Sequence from={0} durationInFrames={totalDurationInFrames}>
        {clips && clips.length > 0 ? (
          clips.map((clip, index) => {
            const startFrame = currentFrame;
            const durationInSeconds = Math.max(clip.end - clip.start, 1 / FPS);
            const durationInFrames = Math.round(durationInSeconds * FPS);
            currentFrame += durationInFrames;

            return (
              <Sequence key={index} from={startFrame} durationInFrames={durationInFrames}>
                <RemotionVideo
                  src={clip.src}
                  startFrom={Math.round(clip.start * FPS)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => console.error(`Error loading video ${clip.src}:`, e)}
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
      {audioTrack && (
        <Audio
          src={audioTrack}
          volume={audioVolume}
          startFrom={0}
          endAt={totalDurationInFrames}
          onError={(e) => console.error(`Error loading audio ${audioTrack}:`, e)}
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
        clips: [], // Empty array for no clips
        audioTrack: null, // Null for no audio
        audioVolume: 0.5, // Default volume (0 to 1)
        totalDurationInFrames: DURATION_IN_FRAMES, // Consistent with composition duration
      }}
    />
  );
};
