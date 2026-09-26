'use client';
import React, {useEffect, useLayoutEffect, useRef, useState, useMemo, createContext, useContext} from 'react';
import gsap from 'gsap';
import {SplitText} from 'gsap/SplitText';
import {CustomEase} from 'gsap/CustomEase';
import {ScrambleTextPlugin} from 'gsap/ScrambleTextPlugin';
import {createGL, W, H, LOGO, CTA_NEON} from './gl';
import {LAYOUT} from './generated/layout';
import {ASSETS, SPRITES} from './generated/assets';

gsap.registerPlugin(SplitText, CustomEase, ScrambleTextPlugin);
CustomEase.create('snap', 'M0,0 C0.7,0 0.2,1 1,1');
const L = LAYOUT.t, M = LAYOUT.meas;
const FX = createContext(null);
const REDUCED = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const DUMMY = new Proxy({}, {get: () => ({value: 0})});
function useFx() {
  const r = useContext(FX);
  return useMemo(() => new Proxy({}, {get(_, k) { const f = r.current; if (f) return f[k]; return k === 'U' || k === 'ctaU' ? DUMMY : k === 'light' ? {} : () => {}; }}), [r]);
}

/* ---------------- content ---------------- */
const NAV = [
  {key: 'airbags', label: 'Airbags', rect: [88, 212, 318, 280], row: 0, menu: ['Airbag replacement', 'SRS light diagnosis', 'Clock spring repair', 'Seat and curtain airbags']},
  {key: 'module', label: 'Module reset', rect: [345, 212, 606, 280], row: 3, menu: ['Crash data clearing', 'SRS module reset', 'Hard code removal', 'Module bench test']},
  {key: 'seatbelt', label: 'Seatbelt repair', rect: [897, 212, 1102, 280], row: 1, menu: ['Pretensioner rebuild', 'Webbing replacement', 'Buckle and sensor repair', 'Retractor repair']},
  {key: 'programming', label: 'Programming', rect: [1112, 212, 1312, 280], row: 4, menu: ['Module coding', 'VIN programming', 'Occupant sensor calibration', 'System setup']},
];
const ROWS = [['Airbags', 'OK'], ['Seatbelts', 'OK'], ['Crash Data', 'OK'], ['Module', 'Reset'], ['Sensors', 'OK']];
const CARDS = [['Airbags', 'Repair & Replacement', 'airbags'], ['Module Reset', 'Clear Crash Data', 'module'], ['Seatbelt Repair', 'Pretensioner & Belt Repair', 'seatbelt'], ['Programming', 'Coding & System Setup', 'programming']];
const TRUST = [['OEM Level Service', 'Professional Equipment'], ['Fast Turnaround', 'Get Back on the Road'], ['Trusted in Detroit', 'Hundreds of Vehicles Repaired']];

/* ---------------- text placement (cap-height accurate, from the design measurements) ---------------- */
const mctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
const FAMS = {mont: '"Montserrat", system-ui, sans-serif', saira: '"Saira", "Montserrat", sans-serif'};
function capTop(d) {
  mctx.font = `${d.stretch ? 'normal normal ' + d.weight + ' ' : d.weight + ' '}${d.px}px ${FAMS[d.fam]}`;
  const m = mctx.measureText('H'), asc = m.fontBoundingBoxAscent ?? d.px * 0.95, desc = m.fontBoundingBoxDescent ?? d.px * 0.25;
  return (d.px - (asc + desc)) / 2 + asc - m.actualBoundingBoxAscent;
}
function bearing(d, ch) { mctx.font = `${d.weight} ${d.px}px ${FAMS[d.fam]}`; return -mctx.measureText(ch).actualBoundingBoxLeft; }
function placeAll(root) {
  root.querySelectorAll('[data-t]').forEach(el => {
    const d = L[el.dataset.t]; if (!d) return;
    const ox = +(el.dataset.ox || 0), oy = +(el.dataset.oy || 0);
    Object.assign(el.style, {fontFamily: FAMS[d.fam], fontWeight: d.weight, fontSize: d.px + 'px', lineHeight: d.px + 'px', letterSpacing: d.track + 'px', fontStretch: d.stretch ? d.stretch + '%' : 'normal'});
    el.style.top = (d.top - oy - capTop(d)) + 'px';
    const w = el.offsetWidth - d.track;
    if (d.align === 'center') el.style.left = ((d.x0 + d.x1) / 2 - ox - w / 2) + 'px';
    else if (d.align === 'right') el.style.left = (d.x1 - ox - w) + 'px';
    else el.style.left = (d.x0 - ox - bearing(d, (el.textContent.trim()[0] || 'H'))) + 'px';
  });
}
function T({id, ox = 0, oy = 0, className = '', children, ...rest}) {
  return <span data-t={id} data-ox={ox} data-oy={oy} className={'t ' + className} {...rest}>{children}</span>;
}
const box = (x0, y0, x1, y1) => ({left: x0, top: y0, width: x1 - x0, height: y1 - y0});
function Sprite({s, ox = 0, oy = 0, className = '', style}) {
  const b = s.box; return <img alt="" aria-hidden="true" src={s.uri} className={'sprite ' + className} style={{left: b[0] - ox, top: b[1] - oy, width: b[2], height: b[3], ...style}} />;
}
const Chevron = () => <svg className="chev" viewBox="0 0 12 7" width="12" height="7" aria-hidden="true"><path d="M1 1l5 4.6L11 1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const slug = s => s.toLowerCase().replace(/[^a-z]+/g, '-');
/* Fit: renders children at their fixed design size (w x h px) and scales the block to the container width (mobile layout) */
function Fit({w, h, max = 1, className = '', children}) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current, inner = el.firstChild;
    const fit = () => { const k = Math.min(max, el.clientWidth / w); inner.style.transform = `scale(${k})`; el.style.height = h * k + 'px'; };
    fit(); const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect();
  }, [w, h, max]);
  return <div ref={ref} className={'fit ' + className}><div className="fit-in" style={{width: w, height: h}}>{children}</div></div>;
}
const Arrow = ({w = 18}) => <svg className="arrow" viewBox="0 0 18 10" width={w} height={w * 10 / 18} aria-hidden="true"><path d="M1 5h15.5M12.5 1 16.5 5l-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;

/* ---------------- shared interaction helpers ---------------- */
function ripple(el, e, color = 'rgba(255,255,255,.45)') {
  if (REDUCED) return;
  const r = el.getBoundingClientRect(), s = r.width / el.offsetWidth || 1, x = (e.clientX - r.left) / s, y = (e.clientY - r.top) / s;
  const dot = document.createElement('i'); dot.className = 'ripple'; Object.assign(dot.style, {left: x + 'px', top: y + 'px', background: color}); el.appendChild(dot);
  gsap.fromTo(dot, {scale: 0, opacity: 0.9}, {scale: Math.max(el.offsetWidth, el.offsetHeight) / 8, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => dot.remove()});
}
function magnetic(el, strength = 0.25) {
  const qx = gsap.quickTo(el, 'x', {duration: 0.5, ease: 'power3'}), qy = gsap.quickTo(el, 'y', {duration: 0.5, ease: 'power3'});
  const move = e => { const r = el.getBoundingClientRect(); qx((e.clientX - (r.left + r.width / 2)) * strength); qy((e.clientY - (r.top + r.height / 2)) * strength); };
  const leave = () => { qx(0); qy(0); };
  el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
  return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
}

