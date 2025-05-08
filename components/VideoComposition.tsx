import { useCurrentFrame, AbsoluteFill, Audio, Video, Sequence } from 'remotion';

export const FPS = 30;
export const DURATION_IN_FRAMES = 300; // 10 seconds at 30 FPS

export const VideoComposition: React.FC<{
  videoClips: string[];
  audioTrack?: string;
}> = ({ videoClips, audioTrack }) => {
  const frame = useCurrentFrame();
  const clipDuration = DURATION_IN_FRAMES / Math.max(1, videoClips.length);

  return (
    <AbsoluteFill style={{ backgroundColor: '#111827' }}>
      {videoClips.map((clip, index) => (
        <Sequence
          key={index}
          from={index * clipDuration}
          durationInFrames={clipDuration}
        >
          <Video
            src={clip}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Sequence>
      ))}
      {audioTrack && (
        <Audio
          src={audioTrack}
          volume={0.5}
        />
      )}
      {videoClips.length === 0 && (
        <AbsoluteFill style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ color: 'white', fontSize: '24px', textAlign: 'center' }}>
            Select clips to preview your video
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};