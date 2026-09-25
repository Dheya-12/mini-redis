/**
 * Content switcher (`data-plugin~="contentAnimation"`): a list of items of which one is shown at a time.
 *
 * Opening an item animates it in over the previous one ("changeShow"), which animates out ("changeHide"); the first
 * item to open uses "show". Items are stacked by z-index in the order they opened; closed items get `is-hidden`.
 * Options come from `data-content-animation-*`:
 *   plugins   controller — follow another switcher (`controller-selector`); height — keep the list as tall as the
 *             tallest item (`fixed-height`) or animate it to the new item's height; sticky — pick the item from the
 *             scroll position across the enclosing `.sticky` (`sticky-top-offset`, `sticky-bottom-offset`, % of the
 *             screen); counter — write the index into `counter-selector`; events — tell followers what opened.
 *   animations  JSON of { show, changeShow, changeHide, hide }, each a name or { name, delay }.
 * Durations and eases are the original's (see lib/animate.ts).
 */
import { matches } from "@/lib/mq";
import { animate, group, none, DURATION, EASE, type Handle, type Ease } from "@/lib/animate";
import { addLayout } from "@/lib/layout";
import { createRun } from "./parallax/engine";
import { splitChars, splitLines, unsplit } from "./split";
import type { Cleanup } from "@/lib/runtime";

type State = "closed" | "opening" | "open" | "closing";
type Item = { el: HTMLElement; id: string | number; index: number; state: State; shown: State; anim: Handle | null; zIndex: number };
type AnimSpec = string | { name: string; delay?: number } | null | undefined;
type Ctx = { direction: number };
type AnimFn = (el: HTMLElement, o: { delay?: number; duration?: number; ease?: Ease }, ctx: Ctx) => Handle;

// ---------------------------------------------------------------- animations
const fadeIn: AnimFn = (el, o) => animate(el, { opacity: [0, 1] }, { ease: EASE.easeOut, duration: DURATION.slow, ...o });
const fadeOut: AnimFn = (el, o) => animate(el, { opacity: [1, 0] }, { ease: EASE.easeIn, duration: DURATION.slow, ...o });

/** words appear line by line */
const text: AnimFn = (el, o) => {
  unsplit(el);
  el.style.opacity = "";
  splitLines(el);
  const words = Array.from(el.querySelectorAll<HTMLElement>(".word"));
  const delay = o.delay ?? 0;
  return group(words.map((w) => animate(w, { opacity: [0, 1] }, { duration: DURATION.text, ease: EASE.easeOut, delay: (parseInt(w.style.getPropertyValue("--line-index"), 10) || 0) * DURATION.textStagger + delay })));
};

/** characters rise into place (or drop, going backwards) */
const titleUp: AnimFn = (el, o, ctx) => {
  unsplit(el);
  splitChars(el);
  const chars = Array.from(el.querySelectorAll<HTMLElement>(".char"));
  const from = ctx.direction < 0 ? "-110%" : "110%";
  return group(chars.map((c, i) => animate(c, { transform: [`translateY(${from})`, "translateY(0%)"], opacity: [0, 1] }, { duration: DURATION.titleSlide, ease: EASE.easeOut, delay: i * DURATION.titleSlideStagger + (o.delay ?? 0) })));
};
const titleUpOut: AnimFn = (el, o, ctx) => {
  unsplit(el);
  splitChars(el);
  const chars = Array.from(el.querySelectorAll<HTMLElement>(".char"));
  const to = ctx.direction < 0 ? "110%" : "-110%";
  return group(chars.map((c, i) => animate(c, { transform: ["translateY(0%)", `translateY(${to})`], opacity: [1, 0] }, { duration: DURATION.titleSlide, ease: EASE.easeOut, delay: i * DURATION.titleSlideStagger + (o.delay ?? 0) })));
};

export const ANIMATIONS: Record<string, AnimFn> = { fadeIn, fadeOut, text, titleUp, titleUpOut, none: () => none() };

const running = new WeakMap<Element, Handle>();
/** runs a named animation on an element (cancelling the one it is running, and un-hiding it first) */
export function runAnimation(el: HTMLElement, spec: AnimSpec, ctx: Ctx): Handle {
  const name = typeof spec === "string" ? spec : spec?.name;
  const fn = name ? ANIMATIONS[name] : null;
  running.get(el)?.cancel();
  el.classList.remove("is-hidden", "is-invisible");
  if (!fn) return none();
  const h = fn(el, typeof spec === "object" && spec ? { delay: spec.delay } : {}, ctx);
  running.set(el, h);
  return h;
}

