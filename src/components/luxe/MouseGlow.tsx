import React, { useEffect, useState, useRef } from 'react';

/**
 * MouseGlow — Dynamic mouse-tracking radial gradient spotlight.
 * Tracks the cursor coordinates using requestAnimationFrame for 60fps smoothness,
 * casting an ethereal radial glow in royal purple & gold brand accents.
 */
export const MouseGlow: React.FC = () => {
  const [position, setPosition] = useState({ x: -200, y: -200 });
  const [isVisible, setIsVisible] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const targetPosRef = useRef({ x: -200, y: -200 });

  useEffect(() => {
    // Only run on devices with fine pointer (mouse/trackpad)
    const mediaQuery = window.matchMedia('(pointer: fine)');
    if (!mediaQuery.matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      targetPosRef.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(() => {
          setPosition(targetPosRef.current);
          animationFrameRef.current = null;
        });
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-500 ease-out overflow-hidden"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {/* Primary Radial Glow Spotlight */}
      <div
        className="absolute rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out blur-3xl opacity-40 dark:opacity-60"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(107, 45, 140, 0.25) 0%, rgba(201, 169, 97, 0.15) 40%, rgba(61, 30, 78, 0) 70%)',
        }}
      />

      {/* Secondary Crisp Core Specular Shimmer */}
      <div
        className="absolute rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 ease-out blur-xl opacity-30"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '180px',
          height: '180px',
          background: 'radial-gradient(circle, rgba(239, 217, 160, 0.35) 0%, rgba(130, 54, 160, 0.2) 50%, transparent 80%)',
        }}
      />
    </div>
  );
};
