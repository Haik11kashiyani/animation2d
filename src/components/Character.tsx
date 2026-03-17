// Character.tsx — SVG character system with expression + pose animation
import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

type Emotion = 'neutral' | 'happy' | 'surprised' | 'sad' | 'angry' | 'thinking' | 'excited' | 'scared';
type Pose = 'idle' | 'talking' | 'walking' | 'pointing' | 'sitting' | 'celebrating';

interface CharacterProps {
  name: string;
  emotion: Emotion;
  pose: Pose;
  position: 'left' | 'center' | 'right';
  scale: number;
  accentColor: string;
  durationFrames: number;
}

// Eye shapes per emotion
const EYE_SHAPES: Record<Emotion, { left: string; right: string; brow: number }> = {
  neutral: { left: 'M28,42 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0', right: 'M48,42 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0', brow: 0 },
  happy: { left: 'M28,43 Q32,38 36,43', right: 'M48,43 Q52,38 56,43', brow: -2 },
  surprised: { left: 'M28,40 a5,6 0 1,0 10,0 a5,6 0 1,0 -10,0', right: 'M48,40 a5,6 0 1,0 10,0 a5,6 0 1,0 -10,0', brow: -5 },
  sad: { left: 'M29,44 a4,3 0 1,0 8,0 a4,3 0 1,0 -8,0', right: 'M49,44 a4,3 0 1,0 8,0 a4,3 0 1,0 -8,0', brow: 3 },
  angry: { left: 'M28,43 a4,3 0 1,0 8,0 a4,3 0 1,0 -8,0', right: 'M48,43 a4,3 0 1,0 8,0 a4,3 0 1,0 -8,0', brow: 4 },
  thinking: { left: 'M29,42 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0', right: 'M50,41 a3,4 0 1,0 6,0 a3,4 0 1,0 -6,0', brow: -1 },
  excited: { left: 'M27,40 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0', right: 'M47,40 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0', brow: -4 },
  scared: { left: 'M27,39 a6,7 0 1,0 12,0 a6,7 0 1,0 -12,0', right: 'M47,39 a6,7 0 1,0 12,0 a6,7 0 1,0 -12,0', brow: -6 },
};

// Mouth shapes per emotion
const MOUTH_SHAPES: Record<Emotion, string> = {
  neutral: 'M36,56 Q42,60 48,56',
  happy: 'M34,55 Q42,65 50,55',
  surprised: 'M38,56 a4,5 0 1,0 8,0 a4,5 0 1,0 -8,0',
  sad: 'M36,60 Q42,55 48,60',
  angry: 'M36,58 L42,56 L48,58',
  thinking: 'M38,57 Q40,59 44,57',
  excited: 'M33,54 Q42,68 51,54',
  scared: 'M38,57 a3,4 0 1,0 8,0 a3,4 0 1,0 -8,0',
};

