/**
 * Pointer followers (pointer devices only).
 *
 * - cursor: in the quotes, a round progress badge trails the pointer (25 % per frame when the normal cursor stays
 *   visible, 50 % when it replaces it). It fades in while the pointer is over its area and out when it leaves, and
 *   flips sides (`cursor--left` / `cursor--right`) at the middle of the area.
 * - maskText: the footer's masked line reveals a circle of text around the pointer (`--x`, `--y`; 25 % per frame).
 */
import type { Cleanup } from "@/lib/runtime";
import { whenEnabled, dataOptions } from "@/lib/enable";
import { Follower } from "@/lib/follow";
import { pageOffset } from "./parallax/engine";
import { transition, stopTransition } from "./transition";

type Box = { top: number; left: number; width: number; height: number };

function cursor(container: HTMLElement): Cleanup {
  const o = { showDefaultCursor: false, isHideable: true, ...(dataOptions(container, "cursor") as { showDefaultCursor?: boolean; isHideable?: boolean }) };
  const target = container.querySelector<HTMLElement>(".js-cursor-target-container") ?? container;
  const button = container.querySelector<HTMLElement>(".js-cursor-button");
  if (!button) return () => {};
  const spots = Array.from(container.querySelectorAll<HTMLElement>(".js-cursor-hidden-spot"));
  const mouse = { x: 0, y: 0 };
  let area: Box = { top: 0, left: 0, width: 0, height: 0 };
  let hidden: Box[] = [];
  let width = 0;
  let visible = false;
  let right = false;
  let enabled = false;

  /** how far the area has moved on screen since it was measured (scrolling, sticking) */
  const shift = () => {
    const r = target.getBoundingClientRect();
    return { x: area.left - r.left, y: area.top - r.top };
  };
  const render = (c: { x: number; y: number }) => {
    const s = shift();
    const x = c.x + s.x, y = c.y + s.y;
    button.style.transform = `translate(${x}px, ${y}px)`;
    const r = x > width / 2;
    if (r !== right) {
      right = r;
      button.classList.toggle("cursor--left", !r);
      button.classList.toggle("cursor--right", r);
    }
  };
  const follower = new Follower({ x: 0, y: 0 }, o.showDefaultCursor ? 0.25 : 0.5, render);

  const show = () => {
    if (visible) return;
    visible = true;
    if (!o.isHideable) return;
    stopTransition(button);
    transition(button, "fade-in");
    if (!o.showDefaultCursor) target.style.cursor = "none";
  };
  const hide = () => {
    if (!visible) return;
    visible = false;
    if (!o.isHideable) return;
    stopTransition(button);
    transition(button, "fade-out", { after: (el) => { el.classList.remove("is-hidden"); el.classList.add("is-invisible"); } });
    container.style.cursor = "";
  };
  const within = (b: Box, s: { x: number; y: number }, inclusive: boolean) => {
    const top = Math.floor(b.top - s.y), bottom = Math.ceil(top + b.height);
    const left = Math.floor(b.left - s.x), rgt = Math.ceil(left + b.width);
    return mouse.y >= top && (inclusive ? mouse.y <= bottom : mouse.y < bottom) && mouse.x >= left && (inclusive ? mouse.x <= rgt : mouse.x < rgt);
  };
  const check = () => {
    const s = shift();
    const inside = within(area, s, false);
    const inSpot = hidden.some((b) => within(b, s, true));
    if (!inside || inSpot) hide(); else show();
  };
  const follow = () => follower.set({ x: mouse.x - area.left, y: mouse.y - area.top });
  const measure = () => {
    button.style.transform = "";
    const box = (el: Element): Box => { const p = pageOffset(el); return { top: p.top - window.scrollY, left: p.left - window.scrollX, width: p.width, height: p.height }; };
    area = box(target);
    width = pageOffset(container).width;
    hidden = spots.map(box);
    follow();
    check();
    render(follower.get());
  };
  const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; if (enabled) { check(); follow(); } };
  const onScroll = () => { check(); render(follower.get()); };
  window.addEventListener("mousemove", onMove);
  const off = whenEnabled(container, { enableTouch: false, enableOnlyInView: true }, {
    enable: () => {
      enabled = true;
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", measure);
      document.addEventListener("mouseleave", hide);
      if (o.isHideable) button.classList.add("is-invisible");
      if (!o.showDefaultCursor) target.style.cursor = "none";
      measure();
    },
    disable: () => {
      enabled = false;
      visible = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      document.removeEventListener("mouseleave", hide);
      container.style.cursor = "";
      follower.jump({ x: 0, y: 0 });
    },
  });
  return () => { off(); follower.stop(); window.removeEventListener("mousemove", onMove); };
}

function maskText(el: HTMLElement): Cleanup {
  const follower = new Follower({ x: 0, y: 0 }, 0.25, (c) => { el.style.setProperty("--x", String(c.x)); el.style.setProperty("--y", String(c.y)); });
  const onMove = (e: MouseEvent) => {
    const r = el.getBoundingClientRect();
    follower.set({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const off = whenEnabled(el, { enableMq: "md-up" }, {
    enable: () => window.addEventListener("mousemove", onMove),
    disable: () => window.removeEventListener("mousemove", onMove),
  });
  return () => { off(); follower.stop(); };
}

export function initPointerFollowers(root: ParentNode): Cleanup {
  const offs = [
    ...Array.from(root.querySelectorAll<HTMLElement>('[data-plugin~="cursor"]')).map(cursor),
    ...Array.from(root.querySelectorAll<HTMLElement>('[data-plugin~="maskText"]')).map(maskText),
  ];
  return () => offs.forEach((f) => f());
}
