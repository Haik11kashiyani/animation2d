// Root.tsx — Remotion entry point: registers the StoryVideo composition
import React from 'react';
import { Composition } from 'remotion';
import StoryVideo from './StoryVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="StoryVideo"
        component={StoryVideo}
        // Default duration — will be overridden by --props or calculateMetadata
        durationInFrames={3600}
        fps={60}
        width={1080}
        height={1920}
      />
    </>
  );
};
