import React from "react";
import { AbsoluteFill, Video } from "remotion";
import { Caption } from "./Caption";

export const VideoWithCaption: React.FC<{
  videoSrc: string;
  captions: Array<{
    text: string;
    startTime: number;
    endTime: number;
    position?: "top" | "bottom";
  }>;
  fps: number;
}> = ({ videoSrc, captions, fps }) => {
  return (
    <AbsoluteFill>
      <Video src={videoSrc} />
      {captions.map((caption, index) => (
        <Caption
          key={index}
          text={caption.text}
          startFrame={caption.startTime * fps}
          endFrame={caption.endTime * fps}
          position={caption.position}
        />
      ))}
    </AbsoluteFill>
  );
};