// ---------------------------------------------------------------- the switcher
const instances = new WeakMap<Element, ContentAnimation>();
export const contentAnimationOf = (el: Element | null) => (el ? instances.get(el) ?? null : null);

function findElement(container: Element, selector: string | null) {
  if (!selector) return null;
  if (selector.startsWith(":root")) return document.querySelector<HTMLElement>(selector.replace(/^:root\s*/, "")) ;
  return container.querySelector<HTMLElement>(selector);
}

class ContentAnimation {
  items: Item[];
  stack: number[] = [];
  list: HTMLElement;
  plugins: Set<string>;
  animations: Record<string, AnimSpec>;
  fixedHeight: boolean;
  private offs: Cleanup[] = [];
  private maxHeight = 0;
  private heightAnim: Animation | null = null;
  private activeIndex = 0;
  private absoluteIndex = 0;

  constructor(readonly el: HTMLElement) {
    const d = el.dataset;
    this.plugins = new Set(["controller", "events", ...(d.contentAnimationPlugins ?? "").split(/\s+/).filter(Boolean)]);
    let anims: Record<string, AnimSpec> = {};
    try { anims = JSON.parse(d.contentAnimationAnimations ?? "{}"); } catch { anims = {}; }
    this.animations = { show: "textInBottom", changeShow: "textInBottom", changeHide: null, hide: "fadeOut", ...anims };
    this.fixedHeight = d.contentAnimationFixedHeight === "true";
    this.list = el.querySelector<HTMLElement>(".content-animation") ?? el;
    // items: the first shown one is open, the rest closed
    let openId: string | number | null = null;
    this.items = Array.from(el.querySelectorAll<HTMLElement>("[data-content-animation-item]")).map((item, index) => {
      const raw = item.getAttribute("data-content-animation-item") ?? String(index);
      const id = /^-?\d+$/.test(raw) ? Number(raw) : raw;
      const hidden = item.classList.contains("is-hidden") || item.getAttribute("aria-hidden") === "true";
      const state: State = (openId !== null && openId !== id) || hidden ? "closed" : "open";
      if (state === "open") openId = id;
      if (state === "closed") { item.classList.add("is-hidden"); item.setAttribute("aria-hidden", "true"); }
      if (!item.getAttribute("role")) item.setAttribute("role", "tabpanel");
      item.setAttribute(`data-content-animation-${state}`, "true");
      if (state === "open") item.setAttribute("data-content-animation-top", "true");
      return { el: item, id, index, state, shown: state, anim: null, zIndex: 0 };
    });
    this.stack = this.items.filter((i) => i.state === "open").map((i) => i.index);
    this.activeIndex = Math.max(0, this.index());
    this.absoluteIndex = this.activeIndex;
    instances.set(el, this);
  }

  enable() {
    this.list.classList.add("content-animation--ready");
    this.sync();
    if (this.plugins.has("height")) {
      this.measureHeight();
      this.offs.push(addLayout("measure", () => this.measureHeight()));
    }
    if (this.plugins.has("controller")) {
      const ctrl = findElement(this.el, this.el.dataset.contentAnimationControllerSelector ?? null);
      if (ctrl && ctrl !== this.el) {
        const follow = (e: Event) => {
          const d = (e as CustomEvent).detail as { id: string | number; direction: number; source: Element };
          if (d.source !== this.el) this.open(d.id, { direction: d.direction });
        };
        ctrl.addEventListener("contentanimation:open", follow);
        this.offs.push(() => ctrl.removeEventListener("contentanimation:open", follow));
      }
    }
    if (this.plugins.has("sticky")) {
      const sticky = this.el.closest<HTMLElement>(".sticky");
      if (sticky) {
        const top = Number(this.el.dataset.contentAnimationStickyTopOffset ?? 0) || 0;
        const bottom = Number(this.el.dataset.contentAnimationStickyBottomOffset ?? 0) || 0;
        const run = createRun(sticky, {
          clamp: true, enableMq: null,
          frames: { [`parallax-${-1 * top}-0`]: { progress: 0 }, [`parallax-${100 + bottom}-100`]: { progress: 1 } },
          update: (ctx) => {
            const n = Math.min(Math.floor(ctx.position * this.items.length), this.items.length - 1);
            if (n !== this.activeIndex) {
              const direction = n > this.activeIndex ? 1 : -1;
              this.activeIndex = n;
              this.openByIndex(n, { direction });
            }
          },
        });
        this.offs.push(run.destroy);
      }
    }
  }

