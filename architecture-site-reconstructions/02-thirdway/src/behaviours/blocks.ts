import { gsap, ScrollTrigger, isDesktop } from "@/lib/motion";
import { initCounters, initJournalIndex, initProjectsIndex } from "./listings";

type Cleanup = () => void;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode) => [...root.querySelectorAll<T>(sel)];

/* ------------------------------------------------------------------ "Trust the process" (pinned steps) */

type Box = { x: number; y: number; w: number; h: number };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: Box, b: Box, t: number): Box => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });
const rel = (el: Element, origin: DOMRect): Box => {
  const r = el.getBoundingClientRect();
  return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height };
};

/**
 * Six step images fly between three positions: the large frame (current step), a square
 * thumbnail beside it (next step) and a point past the thumbnail (the one after). Outgoing
 * images collapse into the frame's top-left corner. Geometry measured on the live site.
 */
function initProcess(section: HTMLElement): Cleanup | null {
  const stage = section.querySelector<HTMLElement>(".relative.mt-\\[48px\\]");
  if (!stage) return null;
  const cards = $$<HTMLElement>(":scope > div.absolute.top-0.left-0", stage);
  const n = cards.length;
  const col = stage.querySelector<HTMLElement>("[data-process-textcol]");
  const mobile = stage.querySelector<HTMLElement>(":scope > .lg\\:hidden");
  let geo: { big: Box; small: Box; point: Box; gone: Box } | null = null;

  const measure = () => {
    const o = stage.getBoundingClientRect();
    if (isDesktop()) {
      const grid = stage.querySelector(":scope > .site-grid")!;
      const big = rel(grid.children[0], o);
      const marker = rel(grid.children[1], o);
      const pv = big.h * 0.398125;
      stage.style.setProperty("--pv-size", `${pv}px`);
      const small = { x: marker.x, y: big.y + big.h - pv, w: pv, h: pv };
      geo = { big, small, point: { x: small.x + pv + 15, y: big.y + big.h - 1, w: 1, h: 1 }, gone: { x: big.x, y: big.y, w: 0, h: 0 } };
    } else if (mobile) {
      const slots = mobile.querySelector(":scope > .site-grid")!;
      const big = rel(slots.children[0], o);
      const small = rel(slots.children[1], o);
      geo = { big, small, point: { x: small.x + small.w, y: small.y + small.h - 1, w: 1, h: 1 }, gone: { x: big.x, y: big.y, w: 0, h: 0 } };
    }
  };

  const texts = col ? $$<HTMLElement>(":scope > div.absolute.inset-0", col) : [];
  const mobTexts = mobile ? $$<HTMLElement>(".grid.w-full > div", mobile) : [];
  const pills = $$<HTMLElement>(".number-pill.relative > span", stage);
  const vLine = col?.querySelector<HTMLElement>(":scope > span > span");
  const hLine = mobile?.querySelector<HTMLElement>(".origin-left");
  let shown = -1;
  const show = (k: number) => {
    if (k === shown) return;
    shown = k;
    [texts, mobTexts].forEach((list) => list.forEach((t, i) => {
      t.classList.toggle("invisible", i !== k);
      t.classList.toggle("opacity-0", i !== k);
      t.setAttribute("aria-hidden", String(i !== k));
      t.style.transition = "opacity .4s";
    }));
    pills.forEach((p) => (p.textContent = String(k + 1).padStart(2, "0")));
  };

  const render = (s: number) => {
    if (!geo) return;
    const { big, small, point, gone } = geo;
    cards.forEach((c, i) => {
      const d = i - s;
      let b: Box, o = 1;
      if (d <= -1) { b = gone; o = 0; }
      else if (d <= 0) { b = mix(big, gone, -d); o = 1 + d; }
      else if (d <= 1) b = mix(big, small, d);
      else if (d <= 2) { b = mix(small, point, d - 1); o = 2 - d; }
      else { b = point; o = 0; }
      gsap.set(c, { x: b.x, y: b.y, width: b.w, height: b.h, zIndex: i + 1, autoAlpha: o > 0.01 && b.w > 0.5 ? o : 0 });
    });
    show(Math.min(n - 1, Math.max(0, Math.round(s))));
  };

  const ease = gsap.parseEase("power1.inOut");
  const stepPx = () => (isDesktop() ? 540 : window.innerHeight * 0.6);
  const pinned = section.firstElementChild as HTMLElement;
  const st = ScrollTrigger.create({
    trigger: pinned,
    // desktop: pin once the image frame sits 89px above the viewport bottom (measured at 1440×900)
    start: () => {
      if (!isDesktop()) return "top top";
      const frame = stage.querySelector(":scope > .site-grid > div")!.getBoundingClientRect();
      const off = frame.top - pinned.getBoundingClientRect().top;
      return `top ${window.innerHeight - frame.height - 89 - off}px`;
    },
    end: () => `+=${stepPx() * (n - 1)}`,
    pin: true,
    scrub: true,
    invalidateOnRefresh: true,
    onRefresh: (self) => { measure(); render(self.progress * (n - 1)); },
    onUpdate: (self) => {
      const raw = self.progress * (n - 1);
      const k = Math.floor(raw);
      render(Math.min(n - 1, k + ease(raw - k)));
    },
  });
  const lineTween = [vLine, hLine].filter(Boolean).map((line, i) =>
    gsap.fromTo(line!, i === 0 ? { scaleY: 0 } : { scaleX: 0 }, {
      ...(i === 0 ? { scaleY: 1 } : { scaleX: 1 }),
      ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: () => `+=${window.innerHeight + stepPx() * (n - 1) + pinned.offsetHeight * 0.5}`, scrub: true },
    }),
  );
  measure();
  render(0);

  // Read more / Read less
  const toggles = $$<HTMLButtonElement>("button[aria-expanded]", stage);
  const onToggle = (e: Event) => {
    const btn = e.currentTarget as HTMLButtonElement;
    const open = btn.getAttribute("aria-expanded") !== "true";
    toggles.forEach((b) => {
      b.setAttribute("aria-expanded", String(open));
      const [more, less] = $$<HTMLElement>(".relative.block.overflow-visible > span", b);
      if (more && less) {
        more.style.opacity = open ? "0" : "1";
        less.style.opacity = open ? "1" : "0";
      }
    });
    $$<HTMLElement>(".grid.transition-\\[grid-template-rows\\,opacity\\]", stage).forEach((g) => {
      g.style.gridTemplateRows = open ? "1fr" : "0fr";
      g.style.opacity = open ? "1" : "0";
    });
  };
  toggles.forEach((b) => b.addEventListener("click", onToggle));
  return () => {
    st.kill();
    lineTween.forEach((t) => t.scrollTrigger?.kill());
    toggles.forEach((b) => b.removeEventListener("click", onToggle));
  };
}

