import { gsap, isDesktop } from "@/lib/motion";
import { lockScroll } from "./chrome";

type Cleanup = () => void;

/**
 * Project "Deep Dive" popup, as measured on the original:
 *  - the card is shown once the project hero has scrolled away and hidden again when the related projects are
 *    about to enter the viewport; it rises 20px and fades in over 0.3s,
 *  - the card opens the article dialog (overlay fades in, the dialog scales from 0.95), scrolling stops while it
 *    is open; the close button, the backdrop and Escape close it.
 */
export function initDeepDive(main: HTMLElement): Cleanup {
  const aside = main.querySelector<HTMLElement>("aside.project-behind-the-build-popup");
  if (!aside) return () => {};
  // the dialog is portalled into <body> after hydration, so look it up when it is needed
  const find = () => {
    const dialog = [...document.querySelectorAll<HTMLElement>("[role=dialog]")].find((d) => d.getAttribute("aria-label") === "Deep Dive");
    return dialog?.parentElement ? { dialog, overlay: dialog.parentElement } : null;
  };
  const hero = main.firstElementChild as HTMLElement | null;
  const end = main.querySelector<HTMLElement>(".project-related-projects") ?? document.querySelector<HTMLElement>("footer");

  gsap.set(aside, { autoAlpha: 0, y: 20 });
  let shown = false;
  const update = () => {
    // measured: shows ~5px after the hero has scrolled out; hides as the related projects reach the viewport
    // bottom (17px inside it on desktop, 5px before it on phones)
    const past = !!hero && window.scrollY > hero.offsetHeight + 5;
    const before = !end || end.getBoundingClientRect().top > window.innerHeight + (isDesktop() ? -17 : 5);
    const want = past && before;
    if (want === shown) return;
    shown = want;
    gsap.to(aside, want ? { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out", overwrite: true } : { autoAlpha: 0, y: 20, duration: 0.2, overwrite: true });
  };

  let bound: HTMLElement | null = null;
  const setOpen = (open: boolean) => {
    const hit = find();
    if (!hit) return;
    const { dialog, overlay } = hit;
    if (bound !== overlay) { bound?.removeEventListener("click", onOverlay); overlay.addEventListener("click", onOverlay); bound = overlay; }
    overlay.setAttribute("aria-hidden", String(!open));
    overlay.classList.toggle("pointer-events-none", !open);
    lockScroll(open);
    if (open) dialog.scrollTop = 0;
    gsap.to(overlay, { autoAlpha: open ? 1 : 0, duration: 0.3, overwrite: true });
    gsap.to(dialog, { opacity: open ? 1 : 0, scale: open ? 1 : 0.95, duration: open ? 0.4 : 0.3, ease: "power2.out", overwrite: true });
  };
  const onCard = (e: Event) => { if ((e.target as Element).closest("button")) setOpen(true); };
  function onOverlay(e: Event) {
    const t = e.target as Element;
    if (t === e.currentTarget || t.closest("[aria-label='Close Modal']")) setOpen(false);
  }
  const isOpen = () => find()?.overlay.getAttribute("aria-hidden") === "false";
  const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen()) setOpen(false); };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  aside.addEventListener("click", onCard);
  window.addEventListener("keydown", onKey);
  return () => {
    window.removeEventListener("scroll", update);
    window.removeEventListener("resize", update);
    aside.removeEventListener("click", onCard);
    bound?.removeEventListener("click", onOverlay);
    window.removeEventListener("keydown", onKey);
    if (isOpen()) lockScroll(false);
  };
}
