// OutroSequence.tsx — End card with summary + CTA
import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

interface OutroSequenceProps {
  text: string;
  cta: string;
  primaryColor: string;
  accentColor: string;
}

const OutroSequence: React.FC<OutroSequenceProps> = ({
  text,
  cta,
  primaryColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  const textSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 60 },
  });

  const ctaSpring = spring({
    frame: frame - 50,
    fps,
    config: { damping: 16, stiffness: 80 },
  });

  // Pulsing CTA
  const ctaPulse = 1 + Math.sin(frame * 0.08) * 0.03;

  // Floating particles in outro
  const particles = Array.from({ length: 15 }, (_, i) => {
    const x = (i * 73) % 100;
    const y = (i * 131 + frame * 0.2) % 100;
    const size = 2 + (i % 3);
    const opacity = Math.sin(frame * 0.03 + i) * 0.3 + 0.3;
    return (
      <circle
        key={i}
        cx={`${x}%`}
        cy={`${y}%`}
        r={size}
        fill={accentColor}
        opacity={opacity}
      />
    );
  });

  return (
    <div style={{
      position: 'absolute',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(180deg, ${primaryColor}, #0A0A0A)`,
      opacity: fadeIn,
    }}>
      {/* Background particles */}
      <svg style={{ position: 'absolute', width: '100%', height: '100%' }}>
        {particles}
      </svg>

      {/* Decorative top line */}
      <div style={{
        width: '40%',
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        marginBottom: '40px',
        opacity: textSpring,
      }} />

      {/* Summary text */}
      <div style={{
        transform: `translateY(${(1 - textSpring) * 30}px)`,
        opacity: textSpring,
        textAlign: 'center',
        padding: '0 50px',
        maxWidth: '900px',
      }}>
        <p style={{
          fontSize: '44px',
          fontWeight: 700,
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          color: '#FFFFFF',
          lineHeight: 1.4,
          textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          margin: 0,
          fontStyle: 'italic',
        }}>
          "{text}"
        </p>
      </div>

      {/* Decorative line */}
      <div style={{
        width: '20%',
        height: '2px',
        background: accentColor,
        margin: '40px 0',
        opacity: ctaSpring,
      }} />

      {/* CTA */}
      <div style={{
        transform: `scale(${ctaSpring * ctaPulse})`,
        opacity: ctaSpring,
      }}>
        <div style={{
          padding: '15px 40px',
          borderRadius: '40px',
          background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`,
          boxShadow: `0 0 30px ${accentColor}40`,
        }}>
          <span style={{
            fontSize: '32px',
            fontWeight: 800,
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            color: '#FFFFFF',
            letterSpacing: '0.05em',
          }}>
            {cta}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OutroSequence;