/* ------------------------------------------------------------------ case-study scroller (image masks + testimonial card) */

const TEAM_COLOURS: Record<string, string> = { Studio: "#444828", Boutique: "#3d6062" };

/** Parallel text nodes of two same-shaped subtrees → replacement pairs. */
function textPairs(a: Element, b: Element) {
  const walk = (el: Element) => {
    const out: string[] = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) if (w.currentNode.nodeValue?.trim()) out.push(w.currentNode.nodeValue);
    return out;
  };
  const ta = walk(a), tb = walk(b);
  return new Map(ta.map((t, i) => [t, tb[i] ?? t]));
}

function retarget(content: HTMLElement, from: Element, to: Element) {
  const pairs = textPairs(from, to);
  const w = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const v = w.currentNode.nodeValue ?? "";
    if (pairs.has(v)) w.currentNode.nodeValue = pairs.get(v)!;
  }
  const hrefFrom = from.querySelector("a")?.getAttribute("href");
  const hrefTo = to.querySelector("a")?.getAttribute("href");
  content.querySelectorAll("a").forEach((a) => a.getAttribute("href") === hrefFrom && hrefTo && a.setAttribute("href", hrefTo));
  const logoTo = to.querySelector(".team-logo");
  content.querySelectorAll(".team-logo").forEach((l) => {
    if (!logoTo) return;
    l.setAttribute("aria-label", logoTo.getAttribute("aria-label") || "");
    l.innerHTML = logoTo.innerHTML;
  });
}

