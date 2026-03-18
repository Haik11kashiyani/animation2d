// Character.tsx — Anime-style character with lip sync, proper sizing, detailed art
import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

type Emotion = 'neutral' | 'happy' | 'surprised' | 'sad' | 'angry' | 'thinking' | 'excited' | 'scared';
type Pose = 'idle' | 'talking' | 'walking' | 'pointing' | 'sitting' | 'celebrating';

interface WordTiming {
  word: string;
  startMs: number;
  endMs: number;
}

interface CharacterProps {
  name: string;
  emotion: Emotion;
  pose: Pose;
  position: 'left' | 'center' | 'right';
  scale: number;
  accentColor: string;
  durationFrames: number;
  characterCount?: number;  // How many chars in scene (for sizing)
  words?: WordTiming[];     // Word timings for lip sync
}

// Lip sync: determine mouth openness from word timing data
function getLipSyncOpenness(frame: number, fps: number, words?: WordTiming[]): number {
  if (!words || words.length === 0) return 0;
  const currentMs = (frame / fps) * 1000;

  for (const w of words) {
    if (currentMs >= w.startMs && currentMs <= w.endMs) {
      // During a word — oscillate mouth open/close for natural movement
      const wordProgress = (currentMs - w.startMs) / (w.endMs - w.startMs);
      // Quick open, hold, quick close
      if (wordProgress < 0.15) return wordProgress / 0.15;
      if (wordProgress > 0.85) return (1 - wordProgress) / 0.15;
      // Oscillate slightly while speaking
      return 0.6 + Math.sin(wordProgress * Math.PI * 3) * 0.4;
    }
  }
  return 0; // Between words — mouth closed
}

