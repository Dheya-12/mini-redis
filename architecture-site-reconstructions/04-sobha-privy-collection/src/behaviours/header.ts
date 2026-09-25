/**
 * Header: colour theme, top state, hiding.
 *
 * - themed: every section names its theme (`data-themed-class="ui-light"`); the header takes the theme of the section
 *   under its vertical centre. Overlapping sections resolve by z-index; sections inside an open modal take over.
 * - topHeader: `header--top` while the page is within 10 px of the top (the full logo; further down, the monogram).
 * - hideHeader: while an element marked `data-plugin~="hideHeader"` covers the top of the viewport, the header hides.
 */
import { addLayout } from "@/lib/layout";
import { pageOffset } from "./parallax/engine";
import type { Cleanup } from "@/lib/runtime";

const uiClasses = (el: Element) => Array.from(el.classList).filter((c) => c.startsWith("ui-"));
function setUi(el: Element, theme: string) {
  el.classList.remove(...uiClasses(el));
  el.classList.add(...theme.split(/\s+/).filter(Boolean));
}

const firstValue = (el: Element, prop: string) => parseFloat(getComputedStyle(el).getPropertyValue(prop).trim().split(/\s+/)[0]) || 0;

type Range = { section: HTMLElement; from: number; to: number; theme: string; disabled: boolean; group: string | null };

export function initHeader(root: HTMLElement, getScroll: () => number): { update: () => void; destroy: Cleanup } {
  const header = root.querySelector<HTMLElement>("header.header");
  if (!header) return { update: () => {}, destroy: () => {} };
  const offs: Cleanup[] = [];

  // ---- topHeader
  const top = () => header.classList.toggle("header--top", getScroll() <= 10);

  // ---- themed
  const measureEl = header.querySelector<HTMLElement>(".js-themed-measure") ?? header;
  let ranges: Range[] = [];
  let measureOffset = 0;
  let theme = uiClasses(header).join(" ");
  const themeOf = (s: HTMLElement) => {
    const a = s.getAttribute("data-themed-class");
    return a ? a : uiClasses(s).filter((c) => c !== "ui-background").join(" ");
  };
  const measureFixed = () => {
    for (let p: HTMLElement | null = measureEl; p; p = p.parentElement) {
      if (p.classList.contains("page-content-wrapper")) return false;
      if (getComputedStyle(p).position === "fixed") return true;
    }
    return false;
  };
  const updateMeasure = () => { const r = measureEl.getBoundingClientRect(); measureOffset = Math.max(0, r.top) + r.height / 2; };
  const measure = () => {
    const groups = new Map<string | null, Range[]>();
    for (const s of Array.from(document.querySelectorAll<HTMLElement>("[data-themed-class]"))) {
      if (!s.offsetParent) continue;
      const modal = s.closest(".modal");
      if (modal?.classList.contains("modal--animating-out")) continue;
      const o = pageOffset(s);
      const r: Range = {
        section: s,
        from: o.scrollTop + Math.max(0, firstValue(s, "scroll-padding-top")) - firstValue(s, "scroll-margin-top"),
        to: o.scrollTop + o.height,
        theme: themeOf(s),
        disabled: s.dataset.themeDisabled === "true",
        group: modal ? modal.id || "modal" : null,
      };
      const list = groups.get(r.group) ?? [];
      const prev = list[list.length - 1];
      if (prev && prev.to > r.from) {
        const z = (x: HTMLElement) => parseInt(x.dataset.zIndex ?? "", 10) || parseInt(getComputedStyle(x).zIndex, 10) || 0;
        if (z(prev.section) > z(r.section)) r.from = prev.to; else prev.to = r.from;
      }
      list.push(r);
      groups.set(r.group, list);
    }
    const all = Array.from(groups.values());
    ranges = all.findLast((l) => !!l[0].group) ?? all[0] ?? [];
    if (ranges.length) { ranges[0].from = 0; ranges[ranges.length - 1].to = 99999; }
    if (fixed) updateMeasure();
    themeUpdate();
  };
  let fixed = false;
  const themeUpdate = () => {
    if (!fixed) updateMeasure();
    const y = getScroll();
    for (const r of ranges) {
      if (y >= r.from - measureOffset && y < r.to - measureOffset) {
        if (r.disabled) header.classList.add("is-invisible");
        else {
          header.classList.remove("is-invisible");
          if (theme !== r.theme) { setUi(header, r.theme); theme = r.theme; }
        }
        break;
      }
    }
  };
  fixed = measureFixed();
  offs.push(addLayout("measure", measure));
  const onModal = () => requestAnimationFrame(measure);
  document.addEventListener("modal:open", onModal);
  document.addEventListener("modal:close", onModal);
  offs.push(() => { document.removeEventListener("modal:open", onModal); document.removeEventListener("modal:close", onModal); });

  // ---- hideHeader
  let hideCount = 0;
  const hiders = Array.from(document.querySelectorAll<HTMLElement>('[data-plugin~="hideHeader"]'));
  const hidden = new Set<Element>();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && !hidden.has(e.target)) { hidden.add(e.target); hideCount++; }
      else if (!e.isIntersecting && hidden.has(e.target)) { hidden.delete(e.target); hideCount--; }
    }
    header.classList.toggle("header--hidden", hideCount > 0);
  }, { rootMargin: "0px 0px -100% 0px" });
  hiders.forEach((h) => io.observe(h));
  offs.push(() => io.disconnect());

  measure();
  top();
  return { update: () => { top(); themeUpdate(); }, destroy: () => offs.forEach((f) => f()) };
}
