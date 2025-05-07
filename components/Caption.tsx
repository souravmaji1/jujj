import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const Caption: React.FC<{
  text: string;
  startFrame: number;
  endFrame: number;
  position?: "top" | "bottom";
}> = ({ text, startFrame, endFrame, position = "bottom" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Only show if within the caption's time range
  if (frame < startFrame || frame > endFrame) return null;

  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 15, endFrame - 15, endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const scale = spring({
    frame,
    fps,
    from: 0.8,
    to: 1,
    durationInFrames: 10,
  });

  const y = position === "bottom" ? -100 : 100;
  const translateY = spring({
    frame,
    fps,
    from: y,
    to: 0,
    durationInFrames: 15,
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: position === "bottom" ? "flex-end" : "flex-start",
        padding: position === "bottom" ? "0 0 80px 0" : "80px 0 0 0",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "white",
          fontSize: 48,
          fontWeight: "bold",
          textAlign: "center",
          padding: "20px 40px",
          borderRadius: 10,
          opacity,
          transform: `scale(${scale}) translateY(${translateY}px)`,
          width: "80%",
          margin: "0 auto",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};