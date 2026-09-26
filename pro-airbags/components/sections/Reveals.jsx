'use client';
import {useEffect} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

export default function Reveals() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const els = gsap.utils.toArray('[data-reveal]');
    const tweens = els.map(el => gsap.fromTo(el, {opacity: 0, y: 26}, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', overwrite: 'auto',
      scrollTrigger: {trigger: el, start: 'top 90%', once: true},
    }));
    // Late layout shifts (fonts, images) can move triggers: refresh once everything has loaded.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    document.fonts && document.fonts.ready.then(refresh);
    return () => { window.removeEventListener('load', refresh); tweens.forEach(t => { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); }); };
  }, []);
  return null;
}
