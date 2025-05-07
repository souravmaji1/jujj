import { AbsoluteFill, Audio, Sequence, useVideoConfig, Video as RemotionVideo } from 'remotion';
import SubtitleOverlay from '../components/SubtitleOverlay';

export const VideoComposition = ({ videoUrls, audioUrl, subtitles, styleType, duration }) => {
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const expectedDurationInFrames = Math.ceil(duration * fps);

  console.log('VideoComposition rendering:', {
    videoUrls,
    audioUrl,
    subtitles,
    styleType,
    duration,
    durationInFrames,
    expectedDurationInFrames,
    fps
  });

  let currentFrame = 0;

  return (
    <AbsoluteFill>
      {videoUrls.map((videoUrl, index) => {
        const clipDurationInFrames = Math.ceil(duration * fps / videoUrls.length); // Distribute duration evenly or adjust based on metadata if available
        const startFrame = currentFrame;
        currentFrame += clipDurationInFrames;

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={clipDurationInFrames}
          >
            <RemotionVideo
              src={videoUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => console.error(`Remotion Video load error for clip ${index}:`, e)}
            />
          </Sequence>
        );
      })}
      {audioUrl && (
        <Audio
          src={audioUrl}
          startFrom={0}
          endAt={durationInFrames}
          onError={(e) => console.error('Remotion Audio load error:', e)}
        />
      )}
      <SubtitleOverlay subtitles={subtitles} styleType={styleType} />
    </AbsoluteFill>
  );
};

export const RemotionComposition = () => {
  return (
    <Composition
      id="VideoWithSubtitlesAndAudio"
      component={VideoComposition}
      durationInFrames={30 * 30}
      fps={30}
      width={606}
      height={1080}
      defaultProps={{
        videoUrls: [],
        audioUrl: '',
        subtitles: [],
        styleType: 'none',
        duration: 30
      }}
    />
  );
};