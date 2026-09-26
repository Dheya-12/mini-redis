'use client';
import { useEffect, useRef, useState } from 'react';

const OFFSET = { up: 'translateY(25px)', down: 'translateY(-15px)', none: 'none' };

/* Scroll-triggered entrance, as on huly.io: offset and transparent until the element enters the viewport. */
export default function Reveal({ children, from = 'up', delay = 0, threshold = 0.2, repeat = false, className, as: Tag = 'div', id }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); if (!repeat) observer.unobserve(entry.target); } else if (repeat) setShown(false);
    }, { threshold, rootMargin: '0px 0px -10% 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, repeat]);
  return (
    <Tag ref={ref} id={id} className={className} style={{ opacity: shown ? 1 : 0, transform: shown ? 'none' : OFFSET[from], transition: `opacity 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`, willChange: 'opacity, transform' }}>
      {children}
    </Tag>
  );
}
