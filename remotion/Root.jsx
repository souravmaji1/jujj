import React from 'react';
import { Composition } from 'remotion';
import { MyComposition } from './Composition';

// Assuming 30fps and 30 second segments (900 frames)
const SEGMENT_DURATION = 30 * 30; // 30 seconds * 30 fps

export const RemotionRoot = ({ segments = [] }) => {
  if (!segments || segments.length === 0) {
    return null;
  }

  return (
    <>
      {segments.map((segment, index) => (
        <Composition
          key={index}
          id={`Segment-${index}`}
          component={MyComposition}
          durationInFrames={SEGMENT_DURATION}
          fps={30}
          width={607}
          height={1080}
          defaultProps={{
            segmentIndex: index,
            videoSrc: segment.url
          }}
        />
      ))}
    </>
  );
};

// Add this to ensure the component is properly recognized
RemotionRoot.displayName = 'RemotionRoot';