'use client';
import {useEffect, useRef} from 'react';
import {Arrow} from './Icons';

const LINKS = [['Airbags', '#airbags'], ['Module reset', '#module'], ['Seatbelt repair', '#seatbelt'], ['Programming', '#programming'], ['FAQ', '#faq']];

export default function Header() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const onScroll = () => {
      const hero = document.getElementById('top');
      const limit = hero ? hero.offsetHeight - 80 : 400;
      el.classList.toggle('on', window.scrollY > limit);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header ref={ref} className="hdr">
      <div className="wrap">
        <a className="wordmark" href="#top" aria-label="Pro Airbags home"><span className="pro">Pro</span><span className="air">Airbags</span></a>
        <nav aria-label="Site">{LINKS.map(([l, h]) => <a key={h} href={h}>{l}</a>)}</nav>
        <a className="cta cta-red" href="#start"><i className="shine" /><span>Start a repair</span><Arrow w={16} /></a>
      </div>
    </header>
  );
}