  destroy() { this.offs.forEach((f) => f()); instances.delete(this.el); }

  index(id?: string | number | null): number {
    if (id === undefined) { const a = this.activeId(); return a === null ? -1 : this.index(a); }
    const hit = this.items.find((i) => i.id === id);
    if (hit) return hit.index;
    return typeof id === "number" && id >= 0 && id < this.items.length ? id : -1;
  }

  activeId() {
    for (let k = this.stack.length - 1; k >= 0; k--) {
      const it = this.items[this.stack[k]];
      if (it.state === "opening" || it.state === "open") return it.id;
    }
    return null;
  }

  openByIndex(i: number, data: { direction?: number } = {}) { if (this.items[i]) this.open(this.items[i].id, data); }

  open(id: string | number | null, data: { direction?: number } = {}) {
    const previous = this.index();
    // height: freeze the current height before items change
    if (this.plugins.has("height") && !this.fixedHeight) this.list.style.height = this.list.offsetHeight + "px";
    const n = id === null ? -1 : this.index(id);
    const target = n >= 0 ? this.items[n] : null;
    const opens: { item: Item; spec: AnimSpec }[] = [];
    const closes: { item: Item; spec: AnimSpec }[] = [];
    if (target && (this.stack[this.stack.length - 1] !== target.index || (target.state !== "opening" && target.state !== "open"))) {
      this.stackAdd(target.index);
      const spec = this.animationName(n, "opening");
      if (spec) opens.push({ item: target, spec });
    }
    const changeHide = !!this.animations.changeHide;
    if (!target || changeHide) {
      for (const k of [...this.stack]) {
        const it = this.items[k];
        if (it.id === id) continue;
        if (it.state === "opening" || it.state === "open") {
          const spec = this.animationName(n, "closing");
          if (spec) { it.state = "closing"; closes.push({ item: it, spec }); }
        }
      }
    }
    this.sync();
    const count = this.items.length;
    for (const o of opens) {
      const prev = closes[0]?.item ?? null;
      this.animateOpen(o.item, o.spec, { direction: this.direction(prev, o.item, count, data) });
    }
    for (const c of closes) {
      const next = opens[0]?.item ?? null;
      this.animateClose(c.item, c.spec, { direction: this.direction(c.item, next, count, data) });
    }
    if (this.plugins.has("height") && !this.fixedHeight) this.animateHeight(target);
    if (this.plugins.has("counter")) this.count(previous, n);
    if (target) target.el.dispatchEvent(new CustomEvent("contentanimation:open", { bubbles: true, detail: { id: target.id, index: target.index, direction: data.direction ?? 0, source: this.el } }));
  }

  private animationName(n: number, state: "opening" | "closing"): AnimSpec {
    if (n === -1) return this.animations.hide;
    return this.stack.length > 1 ? (state === "opening" ? this.animations.changeShow : this.animations.changeHide) : this.animations.show;
  }

  private direction(a: Item | null, b: Item | null, count: number, data: { direction?: number }) {
    if (data.direction === 1 || data.direction === -1) return data.direction;
    if (count > 2 && a && b) {
      if (a.index === count - 1 && b.index === 0) return 1;
      if (a.index === 0 && b.index === count - 1) return -1;
    } else if (!a || !b) return 1;
    return b.index > a.index ? 1 : -1;
  }

  private stackAdd(i: number) {
    this.items[i].state = "opening";
    const k = this.stack.indexOf(i);
    if (k !== this.stack.length - 1 || k === -1) {
      if (k !== -1) this.stack.splice(k, 1);
      this.stack.push(i);
    }
  }

  private stackRemove(it: Item) {
    it.anim?.cancel();
    it.anim = null;
    it.state = "closed";
    const k = this.stack.indexOf(it.index);
    if (k !== -1) this.stack.splice(k, 1);
  }

