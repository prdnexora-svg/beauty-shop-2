import React, { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  /** Direction of the entrance motion */
  direction?: 'up' | 'left' | 'right' | 'none';
  /** Transition delay in ms — useful for staggering grids */
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span';
}

/**
 * Reveal — fades & slides content in the first time it enters the viewport.
 * Uses a single IntersectionObserver per instance and stops observing after
 * the reveal so scrolling stays buttery. Respects prefers-reduced-motion via
 * the `.reveal` CSS rules in index.css.
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  className = '',
  as: Tag = 'div',
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
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const dirClass =
    direction === 'left'
      ? 'reveal-left'
      : direction === 'right'
      ? 'reveal-right'
      : direction === 'none'
      ? 'reveal-fade'
      : '';

  return (
    <Tag
      ref={ref as React.Ref<any> /* polymorphic tag: div | li | span */}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`reveal ${dirClass} ${visible ? 'reveal-visible' : ''} ${className}`}
    >
      {children}
    </Tag>
  );
};
