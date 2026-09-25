/**
 * The locations map and its cards.
 *
 * - mobileScrollable (phones): a row of cards scrolled sideways. The card nearest the scroll position becomes the
 *   current one (`mobilescrollable:change`); tapping a map pin scrolls its card to the centre.
 * - mapActivePin: the pin of the current card is highlighted — following the cards on phones (and the map shifts to
 *   frame it, `is-slide-N`), following the sticky card's content on larger screens.
 * - mapCardToggle: a phone card's round button expands or collapses its description.
 */
import type { Cleanup } from "@/lib/runtime";
import { whenEnabled, dataOptions } from "@/lib/enable";

const CHANGE = "mobilescrollable:change";
type Change = { index: number; count: number };

/** a control that is a link without an address answers Enter like a button */
const onActivate = (el: HTMLElement, selector: string, fn: (hit: HTMLElement, e: Event) => void): Cleanup => {
  const click = (e: MouseEvent) => { const hit = (e.target as Element | null)?.closest<HTMLElement>(selector); if (hit && el.contains(hit)) fn(hit, e); };
  const key = (e: KeyboardEvent) => { if (e.key !== "Enter") return; const hit = (e.target as Element | null)?.closest<HTMLElement>(selector); if (hit && el.contains(hit)) { e.preventDefault(); fn(hit, e); } };
  el.addEventListener("click", click);
  el.addEventListener("keydown", key);
  return () => { el.removeEventListener("click", click); el.removeEventListener("keydown", key); };
};

function mobileScrollable(container: HTMLElement): Cleanup {
  const list = container.matches(".mobile-scrollable") ? container : container.querySelector<HTMLElement>(".mobile-scrollable");
  if (!list) return () => {};
  const items = Array.from(container.querySelectorAll<HTMLElement>(".mobile-scrollable__item"));
  const counter = container.querySelector<HTMLElement>(".js-mobile-scrollable-counter");
  const next = container.querySelector<HTMLElement>(".js-mobile-scrollable-next");
  const prev = container.querySelector<HTMLElement>(".js-mobile-scrollable-prev");
  const links = Array.from(container.querySelectorAll<HTMLElement>(".js-mobile-scrollable-link"));
  let index = 0;
  let programmatic = false;
  let saved: { role: string | null; items: { el: HTMLElement; ariaHidden: boolean; hidden: boolean; active: boolean; role: string | null }[] } | null = null;

  const emit = () => container.dispatchEvent(new CustomEvent<Change>(CHANGE, { detail: { index, count: items.length } }));
  const setCounter = (i: number) => {
    if (counter) counter.textContent = String(i + 1);
    items.forEach((it, k) => it.classList.toggle("is-active", k === i));
  };
  const navigation = () => { prev?.classList.toggle("is-disabled", index === 0); next?.classList.toggle("is-disabled", index === items.length - 1); };
  const change = () => { emit(); navigation(); };
  const open = (i: number) => {
    if (index === i || !items[i]) return;
    index = i;
    programmatic = true;
    setCounter(i);
    change();
    items[i].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };
  const onScroll = () => {
    if (programmatic) return;
    const max = list.scrollWidth - list.offsetWidth;
    const i = max ? Math.round((list.scrollLeft / max) * (items.length - 1)) : 0;
    if (i !== index) { index = i; setCounter(i); change(); }
  };
  const onTouch = () => { programmatic = false; };
  const offs: Cleanup[] = [];
  return whenEnabled(container, { enableMq: "sm-down" }, {
    enable: () => {
      list.addEventListener("scroll", onScroll, { passive: true });
      list.addEventListener("touchstart", onTouch, { passive: true });
      if (next) offs.push(onActivate(next, "*", () => open((index + 1) % items.length)));
      if (prev) offs.push(onActivate(prev, "*", () => open((index - 1 + items.length) % items.length)));
      offs.push(onActivate(container, ".js-mobile-scrollable-link", (hit) => open(links.indexOf(hit))));
      navigation();
      // the cards are a plain scrolling row here: drop the tab semantics the markup carries for larger screens
      saved = {
        role: list.getAttribute("role"),
        items: items.map((el) => ({ el, ariaHidden: el.getAttribute("aria-hidden") === "true", hidden: el.classList.contains("is-hidden"), active: el.classList.contains("is-active"), role: el.getAttribute("role") })),
      };
      list.removeAttribute("role");
      items.forEach((el) => { el.removeAttribute("aria-hidden"); el.removeAttribute("role"); el.classList.remove("is-active", "is-hidden"); });
    },
    disable: () => {
      list.removeEventListener("scroll", onScroll);
      list.removeEventListener("touchstart", onTouch);
      offs.splice(0).forEach((f) => f());
      items.forEach((el) => el.classList.remove("is-active"));
      if (saved) {
        if (saved.role) list.setAttribute("role", saved.role);
        for (const s of saved.items) {
          if (s.ariaHidden) s.el.setAttribute("aria-hidden", "true");
          if (s.active) s.el.classList.add("is-active");
          if (s.hidden) s.el.classList.add("is-hidden");
          if (s.role) s.el.setAttribute("role", s.role);
        }
        saved = null;
      }
    },
  });
}

function mapActivePin(el: HTMLElement): Cleanup {
  const o = dataOptions(el, "map-active-pin") as { enableMq?: string | null };
  const pins = () => Array.from(document.querySelectorAll<HTMLElement>(".js-map-active-pin"));
  const activate = (n: number) => pins().forEach((p, k) => p.classList.toggle("is-active", k === n));
  const onContent = (e: Event) => {
    const d = (e as CustomEvent<{ index: number; source: Element }>).detail;
    if (d.source === el) activate(d.index);
  };
  const onCards = (e: Event) => {
    const n = (e as CustomEvent<Change>).detail.index;
    activate(n);
    const inner = document.querySelector<HTMLElement>(".js-location-map-inner");
    if (inner) {
      inner.classList.remove(...Array.from(inner.classList).filter((c) => /^is-slide-\d+$/.test(c)));
      inner.classList.add(`is-slide-${n + 1}`);
    }
  };
  return whenEnabled(el, { enableMq: o.enableMq ?? null }, {
    enable: () => { el.addEventListener("contentanimation:open", onContent); el.addEventListener(CHANGE, onCards); },
    disable: () => { el.removeEventListener("contentanimation:open", onContent); el.removeEventListener(CHANGE, onCards); },
  });
}

const mapCardToggle = (card: HTMLElement): Cleanup => onActivate(card, ".btn--square", () => card.classList.toggle("l-location-mobile-card--expanded"));

export function initMap(root: ParentNode): Cleanup {
  const all = (p: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-plugin~="${p}"]`));
  const offs = [...all("mobileScrollable").map(mobileScrollable), ...all("mapActivePin").map(mapActivePin), ...all("mapCardToggle").map(mapCardToggle)];
  return () => offs.forEach((f) => f());
}