/* ---------------- navbar ---------------- */
function NavItem({item, bus, flow}) {
  const fx = useFx(), ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current, label = el.querySelector('.nav-label'), icon = el.querySelector('.sprite'), chev = el.querySelector('.chev');
    const menu = el.querySelector('.menu'), links = [...menu.querySelectorAll('a')], hl = menu.querySelector('.menu-hl'), btn = el.querySelector('.chev-btn');
    const split = SplitText.create(label, {type: flow ? 'words,chars' : 'chars'}); item.chars = split.chars; /* pill mode wraps words, never letters */
    const [x0, , x1] = item.rect, cx = (x0 + x1) / 2;
    let openT, closeT, open = false;
    const menuTl = gsap.timeline({paused: true, onReverseComplete: () => gsap.set(menu, {visibility: 'hidden'})})
      .set(menu, {visibility: 'visible'})
      .fromTo(menu, {clipPath: 'polygon(0 0,100% 0,100% 0,0 0)', y: -8}, {clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)', y: 0, duration: 0.5, ease: 'expo.out'})
      .fromTo(menu.querySelector('.menu-line'), {scaleX: 0}, {scaleX: 1, duration: 0.6, ease: 'expo.out'}, 0.05)
      .fromTo(links, {x: -14, opacity: 0}, {x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power3.out'}, 0.1)
      .to(chev, {rotation: 180, duration: 0.45, ease: 'back.out(2.2)'}, 0);
    const setOpen = v => { if (v === open) return; open = v; btn.setAttribute('aria-expanded', String(v)); el.classList.toggle('open', v); v ? menuTl.timeScale(1).play() : menuTl.timeScale(1.8).reverse(); if (v) bus.closeOthers(item.key); };
    item.close = () => setOpen(false);
    const iconFx = {
      airbags: () => { gsap.fromTo(icon, {scale: 1}, {keyframes: [{scale: 1.35, duration: 0.14, ease: 'power2.out'}, {scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.3)'}], overwrite: 'auto'}); fx && fx.breathe('dash', true); fx && fx.breathe('car', true); },
      module: () => { gsap.fromTo(icon, {opacity: 1}, {keyframes: [{opacity: 0.25, duration: 0.06}, {opacity: 1, duration: 0.06}, {opacity: 0.4, duration: 0.05}, {opacity: 1, duration: 0.3}], overwrite: 'auto'}); fx && fx.scan(); },
      seatbelt: () => { gsap.fromTo(icon, {x: 0, rotation: 0}, {keyframes: [{x: -4, rotation: -10, duration: 0.16, ease: 'power2.out'}, {x: 0, rotation: 0, duration: 0.7, ease: 'elastic.out(1, 0.35)'}], overwrite: 'auto'}); fx && fx.hold(10, 1030, 72, 1.0, 120); fx && fx.hold(11, 1180, 610, 0.7, 150); },
      programming: () => { gsap.fromTo(icon, {y: 0, scaleY: 1}, {keyframes: [{y: -3, scaleY: 1.08, duration: 0.16}, {y: 0, scaleY: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)'}], overwrite: 'auto'}); fx && fx.screenFlicker(); },
    };
    const enter = e => {
      if (e.pointerType === 'touch' || (flow && e.type === 'focusin')) return;
      gsap.to(split.chars, {y: -2.5, textShadow: '0 0 12px rgba(255,70,50,.95)', duration: 0.3, stagger: 0.02, ease: 'power3.out', overwrite: 'auto'});
      gsap.fromTo(chev, {y: 0}, {y: 2.5, duration: 0.16, yoyo: true, repeat: 1});
      iconFx[item.key]();
      if (fx) { fx.hold(0, cx, 281, 1.0, 95); fx.hold(1, cx, 211, 0.8, 95); fx.screenRow(item.row, true); }
      clearTimeout(closeT); openT = setTimeout(() => setOpen(true), 130);
    };
    const leave = e => {
      if (e && e.pointerType === 'touch') return; /* a tap ends with a synthetic pointerleave; it must not close the menu the tap just opened */
      gsap.to(split.chars, {y: 0, textShadow: '0 0 0 rgba(0,0,0,0)', duration: 0.5, stagger: {each: 0.015, from: 'end'}, ease: 'power3.out', overwrite: 'auto'});
      if (fx) { fx.release(0); fx.release(1); fx.release(10); fx.release(11); fx.screenRow(item.row, false); if (item.key === 'airbags') { fx.breathe('dash', false); fx.breathe('car', false); } }
      clearTimeout(openT); closeT = setTimeout(() => setOpen(false), 220);
    };
    const click = e => { e.preventDefault(); ripple(el.querySelector('.nav-hit'), e, 'rgba(255,60,40,.35)'); bus.navigate(item); if (!flow) setOpen(true); };
    el.addEventListener('pointerenter', enter); el.addEventListener('pointerleave', leave);
    el.querySelector('.nav-link').addEventListener('click', click);
    btn.addEventListener('click', e => { e.preventDefault(); setOpen(!open); if (e.detail === 0 && !open) links[0].focus(); });
    el.addEventListener('focusin', enter); el.addEventListener('focusout', e => { if (!el.contains(e.relatedTarget)) { leave(); setOpen(false); } });
    el.addEventListener('keydown', e => {
      if (e.key === 'Escape') { setOpen(false); btn.focus(); }
      if (open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); const i = links.indexOf(document.activeElement); links[e.key === 'ArrowDown' ? (i + 1) % links.length : (i - 1 + links.length) % links.length].focus(); }
    });
    links.forEach(a => {
      a.addEventListener('pointerenter', () => { gsap.to(hl, {y: a.offsetTop - 10, opacity: 1, duration: 0.3, ease: 'power3.out', overwrite: 'auto'}); gsap.to(a, {x: 6, color: '#fff', duration: 0.25, overwrite: 'auto'}); });
      a.addEventListener('pointerleave', () => gsap.to(a, {x: 0, color: '#d9d4d4', duration: 0.3, overwrite: 'auto'}));
      a.addEventListener('focus', () => gsap.to(hl, {y: a.offsetTop - 10, opacity: 1, duration: 0.3, overwrite: 'auto'}));
      a.addEventListener('click', e => { e.preventDefault(); setOpen(false); bus.navigate(item); });
    });
    menu.addEventListener('pointerleave', () => gsap.to(hl, {opacity: 0, duration: 0.3}));
    return () => { split.revert(); menuTl.kill(); };
  }, []);
  const [x0, y0, x1, y1] = item.rect, s = SPRITES['nav_' + item.key], ch = M['nav_' + item.key].white.slice(-1)[0];
  if (flow) return (
    <div ref={ref} className="nav-item nav-pill" data-key={item.key}>
      <a className="nav-link nav-hit" href={'#' + item.key} aria-label={item.label}>
        <img alt="" aria-hidden="true" src={s.uri} className="sprite" />
        <span className="nav-label mt">{item.label}</span>
      </a>
      <button className="chev-btn" type="button" aria-label={item.label + ' menu'} aria-expanded="false"><Chevron /></button>
      <div className="menu" role="menu">
        <i className="menu-line" /><i className="menu-hl" />
        {item.menu.map(m => <a key={m} href={'#' + m.toLowerCase().replace(/[^a-z]+/g, '-')} role="menuitem">{m}</a>)}
      </div>
    </div>
  );
  return (
    <div ref={ref} className="nav-item" style={box(x0, y0, x1, y1 + 8)} data-key={item.key}>
      <a className="nav-link nav-hit" href={'#' + item.key} aria-label={item.label}>
        <Sprite s={s} ox={x0} oy={y0} />
        <T id={'nav_' + item.key} ox={x0} oy={y0} className="nav-label">{item.label}</T>
      </a>
      <button className="chev-btn" type="button" aria-label={item.label + ' menu'} aria-expanded="false" style={{left: ch[0] - 7 - x0, top: ch[2] - 8 - y0}}><Chevron /></button>
      <div className="menu" style={{left: (x1 - x0) / 2 - 130, top: y1 - y0 + 18}} role="menu">
        <i className="menu-line" /><i className="menu-hl" />
        {item.menu.map(m => <a key={m} href={'#' + m.toLowerCase().replace(/[^a-z]+/g, '-')} role="menuitem">{m}</a>)}
      </div>
    </div>
  );
}

function bindCta(cta, fx, bus) {
    const inner = cta.querySelector('.cta-in'), arrow = cta.querySelector('.arrow');
    let loop;
    const enter = e => {
      if (e.pointerType === 'touch' || !fx) return;
      gsap.to(fx.ctaU.uHover, {value: 1, duration: 0.5, overwrite: 'auto'}); fx.hold(12, CTA_NEON.x, CTA_NEON.y, 0.75, 120);
      loop && loop.kill(); loop = gsap.timeline({repeat: -1, repeatDelay: 0.3}).to(arrow, {x: 16, opacity: 0, duration: 0.3, ease: 'power2.in'}).set(arrow, {x: -16}).to(arrow, {x: 0, opacity: 1, duration: 0.45, ease: 'power3.out'});
    };
    const move = e => { const r = cta.getBoundingClientRect(), s = r.width / cta.offsetWidth; gsap.to(inner, {x: (e.clientX - r.left - r.width / 2) / s * 0.16, y: (e.clientY - r.top - r.height / 2) / s * 0.22, duration: 0.5, ease: 'power3.out', overwrite: 'auto'}); };
    const leave = () => { if (!fx) return; gsap.to(fx.ctaU.uHover, {value: 0, duration: 0.7, overwrite: 'auto'}); fx.release(12); gsap.to(inner, {x: 0, y: 0, scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.4)', overwrite: 'auto'}); loop && loop.kill(); gsap.to(arrow, {x: 0, opacity: 1, duration: 0.3}); };
    const down = () => { if (fx) gsap.to(fx.ctaU.uPress, {value: 1, duration: 0.1}); gsap.to(inner, {scale: 0.95, duration: 0.1}); };
    const up = () => { if (fx) gsap.to(fx.ctaU.uPress, {value: 0, duration: 0.5}); gsap.to(inner, {scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.45)'}); };
    const click = e => { e.preventDefault(); bus.startRepair('nav'); };
    cta.addEventListener('pointerenter', enter); cta.addEventListener('pointermove', move); cta.addEventListener('pointerleave', leave);
    cta.addEventListener('pointerdown', down); cta.addEventListener('pointerup', up); cta.addEventListener('click', click);
    return () => { loop && loop.kill(); };
}
function Nav({bus}) {
  const fx = useFx(), ctaRef = useRef(null), logoRef = useRef(null);
  useLayoutEffect(() => {
    const off = bindCta(ctaRef.current, fx, bus);
    const logo = logoRef.current;
    const lEnter = () => { if (fx) { fx.ring(1, 1.5, 0.9); fx.flash(8, LOGO.x, LOGO.y, 0.5, 150, 1.4); } };
    const lClick = e => { e.preventDefault(); bus.home(); };
    logo.addEventListener('pointerenter', lEnter); logo.addEventListener('click', lClick);
    return off;
  }, []);
  const cx = CTA_NEON.x - CTA_NEON.hx - 6, cy = CTA_NEON.y - CTA_NEON.hy - 6, ar = M.cta_arrow;
  return (
    <nav className="nav" aria-label="Main">
      <a ref={logoRef} className="logo-link" href="#top" aria-label="Pro Airbags home" style={{left: LOGO.x - 112, top: LOGO.y - 112, width: 224, height: 224}} />
      {NAV.map(item => <NavItem key={item.key} item={item} bus={bus} />)}
      <a ref={ctaRef} className="nav-cta" href="#start" style={{left: cx, top: cy, width: CTA_NEON.hx * 2 + 12, height: CTA_NEON.hy * 2 + 12}}>
        <span className="cta-in">
          <T id="cta_nav" ox={cx} oy={cy}>Start a repair</T>
          <span className="nav-cta-arrow" style={{left: ar[0] - cx - 1, top: (ar[2] + ar[3]) / 2 - cy - 5}}><Arrow w={17} /></span>
        </span>
      </a>
    </nav>
  );
}

/* ---------------- hero copy ---------------- */
function bindCopy(el, fx, bus) {
    const start = el.querySelector('.btn-start'), svc = el.querySelector('.btn-services');
    const offs = [magnetic(start, 0.22), magnetic(svc, 0.18)];
    const sArrow = start.querySelector('.arrow'), sShine = start.querySelector('.shine'), vFill = svc.querySelector('.fill');
    let loop;
    start.addEventListener('pointerenter', () => {
      gsap.fromTo(sShine, {xPercent: -130}, {xPercent: 230, duration: 0.8, ease: 'power2.inOut'});
      gsap.to(start, {boxShadow: '0 0 0 1px rgba(255,120,100,.9), 0 12px 50px rgba(255,20,10,.65), inset 0 1px 0 rgba(255,255,255,.35)', duration: 0.35});
      loop && loop.kill(); loop = gsap.timeline({repeat: -1, repeatDelay: 0.25}).to(sArrow, {x: 14, opacity: 0, duration: 0.28, ease: 'power2.in'}).set(sArrow, {x: -14}).to(sArrow, {x: 0, opacity: 1, duration: 0.4, ease: 'power3.out'});
      fx && fx.hold(12, CTA_NEON.x, CTA_NEON.y, 0.5, 110);
    });
    start.addEventListener('pointerleave', () => { gsap.to(start, {boxShadow: '0 0 0 1px rgba(255,90,70,.55), 0 8px 34px rgba(255,20,10,.45), inset 0 1px 0 rgba(255,255,255,.25)', duration: 0.5}); loop && loop.kill(); gsap.to(sArrow, {x: 0, opacity: 1, duration: 0.3}); fx && fx.release(12); });
    start.addEventListener('pointerdown', () => gsap.to(start, {scale: 0.96, duration: 0.1}));
    start.addEventListener('pointerup', () => gsap.to(start, {scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.45)'}));
    start.addEventListener('click', e => { e.preventDefault(); ripple(start, e); bus.startRepair('hero'); });
    svc.addEventListener('pointerenter', () => { gsap.fromTo(vFill, {xPercent: -101}, {xPercent: 0, duration: 0.45, ease: 'power3.out', overwrite: 'auto'}); gsap.to(svc, {borderColor: 'rgba(255,70,50,.9)', duration: 0.3}); });
    svc.addEventListener('pointerleave', () => { gsap.to(vFill, {xPercent: 101, duration: 0.45, ease: 'power3.in', overwrite: 'auto'}); gsap.to(svc, {borderColor: 'rgba(255,255,255,.28)', duration: 0.4}); });
    svc.addEventListener('pointerdown', () => gsap.to(svc, {scale: 0.96, duration: 0.1}));
    svc.addEventListener('pointerup', () => gsap.to(svc, {scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.45)'}));
    svc.addEventListener('click', e => { e.preventDefault(); ripple(svc, e, 'rgba(255,60,40,.4)'); bus.cardsWave(); });
    const head = el.querySelector('.headline'), shine = el.querySelectorAll('.h-shine');
    head.addEventListener('pointerenter', () => { gsap.fromTo(shine, {backgroundPosition: '-60% 0'}, {backgroundPosition: '160% 0', duration: 1.1, stagger: 0.12, ease: 'power2.inOut'}); gsap.fromTo(el.querySelectorAll('.h-red'), {filter: 'drop-shadow(0 0 0 rgba(255,30,20,0))'}, {filter: 'drop-shadow(0 0 16px rgba(255,30,20,.75))', duration: 0.3, yoyo: true, repeat: 1}); });
    return () => offs.forEach(f => f());
}
const HEAD_BOX = {x: 76, y: 400, w: 516, h: 262}; /* design-space box around the four headline lines (mobile layout) */
function Copy({bus, flow}) {
  const fx = useFx(), ref = useRef(null);
  useLayoutEffect(() => bindCopy(ref.current, fx, bus), []);
  const b = LAYOUT.buttons;
  if (flow) return (
    <div ref={ref} className="copy copy-m">
      <div className="m-eyebrow"><i className="eyebrow-line" /><span className="eyebrow mt">Airbag &amp; Safety System Specialists</span></div>
      <Fit w={HEAD_BOX.w} h={HEAD_BOX.h} max={1.3} className="m-head">
        <h1 className="headline" aria-label="Safety restored. Drive with confidence.">
          {['Safety', 'Restored.', 'Drive with', 'Confidence.'].map((t, i) => (
            <T key={i} id={'h' + i} ox={HEAD_BOX.x} oy={HEAD_BOX.y} className={'h-line ' + (i < 2 ? 'h-silver' : 'h-red')} aria-hidden="true">{t}</T>
          ))}
          {['Safety', 'Restored.'].map((t, i) => <T key={'s' + i} id={'h' + i} ox={HEAD_BOX.x} oy={HEAD_BOX.y} className="h-line h-shine" aria-hidden="true">{t}</T>)}
        </h1>
      </Fit>
      <p className="para"><span className="t mt">Airbag repair, module resetting, seatbelt repair, and programming — professional solutions to get you back on the road safely.</span></p>
      <div className="m-btns">
        <a className="btn btn-start" href="#start"><i className="shine" /><span className="t mt">Start a repair</span><span className="btn-arrow mt"><Arrow w={17} /></span></a>
        <a className="btn btn-services" href="#services"><i className="fill" /><span className="t mt">Our services</span></a>
      </div>
    </div>
  );
  return (
    <div ref={ref} className="copy">
      <i className="eyebrow-line" style={box(M.eyebrow_line[0], M.eyebrow_line[2], M.eyebrow_line[1] + 1, M.eyebrow_line[3] + 1)} />
      <T id="eyebrow" className="eyebrow">Airbag &amp; Safety System Specialists</T>
      <h1 className="headline" aria-label="Safety restored. Drive with confidence.">
        {['Safety', 'Restored.', 'Drive with', 'Confidence.'].map((t, i) => (
          <T key={i} id={'h' + i} className={'h-line ' + (i < 2 ? 'h-silver' : 'h-red')} aria-hidden="true">{t}</T>
        ))}
        {['Safety', 'Restored.'].map((t, i) => <T key={'s' + i} id={'h' + i} className="h-line h-shine" aria-hidden="true">{t}</T>)}
      </h1>
      <p className="para" aria-label="Airbag repair, module resetting, seatbelt repair, and programming, professional solutions to get you back on the road safely.">
        <T id="p0" aria-hidden="true">Airbag repair, module resetting, seatbelt repair, and</T>
        <T id="p1" aria-hidden="true">programming — professional solutions to get you</T>
        <T id="p2" aria-hidden="true">back on the road safely.</T>
      </p>
      <a className="btn btn-start" href="#start" style={box(...b.start)}>
        <i className="shine" /><T id="btn_start" ox={b.start[0]} oy={b.start[1]}>Start a repair</T>
        <span className="btn-arrow" style={{left: b.startArrow[0] - b.start[0], top: b.startArrow[1] - b.start[1] - 5}}><Arrow w={17} /></span>
      </a>
      <a className="btn btn-services" href="#services" style={box(...b.services)}>
        <i className="fill" /><T id="btn_services" ox={b.services[0]} oy={b.services[1]}>Our services</T>
      </a>
    </div>
  );
}

/* ---------------- SRS status panel ---------------- */
function Srs({bus, flow}) {
  const fx = useFx(), ref = useRef(null);
  const P = [658, 380, 827, 546];
  useLayoutEffect(() => {
    const el = ref.current, rows = [...el.querySelectorAll('.srs-row')];
    const tie = [() => fx && fx.breathe('car', true), () => fx && fx.hold(11, 1180, 620, 0.9, 150), () => fx && fx.scan(0.9), () => fx && fx.scan(0.9), () => fx && fx.hold(11, 660, 640, 0.9, 120)];
    rows.forEach((r, i) => {
      r.addEventListener('pointerenter', () => { gsap.to(r, {backgroundColor: 'rgba(255,40,30,.12)', duration: 0.25}); gsap.to(r.querySelector('.srs-ico'), {scale: 1.25, duration: 0.3, ease: 'back.out(3)'}); tie[i](); });
      r.addEventListener('pointerleave', () => { gsap.to(r, {backgroundColor: 'rgba(255,40,30,0)', duration: 0.4}); gsap.to(r.querySelector('.srs-ico'), {scale: 1, duration: 0.4}); if (fx) { fx.breathe('car', false); fx.release(11); } });
    });
    const head = el.querySelector('.srs-head');
    head.addEventListener('click', () => bus.startRepair('panel'));
  }, []);
  const rb = (r, ox, oy) => ({left: r[0] - ox, top: r[1] - oy});
  return (
    <div ref={ref} className="srs" style={flow ? {left: 0, top: 0, width: P[2] - P[0], height: P[3] - P[1]} : box(...P)} aria-label="SRS system status" role="group">
      <svg className="srs-conn" width="340" height="220" viewBox="0 0 340 220" style={{left: 826 - P[0] - 170, top: 380 - P[1]}} aria-hidden="true">
        <g transform="translate(170, 0)" fill="none" stroke="#ff2a1f" strokeWidth="1.1">
          <path className="conn" d="M0 29 L97 73" /><path className="conn" d="M0 88 L54 83 L80 125" /><path className="conn" d="M0 160 L29 144" />
          <circle className="conn-dot" cx="97" cy="73" r="2.6" fill="#ff5a4a" stroke="none" /><circle className="conn-dot" cx="80" cy="125" r="2.6" fill="#ff5a4a" stroke="none" /><circle className="conn-dot" cx="29" cy="144" r="2.4" fill="#ff5a4a" stroke="none" />
        </g>
      </svg>
      <div className="srs-frame" />
      <button className="srs-head" type="button" aria-label="Run SRS system check">
        <T id="hud_h1" ox={P[0]} oy={P[1]} className="srs-title">SRS System</T>
        <T id="hud_h2" ox={P[0]} oy={P[1]} className="srs-title srs-state">Online</T>
        <span className="srs-go" style={{left: 794 - P[0], top: 399 - P[1]}}><Arrow w={13} /></span>
      </button>
      {ROWS.map(([label, status], i) => {
        const m = M.hud_rows[i], yc = (m.label[2] + m.label[3]) / 2;
        return (
          <div key={label} className="srs-row" style={{left: 666 - P[0], top: yc - 10.5 - P[1], width: 150, height: 21}}>
            <Sprite s={SPRITES['hud_' + i]} ox={666} oy={yc - 10.5} className="srs-ico" />
            <T id={'hud_l' + i} ox={666} oy={yc - 10.5}>{label}</T>
            <span className="srs-cell" style={{left: 774 - 666, top: 1, width: 40, height: 19}} />
            <T id={'hud_s' + i} ox={666} oy={yc - 10.5} className="srs-status">{status}</T>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- service cards ---------------- */
function Cards({bus, flow}) {
  const fx = useFx(), ref = useRef(null);
  useLayoutEffect(() => {
    const cards = [...ref.current.querySelectorAll('.card')];
    const offs = cards.map((c, i) => {
      const inner = c.querySelector('.card-in'), img = c.querySelector('.card-zoom'), arrow = c.querySelector('.card-arrow'), glow = c.querySelector('.card-glow');
      const rx = gsap.quickTo(inner, 'rotationX', {duration: 0.5, ease: 'power3'}), ry = gsap.quickTo(inner, 'rotationY', {duration: 0.5, ease: 'power3'});
      const move = e => { const r = c.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 10); rx(-((e.clientY - r.top) / r.height - 0.5) * 12); gsap.set(glow, {'--gx': ((e.clientX - r.left) / r.width * 100) + '%'}); };
      const enter = () => {
        gsap.to(inner, {y: -7, z: 30, duration: 0.45, ease: 'power3.out', overwrite: 'auto'}); gsap.to(img, {scale: 1.1, duration: 0.6, ease: 'power3.out'});
        gsap.to(glow, {opacity: 1, duration: 0.35}); gsap.to(arrow, {x: 5, color: '#ff4a3a', duration: 0.3});
        const key = CARDS[i][2]; if (fx) { if (key === 'airbags') fx.breathe('car', true); if (key === 'module') fx.scan(0.9); if (key === 'seatbelt') fx.hold(11, 1180, 620, 0.9, 150); if (key === 'programming') { fx.screenFlicker(); fx.screenRow(4, true); } }
      };
      const leave = () => {
        gsap.to(inner, {y: 0, z: 0, rotationX: 0, rotationY: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)', overwrite: 'auto'}); gsap.to(img, {scale: 1, duration: 0.6}); gsap.to(glow, {opacity: 0, duration: 0.5}); gsap.to(arrow, {x: 0, color: '#e8e4e4', duration: 0.3});
        if (fx) { fx.breathe('car', false); fx.release(11); fx.screenRow(4, false); }
      };
      const click = e => { e.preventDefault(); ripple(inner, e, 'rgba(255,50,40,.35)'); gsap.fromTo(inner, {scale: 0.97}, {scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)'}); bus.navigate(NAV[i]); };
      c.addEventListener('pointermove', move); c.addEventListener('pointerenter', enter); c.addEventListener('pointerleave', leave); c.addEventListener('click', click);
      c.addEventListener('focus', enter); c.addEventListener('blur', leave);
      return () => {};
    });
    return () => offs.forEach(f => f());
  }, []);
  return (
    <div ref={ref} className="cards" id="services">
      {CARDS.map(([title, sub, key], i) => {
        const s = SPRITES.cards[i], [bx, by, bw, bh] = s.box, m = M.cards[i];
        const card = (
          <a key={key} className="card" href={'#' + key} style={{left: flow ? 0 : bx, top: flow ? 0 : by, width: bw, height: bh}} aria-label={title + ', ' + sub}>
            <span className="card-in">
              <img alt="" src={s.uri} className="card-img" />
              <span className="card-zoomwrap" style={{width: 176, height: bh}}><img alt="" src={s.uri} className="card-zoom" style={{width: bw, height: bh}} /></span>
              <span className="card-glow" />
              <T id={'card_t' + i} ox={bx} oy={by} className="card-title">{title}</T>
              <T id={'card_s' + i} ox={bx} oy={by} className="card-sub">{sub}</T>
              <span className="card-arrow" style={{left: m.arrow[0] - bx - 1, top: (m.arrow[2] + m.arrow[3]) / 2 - by - 5}}><Arrow w={13} /></span>
            </span>
          </a>
        );
        return flow ? <Fit key={key} w={bw} h={bh} max={1.15}>{card}</Fit> : card;
      })}
    </div>
  );
}

/* ---------------- trust bar ---------------- */
function Trust({flow}) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    ref.current.querySelectorAll('.trust-item').forEach(it => {
      const ico = it.querySelector('.sprite');
      it.addEventListener('pointerenter', () => { gsap.to(ico, {rotation: 12, scale: 1.18, filter: 'drop-shadow(0 0 8px rgba(255,60,40,.9))', duration: 0.35, ease: 'back.out(3)'}); gsap.to(it.querySelectorAll('.t'), {color: '#fff', duration: 0.3}); });
      it.addEventListener('pointerleave', () => { gsap.to(ico, {rotation: 0, scale: 1, filter: 'drop-shadow(0 0 0 rgba(255,60,40,0))', duration: 0.5}); gsap.to(it.querySelectorAll('.trust-sub'), {color: '#a7a2a2', duration: 0.4}); gsap.to(it.querySelectorAll('.trust-title'), {color: '#e9e5e5', duration: 0.4}); });
    });
  }, []);
  return (
    <div ref={ref} className="trust">
      {TRUST.map(([t, s], i) => {
        const x0 = M.trust[i].icon[0] - 8, x1 = M.trust[i].sub[1] + 24;
        const item = (
          <div key={t} className="trust-item" style={flow ? {left: 0, top: 0, width: x1 - x0, height: 56} : box(x0, 928, x1, 984)}>
            <Sprite s={SPRITES['trust_' + i]} ox={x0} oy={928} />
            <T id={'trust_t' + i} ox={x0} oy={928} className="trust-title">{t}</T>
            <T id={'trust_s' + i} ox={x0} oy={928} className="trust-sub">{s}</T>
          </div>
        );
        return flow ? <Fit key={t} w={x1 - x0} h={56} max={1.1}>{item}</Fit> : item;
      })}
      <i className="trust-div" style={box(572, 938, 573, 977)} /><i className="trust-div" style={box(920, 938, 921, 977)} />
    </div>
  );
}

/* ---------------- phone nav: the same nav items re-laid as two rows of pills over the dash, plus the CTA ---------------- */
function MobileNav({bus, offset}) {
  const fx = useFx(), ctaRef = useRef(null);
  useLayoutEffect(() => bindCta(ctaRef.current, fx, bus), []);
  return (
    <nav className="m-nav" aria-label="Main" style={{marginTop: -offset}}>
      {NAV.map(item => <NavItem key={item.key} item={item} bus={bus} flow />)}
      <a ref={ctaRef} className="nav-cta m-cta" href="#start">
        <span className="cta-in"><span className="t mt">Start a repair</span><span className="nav-cta-arrow mt"><Arrow w={17} /></span></span>
      </a>
    </nav>
  );
}

/* ---------------- mobile nav (top bar + drawer) ---------------- */
function MobileBar({bus}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
    const key = e => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', key);
    return () => { document.documentElement.style.overflow = ''; window.removeEventListener('keydown', key); };
  }, [open]);
  return (
    <>
      <div className="m-bar">
        <button className="m-burger" type="button" aria-label="Menu" aria-expanded={open} aria-controls="m-drawer" onClick={() => setOpen(!open)}><i /><i /><i /></button>
      </div>
      <div id="m-drawer" className={'m-drawer' + (open ? ' open' : '')} role="dialog" aria-modal="true" aria-label="Menu">
        <div className="m-drawer-in">
          <a className="m-brand" href="#top" aria-label="Pro Airbags home" onClick={e => { e.preventDefault(); setOpen(false); bus.home(); window.scrollTo({top: 0, behavior: 'smooth'}); }}>Pro <b>Airbags</b><small>Airbag &amp; Safety System Specialists</small></a>
          {NAV.map(item => (
            <div key={item.key} className="m-group">
              <a className="m-link" href={'#' + item.key} onClick={e => { e.preventDefault(); setOpen(false); bus.navigate(item); }}>
                <img alt="" aria-hidden="true" src={SPRITES['nav_' + item.key].uri} /><span>{item.label}</span><Chevron />
              </a>
              <div className="m-sub">{item.menu.map(m => <a key={m} href={'#' + slug(m)} onClick={() => setOpen(false)}>{m}</a>)}</div>
            </div>
          ))}
          <a className="btn btn-start m-drawer-cta" href="#start" onClick={() => { setOpen(false); bus.startRepair('nav'); }}><i className="shine" /><span className="t mt">Start a repair</span><span className="btn-arrow mt"><Arrow w={17} /></span></a>
        </div>
      </div>
    </>
  );
}

/* ---------------- the hero ---------------- */
const MOBILE_Q = '(max-width: 999px)';
const BAND = 352;                      /* design-space height of the dashboard band shown on phones */
const SLOT_Y = 212;                    /* top of the dashboard's nav slot row: the phone nav panel starts here */
const SCENE_FOCAL = {x: 1050, y: 640}; /* what the phone scene is cropped around: the car */

export default function Hero() {
  const heroRef = useRef(null), visRef = useRef(null), stageRef = useRef(null), canvasRef = useRef(null), sceneRef = useRef(null), sceneCanvasRef = useRef(null);
  const [fx, setFx] = useState(undefined);
  const fxRef = useRef(null), cropRef = useRef(null), mobileRef = useRef(false);
  const bus = useRef({}).current;
  const [mobile, setMobile] = useState(false);
  const [tf, setTf] = useState({s: 1, x: 0});
  const [crop, setCrop] = useState(null);

  useLayoutEffect(() => {
    const mq = window.matchMedia(MOBILE_Q);
    const f = createGL(canvasRef.current, ASSETS, REDUCED);
    fxRef.current = f; setFx(f);
    if (!f) heroRef.current.classList.add('no-gl');
    const sync = () => { mobileRef.current = mq.matches; setMobile(mq.matches); };
    sync(); mq.addEventListener('change', sync);
    /* phone scene: after each GL frame, copy the car region of the live canvas into the scene canvas (same tick, so the buffer is still valid) */
    const blit = () => {
      const c = sceneCanvasRef.current, r = cropRef.current; if (!c || !r) return;
      const gl = canvasRef.current, pr = gl.width / W;
      c.getContext('2d').drawImage(gl, r.sx * pr, r.sy * pr, r.sw * pr, r.sh * pr, 0, 0, c.width, c.height);
    };
    if (f) gsap.ticker.add(blit);
    const io = new IntersectionObserver(e => f && f.setRunning(e[0].isIntersecting)); io.observe(heroRef.current);
    return () => { io.disconnect(); mq.removeEventListener('change', sync); if (f) { gsap.ticker.remove(blit); f.destroy(); } };
  }, []);

  /* sizing. desktop: the whole 1536 x 1024 stage scaled to the width. phone: the dashboard band fixed and framed on the logo, the car in a cover-cropped scene */
  useLayoutEffect(() => {
    const hero = heroRef.current, scene = sceneRef.current, f = fxRef.current;
    let last = null;
    const onResize = () => {
      let s, x = 0;
      if (mobile) {
        s = clamp(window.innerHeight * 0.26, 190, 250) / BAND;
        x = clamp(hero.clientWidth / 2 - LOGO.x * s, hero.clientWidth - W * s, 0);
        if (scene) {
          const cw = scene.clientWidth, ch = Math.max(scene.clientHeight, 1), asp = cw / ch;
          let sh = H - BAND, sw = sh * asp; if (sw > W) { sw = W; sh = sw / asp; }
          const sx = clamp(SCENE_FOCAL.x - sw / 2, 0, W - sw), sy = clamp(SCENE_FOCAL.y - sh / 2, BAND, H - sh);
          const r = {sx, sy, sw, sh, k: cw / sw}; cropRef.current = r; setCrop(r);
          const c = sceneCanvasRef.current; if (c) { const d = Math.min(window.devicePixelRatio || 1, 2); c.width = Math.round(cw * d); c.height = Math.round(ch * d); }
        }
      } else { cropRef.current = null; s = hero.clientWidth / W; }
      if (last && last.s === s && last.x === x) return; last = {s, x}; setTf(last); if (f) f.setSize(s);
    };
    onResize();
    const ro = new ResizeObserver(onResize); ro.observe(hero); if (scene) ro.observe(scene);
    return () => ro.disconnect();
  }, [mobile]);

  const sceneTap = () => { const f = fxRef.current; if (!f) return; f.inflate('car', 0.07); f.burst(SCENE_FOCAL.x, SCENE_FOCAL.y - 40, 14, {spd: [40, 160]}); f.scan(0.9); };
  const scrollTo = (el, block = 'start') => el && el.scrollIntoView({behavior: REDUCED ? 'auto' : 'smooth', block});

  useEffect(() => {
    if (fx === undefined) return;
    const hero = heroRef.current, stage = stageRef.current;
    let origin = fx ? fx.S_LOGO : 0, active = null, running = false;
    const navS = NAV.map(n => fx ? fx.pathS((n.rect[0] + n.rect[2]) / 2, 281) : 0);
    const setCurrent = it => hero.querySelectorAll('.nav-link').forEach((a, i) => { if (NAV[i] === it) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    bus.closeOthers = key => NAV.forEach(n => { if (n.key !== key && n.close) n.close(); });
    bus.navigate = item => {
      if (mobileRef.current) gsap.delayedCall(0.6, () => scrollTo(document.getElementById(item.key)));
      const i = NAV.indexOf(item), s = navS[i], cx = (item.rect[0] + item.rect[2]) / 2, prev = active;
      if (prev === item) { fx && fx.flash(7, cx, 281, 1.2, 90, 0.7); return; }
      active = item; setCurrent(item);
      if (!fx) return;
      fx.release(6, 0.3);
      fx.pulse(origin, s, {onArrive: () => {
        fx.hold(6, cx, 281, 0.55, 110); fx.flash(7, cx, 245, 1.4, 120, 0.9); fx.burst(cx, 281, 18, {spd: [50, 200], cone: Math.PI * 1.3});
        item.chars && gsap.fromTo(item.chars, {y: 0}, {keyframes: [{y: -4, textShadow: '0 0 14px rgba(255,60,40,1)', duration: 0.14}, {y: 0, textShadow: '0 0 0 rgba(0,0,0,0)', duration: 0.5, ease: 'power3.out'}], stagger: {each: 0.03, from: 'center'}});
        ({airbags: () => fx.inflate('all', 0.06), module: () => fx.scan(1.0), seatbelt: () => fx.flash(10, 1030, 72, 1.6, 120, 1.2), programming: () => { fx.screenFlicker(); fx.screenRow(4, true); gsap.delayedCall(1.2, () => fx.screenRow(4, false)); }})[item.key]();
      }});
      fx.sweep(Math.sign(s - origin) || 1, 0.45); origin = s;
    };
    bus.home = () => { active = null; setCurrent(null); if (!fx) return; fx.release(6); fx.pulse(origin, fx.S_LOGO, {onArrive: () => { fx.ring(2, 1.6, 1.4); fx.inflate('all', 0.05); fx.wireSurge(); }}); origin = fx.S_LOGO; };
    bus.cardsWave = () => {
      const cards = [...hero.querySelectorAll('.card-in')];
      cards.forEach((c, i) => gsap.timeline({delay: i * 0.09}).to(c, {y: -10, duration: 0.25, ease: 'power2.out'}).to(c, {y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)'}));
      hero.querySelectorAll('.card-glow').forEach((g, i) => gsap.fromTo(g, {opacity: 1}, {opacity: 0, duration: 0.9, delay: i * 0.09 + 0.2}));
      if (fx) M.cards.forEach((c, i) => gsap.delayedCall(i * 0.09, () => fx.burst((c.x[0] + c.x[1]) / 2, 833, 8, {spd: [40, 150], life: [0.3, 0.6]})));
      if (mobileRef.current) scrollTo(hero.querySelector('.cards'));
    };
    bus.startRepair = from => {
      if (running) return; running = true;
      if (mobileRef.current && from !== 'panel') scrollTo(hero.querySelector('.srs'), 'center');
      const rows = [...hero.querySelectorAll('.srs-row')], state = hero.querySelector('.srs-state'), frame = hero.querySelector('.srs-frame');
      const tl = gsap.timeline({onComplete: () => { running = false; }});
      if (fx) {
        if (from !== 'panel') fx.pulse(origin, fx.LEN, {onArrive: () => fx.ctaBurst(1)});
        tl.add(() => { fx.wireSurge(1.6); fx.sweep(1, 0.5); }, 0.2);
      }
      tl.to(state, {duration: 0.5, scrambleText: {text: 'Checking', chars: 'upperCase', speed: 0.8}}, 0.1)
        .to(frame, {boxShadow: '0 0 0 1px rgba(255,60,45,1), 0 0 34px rgba(255,30,20,.7), inset 0 0 30px rgba(255,20,10,.25)', duration: 0.3}, 0.1);
      rows.forEach((r, i) => {
        const st = r.querySelector('.srs-status'), final = ROWS[i][1], at = 0.45 + i * 0.36;
        tl.to(st, {duration: 0.3, scrambleText: {text: '···', chars: '·', speed: 1}, color: '#ffb0a6'}, at)
          .to(r, {backgroundColor: 'rgba(255,40,30,.16)', duration: 0.15}, at)
          .add(() => { if (fx) { fx.screenRow([0, 1, 2, 3, 5][i], true); if (i === 0) fx.inflate('car', 0.06); if (i === 2 || i === 3) fx.scan(0.7); } }, at)
          .to(st, {duration: 0.35, scrambleText: {text: final, chars: 'upperCase', speed: 0.9}, color: '#5dff9b'}, at + 0.22)
          .fromTo(r.querySelector('.srs-cell'), {boxShadow: '0 0 0 1px rgba(80,255,150,.9), 0 0 16px rgba(80,255,150,.6)'}, {boxShadow: '0 0 0 1px rgba(80,255,150,0), 0 0 0 rgba(80,255,150,0)', duration: 0.8}, at + 0.3)
          .to(r, {backgroundColor: 'rgba(255,40,30,0)', duration: 0.4}, at + 0.4);
      });
      tl.add(() => { if (fx) { fx.screenRow(5, false); fx.flash(8, LOGO.x, LOGO.y, 1.2, 150, 1.2); fx.ring(1, 1.2, 1.2); fx.burstRect(658, 380, 827, 546, 26); } }, 2.4)
        .to(state, {duration: 0.6, scrambleText: {text: 'Online', chars: 'upperCase', speed: 0.8}}, 2.35)
        .to(frame, {boxShadow: '0 0 0 1px rgba(255,50,40,.7), 0 0 22px rgba(255,30,20,.35), inset 0 0 22px rgba(255,20,10,.12)', duration: 0.8}, 2.5);
      hero.querySelectorAll('.conn').forEach(c => gsap.fromTo(c, {strokeDashoffset: 0}, {strokeDashoffset: -60, duration: 2.4, ease: 'none'}));
    };
    if (fx) fx.onLogoCross(() => { fx.ring(1, 1.1, 1.1); fx.flash(8, LOGO.x, LOGO.y + 40, 1.0, 140, 1.0); });
    const light = e => {
      if (!fx) return; const r = stage.getBoundingClientRect(), s = r.width / W, x = (e.clientX - r.left) / s, y = (e.clientY - r.top) / s;
      gsap.to(fx.light, {x, y, duration: 0.35, ease: 'power3.out', overwrite: 'auto'}); gsap.to(fx.U.uMouseI, {value: 1, duration: 0.5, overwrite: 'auto'});
      if (!REDUCED) { const nx = x / W - 0.5, ny = y / H - 0.5; gsap.to(hero.querySelector('.srs'), {x: nx * -10, y: ny * -8, duration: 0.8, ease: 'power3.out', overwrite: 'auto'}); gsap.to(hero.querySelector('.headline'), {x: nx * 5, y: ny * 4, duration: 0.9, ease: 'power3.out', overwrite: 'auto'}); }
    };
    const out = () => { if (fx) gsap.to(fx.U.uMouseI, {value: 0, duration: 0.8, overwrite: 'auto'}); };
    hero.addEventListener('pointermove', light); hero.addEventListener('pointerleave', out);
    const close = e => { if (!e.target.closest('.nav-item')) bus.closeOthers(null); };
    document.addEventListener('pointerdown', close);
    return () => { hero.removeEventListener('pointermove', light); hero.removeEventListener('pointerleave', out); document.removeEventListener('pointerdown', close); };
  }, [fx]);

  /* fonts + layout + intro */
  useEffect(() => {
    if (fx === undefined) return;
    let ctx, dead = false;
    const go = async () => {
      await Promise.all([document.fonts.load('600 15px "Montserrat"'), document.fonts.load('400 15px "Montserrat"'), document.fonts.load('normal normal 900 72px "Saira"')]);
      placeAll(heroRef.current);
      if (fx) await fx.ready;
      if (dead) return;
      heroRef.current.classList.add('ready');
      ctx = gsap.context(() => intro(fx, heroRef.current), heroRef);
    };
    go();
    return () => { dead = true; ctx && ctx.revert(); };
  }, [fx, mobile]);

  return (
    <FX.Provider value={fxRef}>
      <section ref={heroRef} className={'hero booting' + (mobile ? ' m' : '')} id="top">
        <div ref={visRef} className="vis" style={{height: (mobile ? BAND : H) * tf.s}}>
          <div ref={stageRef} className="stage" style={{transform: `translate(${tf.x}px, 0px) scale(${tf.s})`}}>
            <canvas ref={canvasRef} className="gl" aria-hidden="true" />
            <img className="fallback" alt="" aria-hidden="true" src={ASSETS.plate} />
            {!mobile && <Nav bus={bus} />}
            {!mobile && <Copy bus={bus} />}
            {!mobile && <Srs bus={bus} />}
            {!mobile && <Cards bus={bus} />}
            {!mobile && <Trust />}
          </div>
        </div>
        {mobile && <MobileNav bus={bus} offset={(BAND - SLOT_Y) * tf.s} />}
        {mobile && (
          <div ref={sceneRef} className="m-scene" onPointerDown={sceneTap} aria-hidden="true">
            <img className="m-scene-img" alt="" src={ASSETS.plate} style={crop ? {transform: `translate(${-crop.sx * crop.k}px, ${-crop.sy * crop.k}px) scale(${crop.k})`} : undefined} />
            <canvas ref={sceneCanvasRef} className="m-scene-gl" />
            <i className="m-scene-fade" />
          </div>
        )}
        {mobile && <MobileBar bus={bus} />}
        {mobile && (
          <div className="m-body">
            <Copy bus={bus} flow />
            <Fit w={169} h={166} max={1.7} className="m-srs"><Srs bus={bus} flow /></Fit>
            <Cards bus={bus} flow />
            <Trust flow />
          </div>
        )}
      </section>
    </FX.Provider>
  );
}

/* ---------------- intro: the garage powers up ---------------- */
function intro(fx, hero) {
  const q = s => hero.querySelectorAll(s);
  if (REDUCED) { hero.classList.remove('booting'); return; }
  const lines = [...q('.h-line:not(.h-shine)')], splits = lines.map(l => SplitText.create(l, {type: 'lines,chars', mask: 'lines', charsClass: 'ch', linesClass: 'ln'}));
  const tl = gsap.timeline({delay: 0.15, onComplete: () => hero.classList.remove('booting')});
  if (fx) {
    const U = fx.U;
    U.uExposure.value = 0.1; U.uIgnite.value = 0;
    tl.fromTo(U.uGain, {value: 0}, {keyframes: [{value: 1, duration: 0.05}, {value: 0.1, duration: 0.08}, {value: 0.85, duration: 0.05}, {value: 0.2, duration: 0.12}, {value: 1, duration: 0.25}]}, 0)
      .to(U.uIgnite, {value: 1, duration: 1.5, ease: 'power2.inOut'}, 0.15)
      .add(() => fx.ring(1, 1.3, 1.5), 0.25)
      .to(U.uExposure, {value: 1, duration: 1.4, ease: 'power2.out'}, 0.3)
      .add(() => fx.sweep(1, 0.6, 1.6), 0.5)
      .add(() => { fx.wireSurge(1.5); fx.inflate('car', 0.05); }, 1.6)
      .add(() => { fx.pulse(fx.S_LOGO, 0, {dur: 1.0, ease: 'power2.in', tail: 260}); fx.pulse(fx.S_LOGO, fx.LEN, {dur: 1.0, ease: 'power2.in', tail: 260, onArrive: () => fx.ctaBurst(0.6)}); }, 0.4);
  }
  tl.from(q('.nav-item .sprite'), {scale: 0.3, opacity: 0, duration: 0.6, stagger: 0.07, ease: 'back.out(2.5)'}, 0.55)
    .from(q('.nav-label'), {opacity: 0, y: 8, duration: 0.5, stagger: 0.07, ease: 'power3.out'}, 0.65)
    .from(q('.chev-btn, .nav-cta .t, .nav-cta-arrow'), {opacity: 0, duration: 0.5, stagger: 0.04}, 0.9)
    .from(q('.eyebrow-line'), {scaleX: 0, transformOrigin: '0 50%', duration: 0.6, ease: 'expo.out'}, 0.8)
    .from(q('.eyebrow'), {duration: 0.9, scrambleText: {text: '', chars: 'upperCase', speed: 0.6}, opacity: 0}, 0.85);
  splits.forEach((s, i) => tl.from(s.chars, {yPercent: 115, rotation: 4, duration: 0.75, stagger: 0.022, ease: 'power4.out'}, 0.9 + i * 0.1));
  tl.fromTo(q('.h-shine'), {backgroundPosition: '-60% 0'}, {backgroundPosition: '160% 0', duration: 1.2, stagger: 0.12, ease: 'power2.inOut'}, 1.35)
    .from(q('.para .t'), {opacity: 0, y: 12, duration: 0.7, stagger: 0.08, ease: 'power3.out'}, 1.3)
    .from(q('.btn'), {opacity: 0, y: 16, scale: 0.94, duration: 0.7, stagger: 0.1, ease: 'back.out(2)'}, 1.45)
    .from(q('.srs'), {opacity: 0, scale: 0.92, duration: 0.6, ease: 'power3.out'}, 1.35)
    .from(q('.srs-frame'), {clipPath: 'inset(0 100% 0 0)', duration: 0.7, ease: 'power2.inOut'}, 1.4)
    .from(q('.srs-row'), {opacity: 0, x: -12, duration: 0.45, stagger: 0.07, ease: 'power3.out'}, 1.6)
    .from(q('.srs-status'), {duration: 0.6, scrambleText: {text: '', chars: 'upperCase', speed: 0.8}, stagger: 0.07}, 1.7)
    .from(q('.conn'), {strokeDasharray: '0 200', duration: 0.9, stagger: 0.1, ease: 'power2.out'}, 1.9)
    .from(q('.conn-dot'), {scale: 0, transformOrigin: '50% 50%', duration: 0.4, stagger: 0.1, ease: 'back.out(3)'}, 2.3)
    .from(q('.card'), {opacity: 0, y: 40, duration: 0.8, stagger: 0.09, ease: 'power3.out'}, 1.75)
    .from(q('.trust-item, .trust-div'), {opacity: 0, y: 14, duration: 0.6, stagger: 0.08, ease: 'power3.out'}, 2.1);
}