// Anime eye rendering
function AnimeEyes({ emotion, frame, isBlinking }: { emotion: Emotion; frame: number; isBlinking: boolean }) {
  if (isBlinking) {
    return (
      <g>
        <path d="M22,52 Q28,50 34,52" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M46,52 Q52,50 58,52" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    );
  }

  const shineOffset = Math.sin(frame * 0.03) * 0.5;

  const eyeConfigs: Record<Emotion, { leftPath: string; rightPath: string; pupilSize: number; browAngle: number; irisColor: string }> = {
    neutral: { leftPath: "M20,48 Q28,40 36,48 Q28,56 20,48", rightPath: "M44,48 Q52,40 60,48 Q52,56 44,48", pupilSize: 4, browAngle: 0, irisColor: "#4A90D9" },
    happy: { leftPath: "M21,50 Q28,44 35,50 Q28,52 21,50", rightPath: "M45,50 Q52,44 59,50 Q52,52 45,50", pupilSize: 4.5, browAngle: -3, irisColor: "#5BA3E6" },
    surprised: { leftPath: "M19,48 Q28,36 37,48 Q28,58 19,48", rightPath: "M43,48 Q52,36 61,48 Q52,58 43,48", pupilSize: 3, browAngle: -8, irisColor: "#4A90D9" },
    sad: { leftPath: "M22,50 Q28,44 34,50 Q28,55 22,50", rightPath: "M46,50 Q52,44 58,50 Q52,55 46,50", pupilSize: 4.5, browAngle: 5, irisColor: "#6B8EC2" },
    angry: { leftPath: "M22,50 Q28,44 34,50 Q28,54 22,50", rightPath: "M46,50 Q52,44 58,50 Q52,54 46,50", pupilSize: 3.5, browAngle: 8, irisColor: "#C44A4A" },
    thinking: { leftPath: "M21,49 Q28,42 35,49 Q28,55 21,49", rightPath: "M46,50 Q52,46 58,50 Q52,54 46,50", pupilSize: 4, browAngle: -2, irisColor: "#7B9ED4" },
    excited: { leftPath: "M19,48 Q28,38 37,48 Q28,56 19,48", rightPath: "M43,48 Q52,38 61,48 Q52,56 43,48", pupilSize: 5, browAngle: -6, irisColor: "#FFB347" },
    scared: { leftPath: "M19,47 Q28,35 37,47 Q28,58 19,47", rightPath: "M43,47 Q52,35 61,47 Q52,58 43,47", pupilSize: 2.5, browAngle: -10, irisColor: "#8FA8C8" },
  };
  const cfg = eyeConfigs[emotion];

  return (
    <g>
      {/* Eyebrows */}
      <path d={`M21,${38 + cfg.browAngle} Q28,${34 + cfg.browAngle} 35,${37 + cfg.browAngle}`}
        stroke="#4A3728" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d={`M45,${37 + cfg.browAngle} Q52,${34 + cfg.browAngle} 59,${38 + cfg.browAngle}`}
        stroke="#4A3728" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Eye whites */}
      <path d={cfg.leftPath} fill="white" stroke="#333" strokeWidth="1.5" />
      <path d={cfg.rightPath} fill="white" stroke="#333" strokeWidth="1.5" />
      {/* Iris */}
      <circle cx={28} cy={49} r={cfg.pupilSize + 2} fill={cfg.irisColor} />
      <circle cx={52} cy={49} r={cfg.pupilSize + 2} fill={cfg.irisColor} />
      {/* Pupil */}
      <circle cx={28} cy={49} r={cfg.pupilSize} fill="#1A1A2E" />
      <circle cx={52} cy={49} r={cfg.pupilSize} fill="#1A1A2E" />
      {/* Eye shine */}
      <circle cx={26 + shineOffset} cy={47} r={2} fill="white" opacity={0.9} />
      <circle cx={50 + shineOffset} cy={47} r={2} fill="white" opacity={0.9} />
      <circle cx={30} cy={50} r={1} fill="white" opacity={0.5} />
      <circle cx={54} cy={50} r={1} fill="white" opacity={0.5} />
      {/* Eyelashes */}
      <path d="M20,48 L18,44" stroke="#333" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M36,48 L38,44" stroke="#333" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M44,48 L42,44" stroke="#333" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M60,48 L62,44" stroke="#333" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}

// Lip-synced anime mouth
function AnimeMouth({ emotion, openness }: { emotion: Emotion; openness: number }) {
  // When speaking (openness > 0), animate mouth opening
  if (openness > 0.1) {
    const mouthHeight = 3 + openness * 6; // 3-9 range
    const mouthWidth = 5 + openness * 3;  // 5-8 range
    return (
      <g>
        {/* Open mouth shape */}
        <ellipse cx={40} cy={65} rx={mouthWidth} ry={mouthHeight}
          fill="#2D0A0A" stroke="#C44A4A" strokeWidth="1" />
        {/* Tongue hint */}
        <ellipse cx={40} cy={67 + mouthHeight * 0.3} rx={mouthWidth * 0.6} ry={mouthHeight * 0.3}
          fill="#FF8888" opacity={openness * 0.7} />
        {/* Teeth (top) */}
        <path d={`M${40 - mouthWidth + 1},${65 - mouthHeight * 0.3} Q40,${65 - mouthHeight * 0.1} ${40 + mouthWidth - 1},${65 - mouthHeight * 0.3}`}
          fill="white" opacity={openness > 0.4 ? 0.9 : 0} />
      </g>
    );
  }

  // Closed mouth — emotion-based
  const mouths: Record<Emotion, React.ReactNode> = {
    neutral: <path d="M34,64 Q40,67 46,64" fill="none" stroke="#C44A4A" strokeWidth="1.5" strokeLinecap="round" />,
    happy: (
      <g>
        <path d="M32,62 Q40,72 48,62" fill="#FF6B7A" stroke="#C44A4A" strokeWidth="1.2" />
        <path d="M34,62 Q40,64 46,62" fill="white" opacity="0.8" />
      </g>
    ),
    surprised: <ellipse cx={40} cy={66} rx={4} ry={5} fill="#FF6B7A" stroke="#C44A4A" strokeWidth="1" />,
    sad: <path d="M34,66 Q40,62 46,66" fill="none" stroke="#C44A4A" strokeWidth="1.5" strokeLinecap="round" />,
    angry: <path d="M34,64 L40,62 L46,64" fill="none" stroke="#C44A4A" strokeWidth="2" strokeLinecap="round" />,
    thinking: <circle cx={44} cy={65} r={2.5} fill="#FF6B7A" stroke="#C44A4A" strokeWidth="0.8" />,
    excited: (
      <g>
        <path d="M30,61 Q40,75 50,61" fill="#FF6B7A" stroke="#C44A4A" strokeWidth="1.2" />
        <path d="M33,61 Q40,64 47,61" fill="white" opacity="0.8" />
      </g>
    ),
    scared: <ellipse cx={40} cy={67} rx={5} ry={6} fill="#FF6B7A" stroke="#C44A4A" strokeWidth="1" />,
  };
  return <>{mouths[emotion]}</>;
}

// Anime hair styles
function AnimeHair({ hairColor, hairStyle }: { hairColor: string; hairStyle: number }) {
  const darkerHair = hairColor + 'CC';
  const styles = [
    // Style 0: Long flowing
    <>
      <path d="M14,35 Q10,20 20,10 Q30,2 40,4 Q50,2 60,10 Q70,20 66,35 L66,70 Q60,65 55,70 L55,35 Q50,25 40,23 Q30,25 25,35 L25,70 Q20,65 14,70 Z" fill={hairColor} />
      <path d="M18,35 Q22,28 30,32 Q35,26 40,30 Q45,24 50,30 Q55,26 62,35" fill={hairColor} stroke={darkerHair} strokeWidth="0.5" />
      <path d="M30,15 Q35,12 38,18" fill="white" opacity="0.15" />
    </>,
    // Style 1: Short spiky
    <>
      <path d="M16,38 Q12,20 22,8 Q30,0 40,2 Q50,0 58,8 Q68,20 64,38 Q55,30 40,28 Q25,30 16,38" fill={hairColor} />
      <path d="M20,30 L16,18 L24,28" fill={hairColor} />
      <path d="M30,25 L28,10 L35,22" fill={hairColor} />
      <path d="M42,23 L44,5 L48,22" fill={hairColor} />
      <path d="M52,26 L56,12 L57,28" fill={hairColor} />
      <path d="M32,12 Q36,10 38,15" fill="white" opacity="0.15" />
    </>,
    // Style 2: Medium wavy
    <>
      <path d="M15,36 Q12,22 20,12 Q28,4 40,3 Q52,4 60,12 Q68,22 65,36 L65,55 Q58,52 55,58 Q48,50 40,48 Q32,50 25,58 Q22,52 15,55 Z" fill={hairColor} />
      <path d="M19,36 Q24,30 32,34 Q36,28 42,33 Q48,28 52,33 Q56,28 61,36" fill={hairColor} stroke={darkerHair} strokeWidth="0.5" />
      <path d="M28,14 Q33,10 36,16" fill="white" opacity="0.12" />
    </>,
    // Style 3: Twin tails
    <>
      <path d="M16,36 Q14,22 22,12 Q30,5 40,4 Q50,5 58,12 Q66,22 64,36 Q55,32 40,30 Q25,32 16,36" fill={hairColor} />
      <path d="M16,38 Q8,45 6,65 Q5,80 12,85 Q14,78 15,65 Q16,50 20,40" fill={hairColor} />
      <path d="M64,38 Q72,45 74,65 Q75,80 68,85 Q66,78 65,65 Q64,50 60,40" fill={hairColor} />
      <circle cx={17} cy={39} r={3} fill="#FF6B9D" />
      <circle cx={63} cy={39} r={3} fill="#FF6B9D" />
      <path d="M20,36 Q28,28 36,34 Q40,26 44,34 Q52,28 60,36" fill={hairColor} stroke={darkerHair} strokeWidth="0.5" />
    </>,
  ];
  return <g>{styles[hairStyle % styles.length]}</g>;
}

const Character: React.FC<CharacterProps> = ({
  name, emotion, pose, position, scale, accentColor, durationFrames,
  characterCount = 1, words,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === PROPER SIZING ===
  // Viewport: 1080x1920. Character should be ~35-50% of screen height
  // Adjust based on how many characters are on screen
  const baseHeight = characterCount >= 3 ? 620 : characterCount === 2 ? 700 : 760;
  const baseWidth = baseHeight * 0.5;

  // Position — spread characters evenly, centered properly
  const positionMap: Record<string, { left: string; zIndex: number }> = {
    'left': { left: characterCount === 1 ? '25%' : '5%', zIndex: 1 },
    'center': { left: characterCount === 1 ? '30%' : '32%', zIndex: 2 },
    'right': { left: characterCount === 1 ? '35%' : '55%', zIndex: 1 },
  };
  const pos = positionMap[position] || positionMap['center'];

  // Entrance animation
  const entrance = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });

  // Movement animations
  const breathe = Math.sin(frame * 0.05) * 2;
  const headBob = pose === 'talking' ? Math.sin(frame * 0.12) * 2 : 0;
  const walkBounce = pose === 'walking' ? Math.abs(Math.sin(frame * 0.1)) * 5 : 0;
  const walkSway = pose === 'walking' ? Math.sin(frame * 0.1) * 4 : 0;
  const celebrateJump = pose === 'celebrating' ? Math.abs(Math.sin(frame * 0.08)) * 12 : 0;

  // Blink cycle
  const blinkFrame = frame % 120;
  const isBlinking = blinkFrame >= 115 && blinkFrame <= 119;

  // Lip sync
  const mouthOpenness = getLipSyncOpenness(frame, fps, words);

  // Deterministic appearance from name
  const nameHash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const skinTones = ['#FFDBB4', '#F5CBA7', '#E8B88A', '#C68642', '#8D5524', '#FFDBAC'];
  const skinColor = skinTones[nameHash % skinTones.length];
  const hairColors = ['#1A1A2E', '#8B4513', '#D4A574', '#2C1B0E', '#C44A2F', '#FFD700', '#FF69B4', '#4A90D9'];
  const hairColor = hairColors[(nameHash + 3) % hairColors.length];
  const outfitColors = [accentColor, '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#87CEEB'];
  const outfitColor = outfitColors[(nameHash + 5) % outfitColors.length];
  const hairStyle = nameHash % 4;

  // Arm angles
  const leftArmAngle = pose === 'pointing' ? -50 : pose === 'celebrating' ? -40 + Math.sin(frame * 0.08) * 25 :
    pose === 'talking' ? Math.sin(frame * 0.06) * 8 : pose === 'walking' ? Math.sin(frame * 0.1) * 15 : 5;
  const rightArmAngle = pose === 'pointing' ? -60 : pose === 'celebrating' ? -40 - Math.sin(frame * 0.08) * 25 :
    pose === 'talking' ? -Math.sin(frame * 0.06) * 8 : pose === 'walking' ? -Math.sin(frame * 0.1) * 15 : 5;

  return (
    <div style={{
      position: 'absolute',
      left: pos.left,
      bottom: `${5 + walkBounce}%`,
      transform: `scale(${scale * entrance}) translateX(${walkSway}px)`,
      transformOrigin: 'bottom center',
      width: `${baseWidth}px`,
      height: `${baseHeight}px`,
      zIndex: pos.zIndex,
    }}>
      {/* Drop shadow */}
      <div style={{
        position: 'absolute',
        bottom: '-5px',
        left: '50%',
        transform: `translateX(-50%) scaleX(${1 + Math.sin(frame * 0.05) * 0.05})`,
        width: `${baseWidth * 0.3}px`,
        height: '15px',
        backgroundColor: 'rgba(0,0,0,0.25)',
        borderRadius: '50%',
        filter: 'blur(6px)',
      }} />

      <svg viewBox="0 0 80 160" width={baseWidth} height={baseHeight}
        style={{ filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.25))' }}>
        <g transform={`translate(0, ${-celebrateJump})`}>

          {/* === BODY === */}
          <g transform={`translate(0, ${breathe})`}>
            {/* Torso */}
            <path d="M28,80 Q28,76 30,74 L32,72 Q40,68 48,72 L50,74 Q52,76 52,80 L52,105 Q40,108 28,105 Z" fill={outfitColor} />
            <path d="M35,72 L40,78 L45,72" fill="none" stroke="white" strokeWidth="1" opacity="0.6" />
            <path d="M30,85 Q40,88 50,85 L50,105 Q40,108 30,105 Z" fill="black" opacity="0.08" />
            <rect x={29} y={95} width={22} height={3} rx={1} fill={hairColor} opacity="0.4" />

            {/* Arms */}
            <g transform={`rotate(${leftArmAngle}, 28, 78)`}>
              <path d="M28,78 Q24,88 22,98 L25,99 Q26,90 29,80" fill={skinColor} />
              <path d="M28,78 Q26,82 25,86 L28,86 Q28,82 29,80" fill={outfitColor} />
              <circle cx={23} cy={99} r={3} fill={skinColor} />
            </g>
            <g transform={`rotate(${rightArmAngle}, 52, 78)`}>
              <path d="M52,78 Q56,88 58,98 L55,99 Q54,90 51,80" fill={skinColor} />
              <path d="M52,78 Q54,82 55,86 L52,86 Q52,82 51,80" fill={outfitColor} />
              <circle cx={57} cy={99} r={3} fill={skinColor} />
            </g>

            {/* Legs */}
            <g>
              <path d={`M33,105 L${31 + walkSway * 0.2},130 Q${31 + walkSway * 0.2},134 ${34 + walkSway * 0.2},134 L37,134 L37,130 L38,105`} fill={skinColor} />
              <path d={`M42,105 L${43 - walkSway * 0.2},130 Q${43 - walkSway * 0.2},134 ${46 - walkSway * 0.2},134 L49,134 L49,130 L47,105`} fill={skinColor} />
              <path d="M28,100 L30,115 Q40,118 50,115 L52,100 Q40,103 28,100" fill={outfitColor} opacity="0.9" />
              <ellipse cx={35 + walkSway * 0.2} cy={135} rx={5} ry={2.5} fill="#333" />
              <ellipse cx={47 - walkSway * 0.2} cy={135} rx={5} ry={2.5} fill="#333" />
            </g>
          </g>

          {/* === HEAD === */}
          <g transform={`translate(0, ${breathe + headBob})`}>
            <rect x={37} y={66} width={6} height={8} fill={skinColor} rx={2} />
            <ellipse cx={40} cy={45} rx={22} ry={25} fill={skinColor} />
            <path d="M22,50 Q25,65 40,70 Q55,65 58,50" fill="black" opacity="0.03" />

            {/* Nose */}
            <line x1={40} y1={57} x2={40} y2={59} stroke="#D4A574" strokeWidth="0.8" opacity="0.4" />

            {/* Blush */}
            {(emotion === 'happy' || emotion === 'excited') && (
              <>
                <ellipse cx={25} cy={56} rx={5} ry={3} fill="#FF9999" opacity="0.25" />
                <ellipse cx={55} cy={56} rx={5} ry={3} fill="#FF9999" opacity="0.25" />
              </>
            )}

            {/* Eyes */}
            <AnimeEyes emotion={emotion} frame={frame} isBlinking={isBlinking} />

            {/* Lip-synced mouth */}
            <AnimeMouth emotion={emotion} openness={mouthOpenness} />

            {/* Hair */}
            <AnimeHair hairColor={hairColor} hairStyle={hairStyle} />

            {/* Ears */}
            <ellipse cx={18} cy={50} rx={3} ry={5} fill={skinColor} />
            <ellipse cx={62} cy={50} rx={3} ry={5} fill={skinColor} />
          </g>
        </g>

        <defs>
          <filter id="noseShadow">
            <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.3" floodColor="#000" floodOpacity="0.1" />
          </filter>
        </defs>
      </svg>

      {/* Name label */}
      <div style={{
        position: 'absolute',
        bottom: '-30px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '4px 16px',
        borderRadius: '12px',
        backgroundColor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        whiteSpace: 'nowrap',
      }}>
        <span style={{
          fontSize: '20px',
          fontWeight: 700,
          fontFamily: "'Inter', system-ui, sans-serif",
          color: 'white',
          letterSpacing: '0.05em',
        }}>
          {name}
        </span>
      </div>
    </div>
  );
};

export default Character;
