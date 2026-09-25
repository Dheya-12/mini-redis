/**
 * The menu's chapter list follows the pointer's height: with the pointer at the top of the screen the list shows its
 * start, at the bottom its end (eased 10 % per frame). Pointer devices only, while the menu is on screen.
 */
import type { Cleanup } from "@/lib/runtime";
import { whenEnabled } from "@/lib/enable";
import { Follower } from "@/lib/follow";

function menuLinks(nav: HTMLElement): Cleanup {
  const list = nav.querySelector<HTMLElement>(".js-menu-links-list");
  if (!list) return () => {};
  let max = 0;
  const apply = (p: number) => { list.style.transform = `translateY(${-p * max}px)`; };
  const position = new Follower<number>(0, 0.1, apply);
  const measure = () => { max = Math.max(0, nav.scrollHeight - nav.offsetHeight); apply(position.get()); };
  const move = (e: MouseEvent) => position.set(e.clientY / window.innerHeight);
  return whenEnabled(nav, { enableTouch: false, enableOnlyInView: true }, {
    enable: () => { nav.addEventListener("mousemove", move); window.addEventListener("resize", measure); measure(); },
    disable: () => { nav.removeEventListener("mousemove", move); window.removeEventListener("resize", measure); position.set(0); },
  });
}

export function initMenuLinks(root: ParentNode): Cleanup {
  const offs = Array.from(root.querySelectorAll<HTMLElement>('[data-plugin~="menuLinks"]')).map(menuLinks);
  return () => offs.forEach((f) => f());
}
