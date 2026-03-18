// Root.tsx — Remotion entry point with dynamic duration from timing data
import React from 'react';
import { Composition, staticFile } from 'remotion';
import StoryVideo from './StoryVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="StoryVideo"
        component={StoryVideo}
        durationInFrames={3600}
        fps={60}
        width={1080}
        height={1920}
        calculateMetadata={async () => {
          try {
            const timingResponse = await fetch(staticFile('audio/timing.json'));
            const timing = await timingResponse.json();
            return {
              durationInFrames: timing.totalFrames || 3600,
              fps: 60,
              width: 1080,
              height: 1920,
            };
          } catch {
            return {
              durationInFrames: 3600,
              fps: 60,
              width: 1080,
              height: 1920,
            };
          }
        }}
      />
    </>
  );
};