  private animateOpen(it: Item, spec: AnimSpec, ctx: Ctx) {
    const h = (it.anim = runAnimation(it.el, spec, ctx));
    h.finished.then(() => {
      if (it.anim !== h) return;
      it.anim = null;
      requestAnimationFrame(() => clearAnimations(it.el));
      if (it.state === "opening") { it.state = "open"; this.sync(); }
    });
  }

  private animateClose(it: Item, spec: AnimSpec, ctx: Ctx) {
    const h = (it.anim = runAnimation(it.el, spec, ctx));
    h.finished.then(() => {
      if (it.anim !== h) return;
      it.anim = null;
      if (it.state === "closing") { this.stackRemove(it); this.sync(); }
      requestAnimationFrame(() => clearAnimations(it.el));
    });
  }

  /** writes item states into classes, aria and z-index */
  private sync() {
    // everything under the topmost fully open item is closed
    let found = false;
    for (let k = this.stack.length - 1; k >= 0; k--) {
      const it = this.items[this.stack[k]];
      if (found) it.state = "closed";
      else if (it.state === "open") found = true;
    }
    for (const it of this.items) {
      if (it.state === "closed" && this.stack.includes(it.index)) this.stackRemove(it);
      if (it.shown !== it.state) {
        it.el.classList.toggle("is-hidden", it.state === "closed");
        const visible = it.state === "opening" || it.state === "open";
        it.el.setAttribute("aria-hidden", visible ? "false" : "true");
        if (visible) it.el.setAttribute("data-content-animation-top", "true"); else it.el.removeAttribute("data-content-animation-top");
        it.el.removeAttribute(`data-content-animation-${it.shown}`);
        it.el.setAttribute(`data-content-animation-${it.state}`, "true");
        it.shown = it.state;
      }
      it.zIndex = this.stack.indexOf(it.index) + 1;
      it.el.style.zIndex = String(it.zIndex);
    }
  }

  /** fixed height: as tall as the tallest item */
  private measureHeight() {
    if (!this.fixedHeight) return;
    if (!this.el.offsetParent) return;
    this.list.style.height = "";
    let max = 0;
    for (const it of this.items) {
      const hidden = it.el.classList.contains("is-hidden");
      it.el.style.overflow = "hidden";
      if (hidden) it.el.classList.remove("is-hidden");
      max = Math.max(max, it.el.offsetHeight);
      if (hidden) it.el.classList.add("is-hidden");
      it.el.style.overflow = "";
    }
    this.maxHeight = max;
    this.list.style.height = max + "px";
  }

  /** variable height: the list grows or shrinks to the new item while the items animate */
  private animateHeight(target: Item | null) {
    const to = target ? target.el.offsetHeight : 0;
    let duration = 0;
    for (const it of this.items) if (it.anim) duration = Math.max(duration, it.anim.duration + it.anim.delay);
    this.heightAnim?.cancel();
    const from = this.list.offsetHeight;
    this.list.style.height = "";
    const a = this.list.animate([{ height: from + "px" }, { height: to + "px" }], { duration: (duration || DURATION.slow) * 1000, easing: `cubic-bezier(${EASE.easeInOut.join(",")})` });
    this.heightAnim = a;
    a.finished.then(() => { if (this.heightAnim === a) this.heightAnim = null; }, () => {});
  }

  private count(previous: number, i: number) {
    const n = this.items.length;
    let s = this.absoluteIndex;
    this.absoluteIndex = i === 0 && previous === n - 1 ? ++s : i === n - 1 && previous === 0 ? --s : (s = Math.floor(s / n) * n + i);
    this.el.style.setProperty("--content-animation-index", String(i));
    this.el.style.setProperty("--content-animation-absolute-index", String(this.absoluteIndex));
    const counter = findElement(this.el, this.el.dataset.contentAnimationCounterSelector ?? ".js-content-animation-counter");
    if (counter) counter.textContent = String(i + 1);
  }
}

/** drops finished animations (the end state is the element's natural state) */
function clearAnimations(el: HTMLElement) {
  for (const a of el.getAnimations({ subtree: true })) a.cancel();
}

export function initContentAnimations(root: HTMLElement): Cleanup {
  const list: ContentAnimation[] = [];
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-plugin~="contentAnimation"]'))) {
    const mq = el.dataset.contentAnimationEnableMq;
    const c = new ContentAnimation(el);
    list.push(c);
    if (!mq || mq === "null" || matches(mq)) c.enable();
  }
  return () => list.forEach((c) => c.destroy());
}