function initCaseStudies(section: HTMLElement): Cleanup | null {
  const list = $$<HTMLLIElement>("ul.sr-only > li", section);
  if (list.length < 1) return null;
  const teams = list.map((li) => li.querySelector(".team-logo")?.getAttribute("aria-label") || "");
  const offs: Cleanup[] = [];

  const setup = (wrap: HTMLElement | null, masksSel: string, cardSel: string, contentSel: string) => {
    if (!wrap) return;
    const masks = $$<HTMLElement>(masksSel, wrap);
    const card = wrap.querySelector<HTMLElement>(cardSel);
    const base = card?.querySelector<HTMLElement>(contentSel);
    if (!card || !base) return;
    // one content layer per item, cross-faded
    const layers = list.map((li, i) => {
      if (i === 0) return base;
      const c = base.cloneNode(true) as HTMLElement;
      retarget(c, list[0], li);
      c.style.position = "absolute";
      c.style.inset = "0";
      base.after(c);
      return c;
    });
    layers.forEach((l, i) => {
      gsap.set(l, { opacity: i ? 0 : 1 });
      $$<HTMLElement>("[style*='opacity']", l).forEach((el) => gsap.set(el, { opacity: 1, y: 0, clearProps: "transform" }));
    });
    masks.forEach((m, i) => gsap.set(m, { zIndex: i, clipPath: i ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 0% 0%)" }));
    let current = 0;
    const tl = gsap.timeline({ defaults: { ease: "none" } });
    for (let i = 1; i < masks.length; i++) tl.to(masks[i], { clipPath: "inset(0% 0% 0% 0%)", duration: 1 }, i - 1);
    const st = ScrollTrigger.create({
      trigger: wrap,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      animation: tl,
      onUpdate: (self) => {
        const k = Math.min(list.length - 1, Math.floor(self.progress * (list.length - 1) + 0.5));
        if (k === current) return;
        current = k;
        layers.forEach((l, i) => gsap.to(l, { opacity: i === k ? 1 : 0, duration: 0.4 }));
        gsap.to(card, { backgroundColor: TEAM_COLOURS[teams[k]] ?? "#444828", duration: 0.5 });
      },
    });
    offs.push(() => st.kill());
  };
  setup(section.querySelector(":scope > .relative.hidden"), ".gsap--image-masks", ".max-w-\\[900px\\]", ":scope > div > div");
  setup(section.querySelector(":scope > .relative.z-0.flex"), ".gsap--image-masks-mob", ".rounded-b-sm.lg\\:hidden", ":scope > div.absolute.inset-0 > div");
  return () => offs.forEach((f) => f());
}

/* ------------------------------------------------------------------ services list (pinned stack) */

/**
 * Desktop: the list is pinned and each service slides up over the previous one (473px of scroll
 * per service, measured) while its image wipes in from the bottom. "View all" swaps to the
 * compact list.
 */
function initServices(section: HTMLElement): Cleanup | null {
  const desk = section.querySelector<HTMLElement>(".container > .hidden.lg\\:block");
  if (!desk) return null;
  const slider = desk.querySelector<HTMLElement>(".relative > .relative.flex-col");
  const compact = desk.querySelector<HTMLElement>(".relative > .hidden");
  const rows = slider ? $$<HTMLElement>(":scope > .service-row", slider) : [];
  const STEP = 473;
  let st: ScrollTrigger | null = null;
  const build = () => {
    if (!rows.length || !isDesktop()) return;
    const tl = gsap.timeline({ defaults: { ease: "none" } });
    rows.forEach((row, i) => {
      gsap.set(row, { zIndex: i + 1, backgroundColor: "var(--color-warm-white)" });
      if (!i) return;
      gsap.set(row, { position: "absolute", top: 0, left: 0, right: 0 });
      tl.fromTo($$(".service-slide", row), { y: STEP }, { y: 0, duration: 1 }, i - 1);
      tl.fromTo(row.querySelector(".service-img"), { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1 }, i - 1);
    });
    st = ScrollTrigger.create({ trigger: desk, start: "top top", end: () => `+=${STEP * (rows.length - 1)}`, pin: true, scrub: true, animation: tl });
  };
  build();
  const btn = desk.querySelector<HTMLButtonElement>("button[aria-expanded]");
  const toggle = () => {
    const open = btn!.getAttribute("aria-expanded") !== "true";
    btn!.setAttribute("aria-expanded", String(open));
    const [more, less] = $$<HTMLElement>(".relative.block.overflow-visible > span", btn!);
    if (more && less) { more.style.opacity = open ? "0" : "1"; less.style.opacity = open ? "1" : "0"; }
    compact?.classList.toggle("hidden", !open);
    slider?.classList.toggle("hidden", open);
    slider?.classList.toggle("flex", !open);
    if (open) { st?.kill(true); st = null; } else build();
    ScrollTrigger.refresh();
  };
  btn?.addEventListener("click", toggle);
  return () => { st?.kill(); btn?.removeEventListener("click", toggle); };
}

/* ------------------------------------------------------------------ people hero: portraits drifting toward the viewer */

// slot anchors in 3D space at a 1440×900 viewport (read from the live page); 5–7 mirrored
const ANCHORS: [number, number][] = [
  [969, -504], [-1040, -405], [427, 585], [-513, -558], [-912, 450],
  [1040, 405], [513, 558], [1211, -100], [-1211, -540], [-342, 567], [0, -558],
];
const SLOT_CLASS = "slot absolute top-1/2 left-1/2 aspect-3/4 w-[45%] overflow-hidden rounded-sm opacity-0 will-change-[transform,opacity] md:w-[35%] lg:w-[30%] xl:w-[20%]";
const DEPTH = 2000; // px travelled from the back to the camera
const LIFETIME = 16; // seconds per portrait

function initPeopleHero(section: HTMLElement): Cleanup | null {
  const photos = [...new Set($$<HTMLImageElement>(".people-block img", document).map((i) => i.getAttribute("src")).filter(Boolean))] as string[];
  if (!photos.length) return null;
  const stage = document.createElement("div");
  stage.className = "absolute-center size-full transform-cpu perspective-[1000px]";
  section.append(stage);
  const COUNT = 8;
  const slots = Array.from({ length: COUNT }, (_, i) => {
    const el = document.createElement("div");
    el.className = SLOT_CLASS;
    el.innerHTML = `<picture class="site-image cover"><img alt="" src="${photos[i % photos.length]}"></picture>`;
    stage.append(el);
    return { el, anchor: i, photo: i, phase: i / COUNT, last: -1 };
  });
  let nextAnchor = COUNT % ANCHORS.length;
  let nextPhoto = COUNT;
  const t0 = gsap.ticker.time;
  const tick = () => {
    const sx = window.innerWidth / 1440, sy = window.innerHeight / 900;
    const t = gsap.ticker.time - t0;
    slots.forEach((s) => {
      const life = (t / LIFETIME + s.phase) % 1;
      if (life < s.last) {
        // recycled: new portrait at the next anchor
        s.anchor = nextAnchor; nextAnchor = (nextAnchor + 1) % ANCHORS.length;
        s.photo = nextPhoto++; s.el.querySelector("img")!.src = photos[s.photo % photos.length];
      }
      s.last = life;
      const [ax, ay] = ANCHORS[s.anchor];
      const z = -DEPTH + life * DEPTH * 1.1;
      const fadeIn = Math.min(1, life / 0.08) * Math.min(1, t / 1.2);
      const fadeOut = life > 0.85 ? Math.max(0, 1 - (life - 0.85) / 0.15) : 1;
      s.el.style.transform = `translate(-50%, -50%) translate3d(${ax * sx}px, ${ay * sy}px, ${z}px)`;
      s.el.style.opacity = String(fadeIn * fadeOut);
      s.el.style.zIndex = String(Math.round(life * 100));
    });
  };
  gsap.ticker.add(tick);
  return () => { gsap.ticker.remove(tick); stage.remove(); };
}

/* ------------------------------------------------------------------ registry */

export function initBlocks(root: HTMLElement): Cleanup {
  const offs: (Cleanup | null)[] = [];
  root.querySelectorAll<HTMLElement>("section").forEach((s) => {
    if (s.querySelector(":scope [data-process-textcol]")) offs.push(initProcess(s));
    if (s.querySelector(":scope .gsap--image-masks, :scope .gsap--image-masks-mob")) offs.push(initCaseStudies(s));
    if (s.classList.contains("services-block")) offs.push(initServices(s));
    if (s.classList.contains("people-hero-block")) offs.push(initPeopleHero(s));
  });
  if (root.querySelector(".project-card")) offs.push(initProjectsIndex(root));
  if (root.querySelector("input[type=search]")) offs.push(initJournalIndex(root));
  offs.push(initCounters(root));
  return () => offs.forEach((f) => f?.());
}
