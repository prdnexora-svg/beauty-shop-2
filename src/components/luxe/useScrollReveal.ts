import { useEffect } from 'react';

/**
 * useScrollReveal — Global scroll observer hook.
 * Scans the DOM for elements with `data-reveal`, `.reveal`, or standard `<section>` tags,
 * and seamlessly adds `reveal-visible` as they enter the viewport with elegant smooth timing.
 */
export function useScrollReveal(dependencyKey?: any) {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const elements = document.querySelectorAll<HTMLElement>(
      '[data-reveal], .reveal, section:not(.no-reveal)'
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            
            // Extract optional delay from data-reveal-delay attribute
            const delay = el.getAttribute('data-reveal-delay');
            if (delay) {
              el.style.transitionDelay = `${delay}ms`;
            }

            el.classList.add('reveal-visible');

            // Stagger children with data-reveal-child attribute
            const children = el.querySelectorAll<HTMLElement>('[data-reveal-child]');
            children.forEach((child, index) => {
              const childDelay = Number(child.getAttribute('data-reveal-delay')) || index * 80;
              child.style.transitionDelay = `${childDelay}ms`;
              child.classList.add('reveal-visible');
            });

            // Unobserve after animating once for butter-smooth scrolling performance
            observer.unobserve(el);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    elements.forEach((el) => {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal');
      }
      const dir = el.getAttribute('data-reveal-dir');
      if (dir === 'left') el.classList.add('reveal-left');
      if (dir === 'right') el.classList.add('reveal-right');
      if (dir === 'fade') el.classList.add('reveal-fade');
      
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [dependencyKey]);
}
