import Swiper from "swiper";
import { Navigation } from "swiper/modules";

/**
 * Every carousel on the site is a Swiper with prev/next buttons named after it
 * (e.g. .cards-teams-swiper + .cards-teams-swiper-prev). Slide geometry was measured on the
 * live site at 390 / 1024 / 1440px and expressed as slidesPerView + spaceBetween.
 */
type Geometry = { mobile: [number, number]; desktop?: [number, number] };

const GEOMETRY: Record<string, Geometry> = {
  "cards-teams-swiper": { mobile: [8 / 7, 12], desktop: [4, 16] },
  "values-swiper": { mobile: [8 / 7, 12], desktop: [4, 16] },
  "image-blocks-swiper": { mobile: [8 / 7, 12], desktop: [24 / 7, 16] },
  "project-image-carousel-swiper": { mobile: [1, 0], desktop: [1.194, 16] },
  "project-related-projects-swiper": { mobile: [4 / 3, 12], desktop: [1.5, 16] },
  "related-projects-block-swiper": { mobile: [4 / 3, 12], desktop: [1.5, 16] },
  "people-projects-swiper": { mobile: [4 / 3, 12], desktop: [1.5, 16] },
};

const NAV_ALIASES: Record<string, string> = {
  "project-related-projects-swiper": "projects-related-projects-swiper",
  "related-projects-block-swiper": "related-projects-swiper",
  "image-blocks-swiper": "image-cards-swiper",
};

function geometryFor(el: HTMLElement): { key: string | null; g: Geometry } {
  const key = Object.keys(GEOMETRY).find((k) => el.classList.contains(k)) ?? null;
  if (key) return { key, g: GEOMETRY[key] };
  // unnamed swipers: journal teasers (home / vision) and "more from the journal" on articles
  const inBlock = !!el.closest(".block-padding");
  return { key: null, g: { mobile: [inBlock ? 1.15 : 1.1, 12], desktop: [3, 16] } };
}

export function initCarousels(root: HTMLElement) {
  const swipers: Swiper[] = [];
  root.querySelectorAll<HTMLElement>(".swiper").forEach((el) => {
    const { key, g } = geometryFor(el);
    const navKey = key ? NAV_ALIASES[key] ?? key : null;
    const prevSel = navKey ? `.${navKey}-prev, .swiper-button-prev` : "[aria-label=Previous]";
    const nextSel = navKey ? `.${navKey}-next, .swiper-button-next` : "[aria-label=Next]";
    // the closest ancestor that also holds this carousel's buttons
    let scope: HTMLElement | null = el.parentElement;
    while (scope && scope !== root && !scope.querySelector(prevSel)) scope = scope.parentElement;
    scope ??= root;
    const prev = scope.querySelectorAll<HTMLElement>(prevSel);
    const next = scope.querySelectorAll<HTMLElement>(nextSel);
    const desktop = g.desktop ?? g.mobile;
    const s = new Swiper(el, {
      modules: [Navigation],
      slidesPerView: g.mobile[0],
      spaceBetween: g.mobile[1],
      speed: 600,
      watchOverflow: true,
      breakpoints: { 1024: { slidesPerView: desktop[0], spaceBetween: desktop[1] } },
      // Swiper accepts element arrays here (desktop + mobile button pairs) although its types say single
      navigation: prev.length && next.length ? { prevEl: [...prev] as unknown as HTMLElement, nextEl: [...next] as unknown as HTMLElement, addIcons: false } : false,
    });
    swipers.push(s);
  });
  return () => swipers.forEach((s) => s.destroy(true, true));
}
