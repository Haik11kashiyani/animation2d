// SceneRenderer.tsx — Assembles all component layers for a single scene
import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import Background from './Background';
import Character from './Character';
import CinematicCamera from './CinematicCamera';
import PostProcessing from './PostProcessing';
import KaraokeSubtitles from './KaraokeSubtitles';
import ParticleSystem from './ParticleSystem';
import DynamicLighting from './DynamicLighting';
import TextOverlay from './TextOverlay';
import Transition from './Transition';

import type { Scene, SceneTiming } from '../types/story';

interface SceneRendererProps {
  scene: Scene;
  timing: SceneTiming;
  isLast: boolean;
}

const SceneRenderer: React.FC<SceneRendererProps> = ({
  scene,
  timing,
  isLast,
}) => {
  const { durationFrames } = timing;
  const transitionDuration = 30; // 0.5s at 60fps

  return (
    <div style={{
      position: 'absolute',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Post-processing wrapper (vignette, grain, color grade) */}
      <PostProcessing colorGrade={scene.colorGrade}>
        {/* Cinematic camera (Ken Burns) */}
        <CinematicCamera
          movement={scene.camera}
          durationFrames={durationFrames}
          intensity={0.5}
        >
          {/* Layer 1: Background */}
          <Background
            primaryColor={scene.background.primaryColor}
            secondaryColor={scene.background.secondaryColor}
            accentColor={scene.background.accentColor}
            elements={scene.background.elements}
            lightingDirection={scene.background.lightingDirection}
            durationFrames={durationFrames}
          />

          {/* Layer 2: Characters */}
          {scene.characters.map((char) => (
            <Character
              key={char.id}
              name={char.name}
              emotion={char.emotion}
              pose={char.pose}
              position={char.position}
              scale={char.scale}
              accentColor={scene.background.accentColor}
              durationFrames={durationFrames}
            />
          ))}
        </CinematicCamera>

        {/* Layer 3: Dynamic Lighting */}
        <DynamicLighting
          direction={scene.background.lightingDirection}
          color={scene.background.accentColor}
          intensity={0.25}
          durationFrames={durationFrames}
        />
      </PostProcessing>

      {/* Layer 4: Particles (outside post-processing for clarity) */}
      <ParticleSystem
        type={scene.particles}
        color={scene.background.accentColor}
        count={25}
      />

      {/* Layer 5: Scene title text */}
      <Sequence from={0} durationInFrames={Math.min(durationFrames, 120)}>
        <TextOverlay
          text={scene.title}
          fontSize={48}
          color="#FFFFFF"
          glowColor={scene.background.accentColor}
          position="top"
          effect="fadeUp"
          durationFrames={Math.min(durationFrames, 120)}
        />
      </Sequence>

      {/* Layer 6: Karaoke subtitles */}
      {timing.words && timing.words.length > 0 && (
        <KaraokeSubtitles
          words={timing.words}
          activeColor="#FFFFFF"
          glowColor={scene.background.accentColor}
          durationFrames={durationFrames}
        />
      )}

      {/* Layer 7: Narration audio */}
      <Audio
        src={staticFile(`audio/${timing.audioFile}`)}
        volume={1}
      />

      {/* Layer 8: Transition to next scene (at the end) */}
      {!isLast && (
        <Sequence from={durationFrames - transitionDuration} durationInFrames={transitionDuration}>
          <Transition
            type={scene.transition}
            durationFrames={transitionDuration}
            color="#000000"
          />
        </Sequence>
      )}
    </div>
  );
};

export default SceneRenderer;
