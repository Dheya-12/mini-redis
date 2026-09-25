import Lenis from "lenis";
import { gsap, ScrollTrigger, runtime, afterIntro, emit, isDesktop, EASE } from "@/lib/motion";

type Cleanup = () => void;
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

/* ------------------------------------------------------------------ smooth scrolling */

export function initSmooth(): Cleanup {
  const lenis = new Lenis({ lerp: 0.13, smoothWheel: true });
  runtime.lenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (t: number) => lenis.raf(t * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
    runtime.lenis = null;
  };
}

export const lockScroll = (on: boolean) => (on ? runtime.lenis?.stop() : runtime.lenis?.start());

/* ------------------------------------------------------------------ header */

const FLIP: Record<string, string> = {};
for (const p of ["text", "bg", "border"]) {
  FLIP[`${p}-warm-black`] = `${p}-warm-white`;
  FLIP[`${p}-warm-white`] = `${p}-warm-black`;
}
const CARD_COLOURS = ["var(--color-blue)", "var(--color-dark-blue)", "var(--color-cream)", "var(--color-gold)", "var(--color-yellow)", "rgb(119, 113, 78)"];
const MENU_ICON = { open: "M8 14h15.5M8 19h15.5", close: "M10.5 10.5l11 11M21.5 10.5l-11 11" };

