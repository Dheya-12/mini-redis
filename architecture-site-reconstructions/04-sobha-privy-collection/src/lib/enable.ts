/**
 * When a behaviour is switched on (the original's plugin conditions): at a named breakpoint (`enableMq`, null for
 * always), on pointer devices with hover and/or on touch devices, and optionally only while its element is on screen.
 * `enable` / `disable` run on every change of the outcome; the cleanup disables it.
 */
import { matches, onChange } from "./mq";
import type { Cleanup } from "./runtime";

export type EnableOptions = { enableMq?: string | null; enableHover?: boolean; enableTouch?: boolean; enableOnlyInView?: boolean };

export function whenEnabled(el: Element, o: EnableOptions, hooks: { enable: () => void; disable: () => void }): Cleanup {
  let enabled = false;
  let inView = !o.enableOnlyInView;
  const check = () => {
    const hover = document.documentElement.classList.contains("has-hover");
    const want = matches(o.enableMq ?? null) && (hover ? o.enableHover !== false : o.enableTouch !== false) && inView;
    if (want === enabled) return;
    enabled = want;
    if (want) hooks.enable(); else hooks.disable();
  };
  const offMq = onChange(o.enableMq ?? null, check);
  let io: IntersectionObserver | null = null;
  if (o.enableOnlyInView) {
    io = new IntersectionObserver((entries) => { inView = entries[entries.length - 1].isIntersecting; check(); });
    io.observe(el);
  }
  check();
  return () => {
    offMq();
    io?.disconnect();
    if (enabled) { enabled = false; hooks.disable(); }
  };
}

/** reads `data-<prefix>-*` attributes as options (`data-modal-html-scroll-class-name` → htmlScrollClassName) */
export function dataOptions(el: HTMLElement, prefix: string): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  const head = "data-" + prefix + "-";
  for (const a of Array.from(el.attributes)) {
    if (!a.name.startsWith(head)) continue;
    const key = a.name.slice(head.length).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    const v = a.value;
    out[key] = v === "true" ? true : v === "false" ? false : v === "null" ? null : v !== "" && !isNaN(Number(v)) ? Number(v) : v;
  }
  return out;
}
