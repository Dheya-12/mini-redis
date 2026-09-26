'use client';
import { useEffect, useState } from 'react';
import { SPRITES } from '@/components/pro-airbags-hero/generated/assets';
import { GreyButton, CHEVRON, Wordmark } from './Buttons';

const SERVICES = [
  { key: 'airbags', label: 'Airbag repair', sub: 'Replacement, SRS light, clock springs', href: '#airbags' },
  { key: 'module', label: 'Module reset', sub: 'Crash data and hard codes cleared', href: '#module' },
  { key: 'seatbelt', label: 'Seatbelt repair', sub: 'Pretensioners, buckles, retractors', href: '#seatbelt' },
  { key: 'programming', label: 'Programming', sub: 'Module coding and calibration', href: '#programming' },
];
const LINKS = [['Process', '#process'], ['Pricing', '#pricing'], ['Reviews', '#reviews'], ['FAQ', '#faq']];
const MOBILE_LINKS = [['Services', '#specialties'], ...LINKS];

/* huly.io site header. It is fixed and slides in once the hero, which carries its own dashboard navigation, has scrolled away.
   Desktop dropdowns are pure CSS (group-hover), the burger drawer is stateful. */
export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const onScroll = () => { const hero = document.getElementById('top'); setOn(window.scrollY > (hero ? hero.offsetHeight - 64 : 400)); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { const onKey = e => e.key === 'Escape' && setOpen(false); document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }, []);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  const arrow = <img alt="" className="ml-auto mr-1 -rotate-90 opacity-0 transition-opacity duration-200 group-hover/subitem:opacity-100" decoding="async" height="6" src={CHEVRON} style={{ color: 'transparent' }} width="10" />;
  return (
    <header className={'site-header left-0 right-0 top-0 z-40 h-16 transition-colors duration-200 px-safe pt-safe bg-grey-1/80 backdrop-blur' + (on || open ? ' on' : '')}>
      <div className="container relative z-10 flex h-full items-center" aria-label="Global">
        <a className="transition-colors duration-200 transition-all duration-200" href="#top"><span className="sr-only">Pro Airbags</span><Wordmark /></a>
        <nav className="ml-[77px] md:hidden">
          <ul className="flex">
            <li className="group/navitem relative">
              <button className="inline-flex items-center gap-x-1.5 whitespace-pre p-3 text-14 text-white" type="button">
                Services
                <img alt="" decoding="async" height="14" src={CHEVRON} style={{ color: 'transparent' }} width="8" />
              </button>
              <div className="group-hover/navitem:opacity-1 invisible absolute bottom-0 w-max translate-y-full opacity-0 transition-[opacity,visibility] duration-200 group-hover/navitem:visible group-hover/navitem:opacity-100">
                <ul className="flex min-w-[300px] flex-col gap-y-0.5 rounded-[14px] border border-grey-10 bg-grey-5 p-2.5 pb-3 shadow-[0px_14px_20px_rgba(0,0,0,0.5)]">
                  {SERVICES.map(s => (
                    <li key={s.key} className="group/subitem">
                      <a className="transition-colors duration-200 flex items-center whitespace-nowrap rounded-[14px] p-2 transition-colors duration-200 hover:bg-grey-10" href={s.href}>
                        <span className="flex shrink-0 items-center justify-center rounded-lg border border-grey-20 bg-grey-10 p-2.5">
                          <img alt="" decoding="async" height="18" loading="lazy" src={SPRITES['nav_' + s.key].uri} style={{ color: 'transparent', width: 18, height: 18, objectFit: 'contain' }} width="18" />
                        </span>
                        <span className="ml-2 flex flex-col">
                          <span className="text-14 leading-dense tracking-snugger text-white">{s.label}</span>
                          <span className="mt-0.5 block text-14 font-light leading-dense tracking-snugger text-grey-50">{s.sub}</span>
                        </span>
                        {arrow}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
            {LINKS.map(([l, h]) => (
              <li key={h}><a className="transition-colors duration-200 inline-flex whitespace-pre p-3 text-14 text-white transition-colors duration-200 hover:text-blue" href={h}>{l}</a></li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex gap-x-3.5 md:mr-[52px] sm:hidden">
          <a className="transition-colors duration-200 leading-none inline-flex items-center text-14 text-white px-1.5 hover:text-grey-80" href="tel:+13135550142">
            <svg className="mr-1.5 aspect-square h-4 fill-white sm:mr-0 sm:h-6" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6.6 2.5h3.2l1.7 4.2-2.1 1.5a12.6 12.6 0 0 0 6.4 6.4l1.5-2.1 4.2 1.7v3.2a2.1 2.1 0 0 1-2.3 2.1A17.3 17.3 0 0 1 4.5 4.8a2.1 2.1 0 0 1 2.1-2.3Z" fill="currentColor" /></svg>
            (313) 555-0142
          </a>
          <GreyButton href="#start" className="md:hidden">Get a quote</GreyButton>
          <GreyButton href="#start" className="md:hidden">Start a repair</GreyButton>
        </div>
        <button type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(v => !v)} className="absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col justify-center gap-[5px] p-2 md:flex">
          <span className={'block h-[2px] w-6 bg-white transition-transform duration-200 ' + (open ? 'translate-y-[7px] rotate-45' : '')} />
          <span className={'block h-[2px] w-6 bg-white transition-opacity duration-200 ' + (open ? 'opacity-0' : '')} />
          <span className={'block h-[2px] w-6 bg-white transition-transform duration-200 ' + (open ? '-translate-y-[7px] -rotate-45' : '')} />
        </button>
      </div>
      <div className={'fixed inset-0 top-16 z-30 hidden bg-grey-1 transition-opacity duration-200 md:block ' + (open ? 'visible opacity-100' : 'invisible opacity-0')}>
        <nav className="container flex flex-col gap-y-1 pt-6">
          {MOBILE_LINKS.map(([l, h]) => (
            <a key={h} href={h} onClick={() => setOpen(false)} className="rounded-[14px] p-3 text-16 text-white transition-colors duration-200 hover:bg-grey-10">{l}</a>
          ))}
          <div className="mt-6 flex gap-x-3">
            <a href="tel:+13135550142" onClick={() => setOpen(false)} className="uppercase font-bold flex h-10 flex-1 items-center justify-center px-4 text-11 border-button-grey relative text-white tracking-snug">Call the shop</a>
            <a href="#start" onClick={() => setOpen(false)} className="uppercase font-bold flex h-10 flex-1 items-center justify-center px-4 text-11 border-button-grey relative text-white tracking-snug">Start a repair</a>
          </div>
        </nav>
      </div>
    </header>
  );
}