const Character: React.FC<CharacterProps> = ({
  name,
  emotion,
  pose,
  position,
  scale,
  accentColor,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Position mapping
  const posX = position === 'left' ? '18%' : position === 'right' ? '65%' : '38%';

  // Spring entrance animation
  const entrance = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });

  // Breathing animation (idle)
  const breathe = Math.sin(frame * 0.06) * 3;

  // Head bob (talking)
  const headBob = pose === 'talking' ? Math.sin(frame * 0.15) * 4 : 0;

  // Walking bounce
  const walkBounce = pose === 'walking' ? Math.abs(Math.sin(frame * 0.12)) * 8 : 0;
  const walkSway = pose === 'walking' ? Math.sin(frame * 0.12) * 5 : 0;

  // Celebrating jump
  const celebrateJump = pose === 'celebrating' ? Math.abs(Math.sin(frame * 0.1)) * 20 : 0;

  // Arm pose
  const getArmAngle = () => {
    switch (pose) {
      case 'pointing': return -45;
      case 'celebrating': return -30 + Math.sin(frame * 0.1) * 30;
      case 'talking': return Math.sin(frame * 0.08) * 10;
      case 'walking': return Math.sin(frame * 0.12) * 20;
      default: return 0;
    }
  };

  // Eye state
  const eyes = EYE_SHAPES[emotion] || EYE_SHAPES.neutral;
  const mouth = MOUTH_SHAPES[emotion] || MOUTH_SHAPES.neutral;

  // Blink animation (random blinks)
  const blinkCycle = Math.floor(frame / 90); // Blink every ~1.5s
  const blinkFrame = frame % 90;
  const isBlinking = blinkFrame >= 85 && blinkFrame <= 89;

  // Shadow animation
  const shadowScale = 1 + Math.sin(frame * 0.06) * 0.05;

  // Generate a consistent skin tone from character name
  const nameHash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const skinTones = ['#FFDBB4', '#E8B88A', '#C68642', '#8D5524', '#F1C27D', '#FFDBAC'];
  const skinColor = skinTones[nameHash % skinTones.length];
  const hairColors = ['#2C1B0E', '#8B4513', '#D4A574', '#1A1A1A', '#C44A2F', '#FFD700'];
  const hairColor = hairColors[(nameHash + 3) % hairColors.length];

  return (
    <div style={{
      position: 'absolute',
      left: posX,
      bottom: `${10 + walkBounce}%`,
      transform: `scale(${scale * entrance}) translateX(${walkSway}px)`,
      transformOrigin: 'bottom center',
      width: '300px',
      height: '600px',
    }}>
      {/* Drop shadow */}
      <div style={{
        position: 'absolute',
        bottom: '-10px',
        left: '50%',
        transform: `translateX(-50%) scaleX(${shadowScale})`,
        width: '120px',
        height: '20px',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: '50%',
        filter: 'blur(8px)',
      }} />

      <svg
        viewBox="0 0 84 140"
        width="300"
        height="600"
        style={{
          filter: `drop-shadow(0 4px 12px rgba(0,0,0,0.3))`,
        }}
      >
        {/* Body */}
        <g transform={`translate(0, ${breathe - celebrateJump})`}>
          {/* Torso */}
          <path
            d={`M30,75 L30,105 Q30,110 35,110 L49,110 Q54,110 54,105 L54,75 Q42,70 30,75`}
            fill={accentColor}
            opacity={0.9}
          />

          {/* Left arm */}
          <g transform={`rotate(${getArmAngle()}, 30, 80)`}>
            <path d="M30,78 L18,100 L22,102 L32,82" fill={skinColor} />
          </g>

          {/* Right arm */}
          <g transform={`rotate(${-getArmAngle()}, 54, 80)`}>
            <path d="M54,78 L66,100 L62,102 L52,82" fill={skinColor} />
          </g>

          {/* Legs */}
          <g transform={`translate(0, 0)`}>
            <path
              d={`M35,110 L${33 + walkSway * 0.3},135 L38,135 L40,112`}
              fill={skinColor}
            />
            <path
              d={`M44,112 L${46 - walkSway * 0.3},135 L51,135 L49,110`}
              fill={skinColor}
            />
            {/* Shoes */}
            <ellipse cx={35 + walkSway * 0.3} cy={136} rx={6} ry={3} fill="#333" />
            <ellipse cx={48 - walkSway * 0.3} cy={136} rx={6} ry={3} fill="#333" />
          </g>
        </g>

        {/* Head group — breathing + head bob */}
        <g transform={`translate(0, ${breathe + headBob - celebrateJump})`}>
          {/* Neck */}
          <rect x={38} y={62} width={8} height={14} fill={skinColor} rx={2} />

          {/* Head shape */}
          <ellipse cx={42} cy={48} rx={18} ry={20} fill={skinColor} />

          {/* Hair */}
          <path
            d={`M24,44 Q24,24 42,22 Q60,24 60,44 Q58,32 42,30 Q26,32 24,44`}
            fill={hairColor}
          />

          {/* Eyes (or blink lines) */}
          {isBlinking ? (
            <>
              <line x1={29} y1={43} x2={35} y2={43} stroke="#333" strokeWidth={1.5} />
              <line x1={49} y1={43} x2={55} y2={43} stroke="#333" strokeWidth={1.5} />
            </>
          ) : (
            <>
              <path d={eyes.left} fill="#333" />
              <path d={eyes.right} fill="#333" />
              {/* Eye highlights */}
              <circle cx={33} cy={41} r={1.5} fill="white" opacity={0.8} />
              <circle cx={53} cy={41} r={1.5} fill="white" opacity={0.8} />
            </>
          )}

          {/* Eyebrows */}
          <line
            x1={28} y1={36 + eyes.brow} x2={36} y2={35 + eyes.brow}
            stroke={hairColor} strokeWidth={1.5} strokeLinecap="round"
          />
          <line
            x1={48} y1={35 + eyes.brow} x2={56} y2={36 + eyes.brow}
            stroke={hairColor} strokeWidth={1.5} strokeLinecap="round"
          />

          {/* Mouth */}
          <path d={mouth} fill={emotion === 'happy' || emotion === 'excited' ? '#FF6B6B' : '#CC6666'} stroke="none" />

          {/* Blush for happy/excited */}
          {(emotion === 'happy' || emotion === 'excited') && (
            <>
              <circle cx={28} cy={52} r={4} fill="#FF9999" opacity={0.3} />
              <circle cx={56} cy={52} r={4} fill="#FF9999" opacity={0.3} />
            </>
          )}
        </g>

        {/* Name tag */}
        <g transform="translate(42, 140)">
          <text
            textAnchor="middle"
            y={5}
            fill="white"
            fontSize={6}
            fontFamily="system-ui, sans-serif"
            fontWeight="bold"
            opacity={0.8}
          >
            {name}
          </text>
        </g>
      </svg>
    </div>
  );
};

export default Character;
