import React, { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  /** Direction of the entrance motion */
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'none';
  /** Transition delay in ms — useful for staggering grids */
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span' | 'article' | 'main';
  /** Trigger threshold from 0.0 to 1.0 */
  threshold?: number;
}

/**
 * Reveal — Fades & slides content smoothly when entering the viewport.
 * Uses a single IntersectionObserver per instance and disconnects after reveal
 * to ensure 60fps buttery scrolling.
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  className = '',
  as: Tag = 'div',
  threshold = 0.1,
}) => {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  const dirClass =
    direction === 'left'
      ? 'reveal-left'
      : direction === 'right'
      ? 'reveal-right'
      : direction === 'down'
      ? 'reveal-down'
      : direction === 'scale'
      ? 'reveal-scale'
      : direction === 'none'
      ? 'reveal-fade'
      : '';

  return (
    <Tag
      ref={ref as React.MutableRefObject<HTMLElement>}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`reveal ${dirClass} ${visible ? 'reveal-visible' : ''} ${className}`}
    >
      {children}
    </Tag>
  );
};
