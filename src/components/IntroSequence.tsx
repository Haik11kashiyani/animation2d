// IntroSequence.tsx — Professional intro: particles → title zoom → genre badge
import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig, Easing } from 'remotion';

interface IntroSequenceProps {
  title: string;
  genre: string;
  primaryColor: string;
  accentColor: string;
}

const IntroSequence: React.FC<IntroSequenceProps> = ({
  title,
  genre,
  primaryColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Particle burst (0-60 frames / 0-1s)
  // Phase 2: Title zoom in (30-150 frames / 0.5-2.5s)
  // Phase 3: Genre badge (90-200 frames / 1.5-3.3s)
  // Phase 4: Fade out (180-240 frames / 3-4s)

  const titleSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, stiffness: 50 },
  });

  const genreSpring = spring({
    frame: frame - 90,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const fadeOut = interpolate(frame, [180, 240], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Particle burst
  const particles = Array.from({ length: 40 }, (_, i) => {
    const angle = (i / 40) * Math.PI * 2;
    const speed = 2 + (i % 5) * 1.5;
    const burstProgress = interpolate(frame, [0, 60], [0, 1], {
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.ease),
    });
    const x = 540 + Math.cos(angle) * speed * burstProgress * 200;
    const y = 960 + Math.sin(angle) * speed * burstProgress * 200;
    const opacity = interpolate(frame, [0, 20, 80], [0, 0.8, 0], { extrapolateRight: 'clamp' });
    const size = 3 + (i % 4) * 2;

    return (
      <circle
        key={i}
        cx={x}
        cy={y}
        r={size}
        fill={i % 2 === 0 ? accentColor : primaryColor}
        opacity={opacity}
      />
    );
  });

  // Background flash
  const flashOpacity = interpolate(frame, [0, 5, 30], [0, 0.6, 0], { extrapolateRight: 'clamp' });

  // Scan line effect
  const scanLineY = interpolate(frame, [10, 60], [-100, 2020], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      position: 'absolute',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0A0A0A',
      opacity: fadeOut,
    }}>
      {/* Background radial glow */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: `radial-gradient(circle at 50% 50%, ${primaryColor}30, transparent 70%)`,
        opacity: titleSpring,
      }} />

      {/* Flash overlay */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: accentColor,
        opacity: flashOpacity,
      }} />

      {/* Particle burst SVG */}
      <svg
        style={{ position: 'absolute', width: '100%', height: '100%' }}
        viewBox="0 0 1080 1920"
      >
        <defs>
          <filter id="introGlow">
            <feGaussianBlur stdDeviation="4" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#introGlow)">{particles}</g>
      </svg>

      {/* Scan line */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '3px',
        top: `${(scanLineY / 1920) * 100}%`,
        background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)`,
        opacity: interpolate(frame, [10, 60], [0.8, 0], { extrapolateRight: 'clamp' }),
      }} />

      {/* Title */}
      <div style={{
        transform: `scale(${titleSpring})`,
        opacity: titleSpring,
        textAlign: 'center',
        padding: '0 40px',
        zIndex: 10,
      }}>
        <h1 style={{
          fontSize: '72px',
          fontWeight: 900,
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          color: '#FFFFFF',
          textShadow: `
            0 0 30px ${accentColor}80,
            0 0 60px ${accentColor}40,
            0 4px 8px rgba(0,0,0,0.9)
          `,
          letterSpacing: '0.04em',
          lineHeight: 1.2,
          margin: 0,
        }}>
          {title}
        </h1>
      </div>

      {/* Genre badge */}
      <div style={{
        marginTop: '30px',
        transform: `translateY(${(1 - genreSpring) * 30}px)`,
        opacity: genreSpring,
        zIndex: 10,
      }}>
        <div style={{
          padding: '10px 30px',
          borderRadius: '30px',
          border: `2px solid ${accentColor}80`,
          backgroundColor: `${primaryColor}40`,
          backdropFilter: 'blur(10px)',
        }}>
          <span style={{
            fontSize: '28px',
            fontWeight: 700,
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}>
            {genre}
          </span>
        </div>
      </div>

      {/* Decorative lines */}
      <div style={{
        position: 'absolute',
        bottom: '20%',
        width: '60%',
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)`,
        opacity: genreSpring,
      }} />
    </div>
  );
};

export default IntroSequence;
