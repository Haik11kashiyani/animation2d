// CinematicCamera.tsx — Ken Burns camera engine: zoom, pan, shake
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';

type CameraMovement = 'zoomIn' | 'zoomOut' | 'panLeft' | 'panRight' | 'panUp' | 'panDown' | 'slowPush' | 'static';

interface CinematicCameraProps {
  movement: CameraMovement;
  durationFrames: number;
  intensity?: number; // 0-1, default 0.5
  children: React.ReactNode;
}

const CinematicCamera: React.FC<CinematicCameraProps> = ({
  movement,
  durationFrames,
  intensity = 0.5,
  children,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, durationFrames], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });

  let scale = 1;
  let translateX = 0;
  let translateY = 0;

  const maxZoom = 1 + intensity * 0.2; // e.g., 1.0 → 1.1
  const maxPan = intensity * 80; // pixels

  switch (movement) {
    case 'zoomIn':
      scale = interpolate(progress, [0, 1], [1, maxZoom]);
      break;
    case 'zoomOut':
      scale = interpolate(progress, [0, 1], [maxZoom, 1]);
      break;
    case 'panLeft':
      translateX = interpolate(progress, [0, 1], [maxPan, -maxPan]);
      break;
    case 'panRight':
      translateX = interpolate(progress, [0, 1], [-maxPan, maxPan]);
      break;
    case 'panUp':
      translateY = interpolate(progress, [0, 1], [maxPan * 0.5, -maxPan * 0.5]);
      break;
    case 'panDown':
      translateY = interpolate(progress, [0, 1], [-maxPan * 0.5, maxPan * 0.5]);
      break;
    case 'slowPush':
      scale = interpolate(progress, [0, 1], [1, 1 + intensity * 0.12]);
      translateY = interpolate(progress, [0, 1], [0, -maxPan * 0.3]);
      break;
    case 'static':
    default:
      // Very subtle breathing zoom
      scale = 1 + Math.sin(frame * 0.02) * 0.005;
      break;
  }

  // Subtle micro-shake for cinematic feel
  const shakeX = Math.sin(frame * 0.17) * 0.5;
  const shakeY = Math.cos(frame * 0.13) * 0.5;

  return (
    <div style={{
      position: 'absolute',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        transform: `scale(${scale}) translate(${translateX + shakeX}px, ${translateY + shakeY}px)`,
        transformOrigin: 'center center',
        willChange: 'transform',
      }}>
        {children}
      </div>
    </div>
  );
};

export default CinematicCamera;
