/**
 * Page changes (the original's ajax page transitions, rebuilt on the Next.js router).
 *
 * Links to the site's other pages are followed without a full reload:
 * - "loader" (the default): the preloader screen fades in over the page; the next page is swapped in at the top, its
 *   first screens' media load, and 150 ms later the screen fades out as the page's content reveals itself
 *   (behaviours/preloader.ts finishes the change). On phones the media wait is skipped.
 * - "tabs" (`data-ajax-page-transition="tabs"`, the policy tabs): the next page fades in where the page was scrolled.
 * Pages are prefetched when a link is hovered or touched. Links to sections of the current page, modals, other sites,
 * new windows and downloads are left alone; so are links marked `data-ajax-page-ignore`.
 */
import type { Cleanup } from "@/lib/runtime";
import { state } from "@/lib/runtime";
import { transition, stopTransition } from "./transition";

type Router = { push: (href: string, options?: { scroll?: boolean }) => void; prefetch: (href: string) => void };

const path = (p: string) => p.replace(/\/+$/, "") || "/";

/** the site route a link leads to, if it should be followed with a page transition */
function internalTarget(a: HTMLAnchorElement, routes: Set<string>): URL | null {
  const href = a.getAttribute("href");
  if (!href || href.startsWith("#") || a.target === "_blank" || a.hasAttribute("download")) return null;
  const ignore = a.getAttribute("data-ajax-page-ignore");
  if (ignore !== null && ignore !== "false") return null;
  let url: URL;
  try { url = new URL(href, location.href); } catch { return null; }
  if (url.origin !== location.origin || !routes.has(path(url.pathname))) return null;
  return url;
}

export function initPageTransitions(router: Router, routeList: string[]): Cleanup {
  const routes = new Set(routeList.map(path));
  const preloader = () => document.querySelector<HTMLElement>(".js-preloader");

  const go = (url: URL, kind: "loader" | "tabs") => {
    const href = url.pathname + url.search + url.hash;
    state.navigation = { kind, route: path(url.pathname) };
    if (kind === "tabs") { router.push(href, { scroll: false }); return; }
    const screen = preloader();
    if (!screen) { router.push(href, { scroll: false }); return; }
    stopTransition(screen);
    screen.setAttribute("aria-hidden", "false");
    transition(screen, "fade-in").then(() => router.push(href, { scroll: false }));
  };

  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
    if (!a) return;
    const url = internalTarget(a, routes);
    if (!url) return;
    e.preventDefault();
    // the same page: nothing to change (a section in it is handled by the in-page links)
    if (path(url.pathname) === path(location.pathname)) return;
    if (state.navigation) return;
    go(url, a.getAttribute("data-ajax-page-transition") === "tabs" ? "tabs" : "loader");
  };
  const prefetched = new Set<string>();
  const onHover = (e: Event) => {
    const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>("a[href]");
    const url = a ? internalTarget(a, routes) : null;
    if (!url || path(url.pathname) === path(location.pathname) || prefetched.has(url.pathname)) return;
    prefetched.add(url.pathname);
    router.prefetch(url.pathname);
  };
  // back / forward: the router swaps the page at once; the screen covers it until the page is ready
  const onPop = () => {
    const screen = preloader();
    state.navigation = { kind: "loader", route: path(location.pathname) };
    if (screen) { stopTransition(screen); screen.classList.remove("is-hidden", "is-invisible"); screen.setAttribute("aria-hidden", "false"); }
  };
  document.addEventListener("click", onClick);
  document.addEventListener("mouseover", onHover, { passive: true });
  document.addEventListener("touchstart", onHover, { passive: true });
  window.addEventListener("popstate", onPop);
  return () => {
    document.removeEventListener("click", onClick);
    document.removeEventListener("mouseover", onHover);
    document.removeEventListener("touchstart", onHover);
    window.removeEventListener("popstate", onPop);
  };
}

/** the arriving page is ready (its first media are in): end the page change */
export function finishPageTransition() {
  const nav = state.navigation;
  state.navigation = null;
  if (!nav || nav.kind !== "loader") return;
  const screen = document.querySelector<HTMLElement>(".js-preloader");
  if (!screen) return;
  window.setTimeout(() => {
    screen.setAttribute("aria-hidden", "true");
    transition(screen, "fade-out");
  }, 150);
}

/** the policy tabs: a sideways-scrolling row that opens with the current tab in the middle of the screen */
export function initTabs(root: ParentNode): Cleanup {
  root.querySelectorAll<HTMLElement>('[data-plugin~="navigation"]').forEach((row) => {
    const active = row.querySelector<HTMLElement>("a.is-active");
    if (!active) return;
    const r = active.getBoundingClientRect();
    row.scrollLeft = r.left + window.scrollX - window.innerWidth / 2 + r.width / 2;
  });
  return () => {};
}
