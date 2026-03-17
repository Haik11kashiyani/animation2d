// StoryVideo.tsx — Main Remotion composition: intro → scenes → outro
import React, { useEffect, useState } from 'react';
import { useCurrentFrame, Sequence, useVideoConfig, continueRender, delayRender, getStaticFiles, staticFile } from 'remotion';
import IntroSequence from './components/IntroSequence';
import OutroSequence from './components/OutroSequence';
import SceneRenderer from './components/SceneRenderer';

import type { StoryData, TimingData } from './types/story';

// We read JSON via fetch + delayRender since JSON imports aren't reliable in Remotion bundler
const StoryVideo: React.FC = () => {
  const { fps } = useVideoConfig();
  const [story, setStory] = useState<StoryData | null>(null);
  const [timing, setTiming] = useState<TimingData | null>(null);
  const [handle] = useState(() => delayRender());

  useEffect(() => {
    Promise.all([
      fetch(staticFile('story.json')).then(r => r.json()),
      fetch(staticFile('audio/timing.json')).then(r => r.json()),
    ]).then(([storyData, timingData]) => {
      setStory(storyData);
      setTiming(timingData);
      continueRender(handle);
    }).catch(err => {
      console.error('Failed to load data:', err);
      continueRender(handle);
    });
  }, [handle]);

  if (!story || !timing) {
    return <div style={{ width: 1080, height: 1920, backgroundColor: '#0A0A0A' }} />;
  }

  const introFrames = timing.introFrames || 4 * fps;
  const outroFrames = timing.outroFrames || 3 * fps;

  // Calculate scene start frames
  let currentFrame = introFrames;
  const sceneStarts: number[] = [];

  for (const sceneTiming of timing.scenes) {
    sceneStarts.push(currentFrame);
    currentFrame += sceneTiming.durationFrames;
  }

  const outroStart = currentFrame;

  return (
    <div style={{
      width: 1080,
      height: 1920,
      backgroundColor: '#0A0A0A',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Intro Sequence */}
      <Sequence from={0} durationInFrames={introFrames}>
        <IntroSequence
          title={story.title}
          genre={story.genre}
          primaryColor={story.colorPalette.primary}
          accentColor={story.colorPalette.accent}
        />
      </Sequence>

      {/* Story Scenes */}
      {story.scenes.map((scene, idx) => {
        const sceneTiming = timing.scenes[idx];
        if (!sceneTiming) return null;

        return (
          <Sequence
            key={scene.id}
            from={sceneStarts[idx]}
            durationInFrames={sceneTiming.durationFrames}
          >
            <SceneRenderer
              scene={scene}
              timing={sceneTiming}
              isLast={idx === story.scenes.length - 1}
            />
          </Sequence>
        );
      })}

      {/* Outro Sequence */}
      <Sequence from={outroStart} durationInFrames={outroFrames}>
        <OutroSequence
          text={story.outro.text}
          cta={story.outro.cta}
          primaryColor={story.colorPalette.primary}
          accentColor={story.colorPalette.accent}
        />
      </Sequence>
    </div>
  );
};

export default StoryVideo;
