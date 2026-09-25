import { gsap, SplitText, EASE, isDesktop } from "@/lib/motion";
import fadeTargets from "./fade-targets.json";

/**
 * Entrance reveals shared by every block:
 *  - text rendered hidden (inline visibility:hidden) is split into masked lines that rise in,
 *  - wrappers the original fades in (24px rise) are matched by their measured DOM signature,
 *  - "scroll-fill" paragraphs brighten character by character as they scroll through.
 */
// measured on the original at 390, 1024 and 1440 px:
//  - line reveals start when the heading's top reaches 85 % of the viewport,
//  - fade-ups start when the wrapper's top (still 24px low) is 200px above the viewport bottom.
const LINES_START = "top 85%";
const FADE_START = "top bottom-=200";

type Sig = [string, string[]][];
const sigs = fadeTargets as unknown as Sig[];

function matches(el: Element, [tag, classes]: [string, string[]]) {
  if (el.localName !== tag) return false;
  if (!classes.length) return !el.getAttribute("class");
  return classes.every((c) => el.classList.contains(c));
}

/** Elements matching one of the recorded fade-in signatures (outer → inner). */
export function findFadeTargets(root: Element): HTMLElement[] {
  const out = new Set<HTMLElement>();
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    for (const sig of sigs) {
      let node: Element | null = el;
      let ok = true;
      for (let i = sig.length - 1; i >= 0; i--) {
        if (!node || !matches(node, sig[i])) { ok = false; break; }
        node = node.parentElement;
      }
      if (ok) { out.add(el); break; }
    }
  });
  // never animate an element inside another animated one
  return [...out].filter((el) => ![...out].some((o) => o !== el && o.contains(el)));
}

/** Split an element into masked lines; returns the inner spans that move. */
export function splitLines(el: HTMLElement) {
  const label = (el.textContent || "").replace(/\s+/g, " ").trim();
  // remember which sentence (separated by <br>) each word belongs to
  let seg = 0;
  const walker = [...el.childNodes];
  const wrapped = document.createElement("span");
  for (const n of walker) {
    if (n.nodeName === "BR") { seg++; wrapped.append(n); continue; }
    const s = document.createElement("span");
    s.dataset.seg = String(seg);
    s.append(n);
    wrapped.append(s);
  }
  el.replaceChildren(...wrapped.childNodes);
  const split = SplitText.create(el, { type: "lines,words", linesClass: "split-line", wordsClass: "split-word" });
  const inners: HTMLElement[] = [];
  for (const line of split.lines as HTMLElement[]) {
    const inner = document.createElement("span");
    inner.className = "split-line-inner";
    inner.append(...line.childNodes);
    line.append(inner);
    const segEl = inner.querySelector<HTMLElement>("[data-seg]");
    const k = segEl ? +(segEl.dataset.seg || 0) : 0;
    if (k) line.style.translate = `0 calc(${k} * var(--split-sentence-gap, 0px))`;
    inners.push(inner);
  }
  el.classList.add("split-up");
  el.setAttribute("aria-label", label);
  return inners;
}

export function revealLines(el: HTMLElement, opts: { immediate?: boolean; delay?: number } = {}) {
  const inners = splitLines(el);
  gsap.set(el, { visibility: "visible" });
  gsap.set(inners, { yPercent: 130, autoAlpha: 0 });
  const play = () =>
    gsap.to(inners, { yPercent: 0, autoAlpha: 1, duration: 1, ease: EASE.reveal, stagger: 0.1, delay: opts.delay ?? 0 });
  if (opts.immediate) return play();
  return gsap.timeline({ scrollTrigger: { trigger: el, start: LINES_START, once: true } }).add(play());
}

export function revealFade(el: HTMLElement) {
  gsap.set(el, { y: 24, autoAlpha: 0 });
  gsap.to(el, {
    y: 0,
    autoAlpha: 1,
    duration: 1,
    ease: EASE.reveal,
    scrollTrigger: { trigger: el, start: FADE_START, once: true },
  });
}

/** Characters fade from 30% to full opacity, scrubbed by scroll. */
export function scrollFill(el: HTMLElement) {
  const target = el.querySelector("p") || el;
  const split = SplitText.create(target, { type: "words,chars", charsClass: "scroll-fill-char" });
  gsap.set(split.chars, { opacity: 0.3 });
  gsap.to(split.chars, {
    opacity: 1,
    ease: "none",
    stagger: 0.1,
    scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 45%", scrub: true },
  });
}

// number pills sit in text-only markup but the original fades them rather than splitting them
const isTextOnly = (el: Element): boolean =>
  !el.classList.contains("number-pill") &&
  [...el.children].every((c) => ["BR", "SPAN", "EM", "STRONG"].includes(c.tagName) && isTextOnly(c));

// fades the original only runs on the desktop layout (measured at 390px: the values cards are shown as-is)
const DESKTOP_ONLY_FADES = ".col-span-full.lg\\:col-span-4.xl\\:col-span-8 > .h-full";

// headings the original splits into lines although the server renders them visible (from the mutation logs)
const EXTRA_SPLITS = [
  ".team-name-and-leader > span.h3",
  ".col-span-8.flex.flex-col > h2.cap-trim.whitespace-pre-line",
  ".mb-\\[98px\\].flex.items-end > h2.cap-trim.font-sans",
  ".mb-8.lg\\:mb-16.lg\\:flex > h2.h5",
  ".title-container > span.h3.whitespace-pre-line",
  ".container > h2.inline-block.h3.text-warm-black",
  ".col-span-full.flex.flex-col > h2.h3.whitespace-pre-line",
];

export function initReveals(root: HTMLElement, skip: (el: Element) => boolean = () => false) {
  root.querySelectorAll<HTMLElement>(".scroll-fill-notrim").forEach((el) => !skip(el) && scrollFill(el));
  const split = new Set<HTMLElement>();
  root.querySelectorAll<HTMLElement>("[style*='visibility']").forEach((el) => {
    if (skip(el) || el.style.visibility !== "hidden" || el.style.opacity) return;
    if (isTextOnly(el)) { revealLines(el); split.add(el); }
    else revealFade(el);
  });
  root.querySelectorAll<HTMLElement>(EXTRA_SPLITS.join(",")).forEach((el) => {
    if (!split.has(el) && !skip(el) && isTextOnly(el) && !el.classList.contains("split-up")) revealLines(el);
  });
  findFadeTargets(root).forEach((el) => {
    if (skip(el) || (!isDesktop() && el.matches(DESKTOP_ONLY_FADES))) return;
    revealFade(el);
  });
}
