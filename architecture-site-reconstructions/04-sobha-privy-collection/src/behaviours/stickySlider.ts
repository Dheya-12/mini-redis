/**
 * Horizontal sticky slider (`data-plugin~="stickySlider"`, desktop only by default).
 *
 * The slider's frame is a native sticky layer one screen high; the section is made as tall as the content overflows
 * sideways plus one screen, so scrolling down moves the content left pixel for pixel. Elements inside it measure their
 * scroll-linked effects across the slider (see parallax/engine.ts).
 */
import { matches, onChange } from "@/lib/mq";
import { addLayout, scheduleLayout } from "@/lib/layout";
import { pageOffset } from "./parallax/engine";
import { showImages } from "./appear";
import { emit, type Cleanup } from "@/lib/runtime";

class StickySlider {
  enabled = false;
  private content: HTMLElement;
  private constraints = { from: 0, to: 0, maxScroll: 0 };
  private height = 0;
  position = 0;
  private io: IntersectionObserver;

  constructor(readonly el: HTMLElement, private mq: string) {
    const content = el.querySelector<HTMLElement>("[data-sticky-slider-content]");
    if (!content) throw new Error("sticky slider content `[data-sticky-slider-content]` not found");
    this.content = content;
    // the slider's images are off to the side: load them all as soon as it comes into view
    this.io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { showImages(el); this.io.disconnect(); } });
    this.io.observe(el);
  }

  sync() {
    const on = matches(this.mq);
    if (on === this.enabled) return;
    this.enabled = on;
    if (on) this.content.setAttribute("data-sticky-slider-content-ready", "");
    else {
      this.content.removeAttribute("data-sticky-slider-content-ready");
      this.content.style.transform = "";
      this.el.style.minHeight = "";
      this.el.style.removeProperty("--sticky-full-height");
      this.height = 0;
    }
    scheduleLayout();
  }

  reset() { if (this.enabled) this.content.style.transform = ""; }

  measure() {
    if (!this.enabled) return;
    const top = pageOffset(this.el).top;
    const h = this.el.offsetHeight;
    const distance = Math.max(0, h - window.innerHeight);
    const contentHeight = this.content.offsetHeight;
    const view = Math.min(window.innerWidth, this.content.offsetWidth);
    this.constraints = {
      from: top,
      to: top + distance + (contentHeight ? window.innerHeight - contentHeight : 0),
      maxScroll: Math.max(0, this.content.scrollWidth - view),
    };
  }

  apply() {
    if (!this.enabled) return;
    const h = this.constraints.maxScroll + window.innerHeight;
    if (h !== this.height) {
      this.height = h;
      this.el.style.minHeight = h + "px";
      this.el.style.setProperty("--sticky-full-height", h + "px");
      // the page got taller or shorter: everything else measures again
      scheduleLayout();
    }
  }

  update(scroll: number) {
    if (!this.enabled) return;
    const c = this.constraints;
    const p = c.to > c.from ? Math.max(0, Math.min(1, (scroll - c.from) / (c.to - c.from))) : 0;
    this.position = p;
    const offset = -p * c.maxScroll;
    this.content.style.transform = `translateX(${offset}px)`;
    emit("sticky-slider:move", { el: this.el, position: p, offset });
  }

  destroy() { this.io.disconnect(); this.content.removeAttribute("data-sticky-slider-content-ready"); this.content.style.transform = ""; this.el.style.minHeight = ""; }
}

export function initStickySliders(root: HTMLElement, getScroll: () => number) {
  const sliders = Array.from(root.querySelectorAll<HTMLElement>('[data-plugin~="stickySlider"]')).map((el) => new StickySlider(el, el.dataset.stickySliderEnableMq ?? "md-up"));
  const offs: Cleanup[] = [];
  for (const s of sliders) {
    s.sync();
    offs.push(onChange(s.el.dataset.stickySliderEnableMq ?? "md-up", () => s.sync()));
  }
  // measured before the parallax (it reads the slider's content position), applied after it
  offs.push(addLayout("reset", () => sliders.forEach((s) => s.reset())));
  offs.push(addLayout("measure", () => sliders.forEach((s) => s.measure())));
  offs.push(addLayout("apply", () => sliders.forEach((s) => { s.apply(); s.update(getScroll()); })));
  return {
    update: () => { const y = getScroll(); sliders.forEach((s) => s.update(y)); },
    destroy: () => { offs.forEach((f) => f()); sliders.forEach((s) => s.destroy()); },
  };
}