export function initHeader(): Cleanup {
  const header = $("body > header")!;
  const row = $(".relative.flex.h-11", header)!;
  const overlay = header.firstElementChild as HTMLElement;
  const offs: Cleanup[] = [];

  // London clock in the two number pills
  const [hh, mm] = $$(".number-pill > span", row.firstElementChild!);
  const clock = () => {
    const parts = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/London" }).formatToParts(new Date());
    hh.textContent = parts.find((p) => p.type === "hour")!.value;
    mm.textContent = parts.find((p) => p.type === "minute")!.value;
  };
  clock();
  const timer = window.setInterval(clock, 15000);
  offs.push(() => window.clearInterval(timer));

  // slide in once the intro is out of the way
  gsap.set(header, { yPercent: -120, clearProps: "transform" });
  gsap.set(header, { yPercent: -120 });
  // cleared afterwards: a transformed header would trap its fixed-position menu overlay
  afterIntro(() => gsap.to(header, { yPercent: 0, duration: 0.8, ease: "power3.inOut", clearProps: "transform" }));

  // light / dark scheme depending on what sits under the header
  const flippable = [row, ...$$("*", row)].filter((el) => !el.closest(".left-1\\/2") && [...el.classList].some((c) => FLIP[c]));
  let light = false;
  let menuOpen = false;
  const applyScheme = (on: boolean) => {
    if (on === light) return;
    light = on;
    for (const el of flippable) {
      el.setAttribute("class", [...el.classList].map((c) => FLIP[c] ?? c).join(" "));
    }
  };
  const probeY = 42;
  const updateScheme = () => {
    if (menuOpen) return applyScheme(true);
    const hit = $$("[data-header-scheme='light']").some((el) => {
      const r = el.getBoundingClientRect();
      return r.top <= probeY && r.bottom >= probeY && r.height > 0;
    });
    applyScheme(hit);
  };
  gsap.ticker.add(updateScheme);
  offs.push(() => gsap.ticker.remove(updateScheme));

  // menu panels (desktop pill + mobile pill)
  const panels = $$<HTMLElement>("[data-menu-panel]", header);
  const openMenu = (panel: HTMLElement, open: boolean) => {
    const body = panel.children[1] as HTMLElement;
    const btn = $<HTMLButtonElement>("button[aria-label$='menu']", panel);
    const path = btn?.querySelector("path");
    menuOpen = open;
    panel.dataset.open = open ? "true" : "false";
    btn?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    path?.setAttribute("d", open ? MENU_ICON.close : MENU_ICON.open);
    body.toggleAttribute("inert", !open);
    body.setAttribute("aria-hidden", String(!open));
    lockScroll(open);
    const desktop = isDesktop();
    const from = { w: panel.offsetWidth, h: panel.offsetHeight };
    gsap.killTweensOf([panel, body, overlay]);
    if (open) {
      const w = desktop ? 680 : panel.parentElement!.clientWidth;
      panel.style.width = `${w}px`;
      panel.style.height = "auto";
      const h = panel.offsetHeight;
      gsap.fromTo(panel, { width: from.w, height: from.h }, { width: w, height: h, duration: 0.5, ease: "power3.out", onComplete: () => { panel.style.height = "auto"; } });
      gsap.to(body, { opacity: 1, duration: 0.25, delay: 0.3 });
      gsap.to(overlay, { autoAlpha: 1, duration: 0.3, delay: 0.1 });
    } else {
      gsap.to(body, { opacity: 0, duration: 0.15 });
      gsap.to(panel, { width: desktop ? 172 : panel.parentElement!.clientWidth, height: 44, duration: 0.45, ease: "power3.inOut" });
      gsap.to(overlay, { autoAlpha: 0, duration: 0.3 });
    }
    updateScheme();
  };
  const onMenuClick = (e: Event) => {
    const btn = (e.target as Element).closest("button[aria-label$='menu']");
    if (!btn) return;
    const panel = btn.closest<HTMLElement>("[data-menu-panel]")!;
    openMenu(panel, panel.dataset.open !== "true");
  };
  header.addEventListener("click", onMenuClick);
  const closeAll = () => panels.forEach((p) => p.dataset.open === "true" && openMenu(p, false));
  const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAll();
  overlay.addEventListener("click", closeAll);
  window.addEventListener("keydown", onKey);
  window.addEventListener("tw:navigate", closeAll);
  offs.push(() => {
    header.removeEventListener("click", onMenuClick);
    overlay.removeEventListener("click", closeAll);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("tw:navigate", closeAll);
  });
  overlay.classList.remove("pointer-events-none");
  gsap.set(overlay, { autoAlpha: 0 });

  // "Lately at Thirdway" strip: palette per card, people tickers, auto-drift + drag
  $$<HTMLElement>(".cursor-grab", header).forEach((strip) => {
    const track = strip.firstElementChild as HTMLElement;
    $$<HTMLElement>(":scope > div > span > .group.relative.block", track).forEach((card, i) => (card.style.backgroundColor = CARD_COLOURS[i % CARD_COLOURS.length]));
    $$<HTMLElement>("a.group.relative.block > div.overflow-hidden > div.flex.w-max", track).forEach((row) => {
      if (row.children.length === 1) row.append(row.firstElementChild!.cloneNode(true));
      row.classList.add("animate-ticker", "motion-reduce:animate-none", "hover:[animation-play-state:paused]");
      row.style.animationDuration = "32s";
    });
    const loop = () => (track.firstElementChild as HTMLElement).offsetWidth || 1;
    let x = 0;
    let drag: { start: number; x: number } | null = null;
    const drift = (_t: number, dt: number) => {
      if (!drag) x -= (26.4 * dt) / 1000;
      const w = loop();
      x = ((x % w) - w) % w;
      track.style.transform = `translate(${x}px, 0px)`;
    };
    gsap.ticker.add(drift);
    const down = (e: PointerEvent) => { drag = { start: e.clientX, x }; strip.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => { if (drag) x = drag.x + (e.clientX - drag.start); };
    const up = () => { drag = null; };
    strip.addEventListener("pointerdown", down);
    strip.addEventListener("pointermove", move);
    strip.addEventListener("pointerup", up);
    strip.addEventListener("pointercancel", up);
    offs.push(() => gsap.ticker.remove(drift));
  });

  // current page in the nav
  const markActive = () => {
    const path = location.pathname;
    $$<HTMLAnchorElement>("nav a", header).forEach((a) => {
      const href = a.getAttribute("href") || "";
      a.style.color = href !== "/" && (path === href || path.startsWith(href + "/")) ? "rgb(32 34 26 / 0.4)" : "";
    });
    // the footer's Explore list dims the current page instead
    $$<HTMLAnchorElement>("footer ul a[href^='/']").forEach((a) => a.classList.toggle("opacity-60", a.getAttribute("href") === path));
  };
  markActive();
  window.addEventListener("tw:page-ready", markActive);
  offs.push(() => window.removeEventListener("tw:page-ready", markActive));

  return () => offs.forEach((f) => f());
}

/* ------------------------------------------------------------------ cookie banner + preferences */

const CONSENT_KEY = "cookieConsent";
const storage = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

export function initCookies(): Cleanup {
  const banner = $("[data-cookie-banner]");
  const drawer = $("body > div.fixed.z-\\[1003\\]");
  const panel = drawer?.firstElementChild as HTMLElement | undefined;
  if (!banner) return () => {};
  const setVisible = (on: boolean) => {
    runtime.cookieBannerVisible = on;
    banner.classList.toggle("pointer-events-none", !on);
    gsap.to(banner, { autoAlpha: on ? 1 : 0, duration: 0.3 });
    emit("tw:cookie-banner", on);
  };
  if (!storage.get(CONSENT_KEY)) window.setTimeout(() => setVisible(true), 400);

  const openDrawer = (open: boolean) => {
    if (!drawer || !panel) return;
    drawer.classList.toggle("pointer-events-none", !open);
    panel.classList.toggle("pointer-events-none", !open);
    lockScroll(open);
    gsap.to(drawer, { autoAlpha: open ? 1 : 0, duration: 0.4 });
    gsap.fromTo(panel, { xPercent: open ? 100 : 0 }, { xPercent: open ? 0 : 100, duration: 0.6, ease: EASE.inOutQuart });
  };
  if (drawer) { drawer.classList.remove("invisible", "opacity-0"); gsap.set(drawer, { autoAlpha: 0 }); }

  const decide = (value: string) => { storage.set(CONSENT_KEY, value); setVisible(false); };
  const onBanner = (e: Event) => {
    const b = (e.target as Element).closest("button");
    if (!b) return;
    const label = b.textContent?.trim();
    if (label === "Accept") decide("all");
    else if (label === "Decline") decide("essential");
    else if (label === "Preferences") openDrawer(true);
  };
  const onDrawer = (e: Event) => {
    const t = e.target as Element;
    if (t === drawer) return openDrawer(false);
    const b = t.closest("button");
    if (!b) return;
    if (b.getAttribute("role") === "switch") {
      const on = b.getAttribute("aria-checked") !== "true";
      b.setAttribute("aria-checked", String(on));
      return;
    }
    if (/save and close/i.test(b.textContent || "")) { decide("custom"); return openDrawer(false); }
    if (/close/i.test(b.getAttribute("aria-label") || "")) openDrawer(false);
  };
  banner.addEventListener("click", onBanner);
  drawer?.addEventListener("click", onDrawer);
  return () => {
    banner.removeEventListener("click", onBanner);
    drawer?.removeEventListener("click", onDrawer);
  };
}

/* ------------------------------------------------------------------ contact modal */

export function initContact(): Cleanup {
  const modal = $("body > [data-contact-modal]");
  if (!modal) return () => {};
  const dialog = $("[role=dialog]", modal)!;
  const form = $<HTMLFormElement>("form", modal)!;
  const show = (open: boolean) => {
    modal.setAttribute("aria-hidden", String(!open));
    modal.classList.toggle("pointer-events-none", !open);
    lockScroll(open);
    gsap.to(modal, { autoAlpha: open ? 1 : 0, duration: 0.4 });
    gsap.fromTo(dialog, { y: open ? 24 : 0, opacity: open ? 0 : 1 }, { y: open ? 0 : 24, opacity: open ? 1 : 0, duration: 0.5, ease: "power3.out" });
  };
  const openers = (e: Event) => {
    const t = e.target as Element;
    if (t.closest("[data-menu-keep-open] button, footer [role=button], a[href='#contact']")) { e.preventDefault(); show(true); }
  };
  const inside = (e: Event) => {
    const t = e.target as Element;
    if (t === modal || t.closest("[aria-label='Close contact form']")) show(false);
  };
  const onKey = (e: KeyboardEvent) => e.key === "Escape" && modal.getAttribute("aria-hidden") === "false" && show(false);
  // no backend: validate locally and acknowledge
  const submit = (e: SubmitEvent) => {
    e.preventDefault();
    const fields = $$<HTMLInputElement | HTMLTextAreaElement>("input:not([type=checkbox]), textarea", form);
    let ok = true;
    fields.forEach((f) => { const bad = !f.value.trim(); f.setAttribute("aria-invalid", String(bad)); if (bad) ok = false; });
    const terms = $<HTMLInputElement>("#contact-terms", form);
    if (terms && !terms.checked) { terms.setAttribute("aria-invalid", "true"); ok = false; }
    const send = $$("button[type=submit], button", form).find((b) => /send message/i.test(b.textContent || ""));
    const label = send?.querySelector(".body, span span") ?? send;
    if (ok && label) { label.textContent = "Message sent"; form.reset(); }
  };
  document.addEventListener("click", openers);
  modal.addEventListener("click", inside);
  window.addEventListener("keydown", onKey);
  form.addEventListener("submit", submit);
  return () => {
    document.removeEventListener("click", openers);
    modal.removeEventListener("click", inside);
    window.removeEventListener("keydown", onKey);
    form.removeEventListener("submit", submit);
  };
}

/* ------------------------------------------------------------------ footer "you've scrolled" ruler */

type Fact = { distance: number; text: string; image: string | null; href: string | null };
const PX_PER_CM = 96 / 2.54;

export function initFooter(facts: Fact[]): Cleanup {
  const footer = $("footer#footer");
  if (!footer) return () => {};
  const rulers = $$<HTMLElement>(".w-\\[9\\.32px\\]", footer);
  let total = 0;
  let lastY = window.scrollY;
  let shown = "";
  const render = () => {
    const y = window.scrollY;
    total += Math.abs(y - lastY);
    lastY = y;
    const cm = total / PX_PER_CM;
    const label = cm < 100 ? `${Math.round(cm)}cm` : `${Math.floor(cm / 100)}m`;
    const max = document.documentElement.scrollHeight - innerHeight;
    const pct = max > 0 ? 50 * Math.pow(Math.min(1, y / max), 1.9) : 0;
    const fact = [...facts].reverse().find((f) => cm / 100 >= f.distance) ?? null;
    for (const r of rulers) {
      const fill = r.children[1] as HTMLElement;
      const tag = r.children[2] as HTMLElement;
      if (fill) fill.style.height = `calc(${pct}% + 1px)`;
      if (tag) tag.style.top = `${pct}%`;
    }
    const key = label + "|" + (fact?.distance ?? "");
    if (key === shown) return;
    shown = key;
    for (const r of rulers) {
      $$<HTMLElement>(".flex.w-56", r).forEach((box) => {
        const p = box.firstElementChild as HTMLElement;
        p.textContent = `You’ve scrolled ${label}`;
        box.querySelector(".fact")?.remove();
        const row = box.parentElement!;
        row.querySelector(":scope > .fact-thumb")?.remove();
        if (!fact) return;
        const [pre, link, post] = fact.text.split(/\[|\]/);
        const wrap = document.createElement("div");
        wrap.className = "fact transition-opacity duration-250 opacity-100";
        const para = document.createElement("p");
        para.className = "small-text";
        const a = document.createElement("a");
        a.className = "pointer-events-auto link-line-reverse";
        a.href = fact.href ?? "#";
        a.textContent = link ?? "";
        para.append(pre ?? "", a, post ?? "");
        wrap.append(para);
        box.append(wrap);
        if (fact.image && row.classList.contains("items-center")) {
          const thumb = document.createElement("span");
          thumb.className = "fact-thumb relative block h-[68px] w-[98px] shrink-0 overflow-hidden rounded-[2px]";
          thumb.innerHTML = `<picture class="size-full object-cover site-image normal"><img alt="" src="${fact.image}" style="aspect-ratio:196/130;width:100%;max-width:196px;height:auto"></picture>`;
          row.prepend(thumb);
        }
      });
    }
  };
  gsap.ticker.add(render);
  return () => gsap.ticker.remove(render);
}

/* ------------------------------------------------------------------ page transitions */

export function initTransitions(navigate: (href: string) => void): Cleanup {
  const curtain = $("body > div.fixed.z-\\[9999\\]");
  let busy = false;
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest<HTMLAnchorElement>("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname) {
      if (url.hash) return;
      e.preventDefault();
      runtime.lenis?.scrollTo(0);
      return;
    }
    e.preventDefault();
    if (busy) return;
    busy = true;
    emit("tw:navigate");
    if (!curtain) { navigate(url.pathname + url.search + url.hash); busy = false; return; }
    curtain.classList.remove("invisible");
    gsap.fromTo(curtain, { yPercent: 100 }, {
      yPercent: 0, duration: 0.7, ease: EASE.inOutQuart,
      onComplete: () => {
        const done = () => {
          window.removeEventListener("tw:page-ready", done);
          runtime.lenis?.scrollTo(0, { immediate: true, force: true });
          gsap.to(curtain, { yPercent: -100, duration: 0.7, ease: EASE.inOutQuart, delay: 0.1, onComplete: () => { curtain.classList.add("invisible"); busy = false; } });
        };
        window.addEventListener("tw:page-ready", done);
        navigate(url.pathname + url.search + url.hash);
      },
    });
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}
