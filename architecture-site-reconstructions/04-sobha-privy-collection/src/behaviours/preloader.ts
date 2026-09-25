/**
 * Preloader and header entrance. (TODO(autopilot): the first-visit intro animation; for now the page opens directly.)
 */
import { state, type Cleanup } from "@/lib/runtime";
import { revealElement } from "./reveal";
import { ensureSplitting } from "./split";

export function initPreloader(root: HTMLElement): Cleanup {
  document.querySelectorAll<HTMLElement>(".preloader").forEach((p) => p.classList.add("is-hidden"));
  const header = root.querySelector<HTMLElement>("header.header[data-reveal]");
  const instant = state.firstLoaded;
  if (header) ensureSplitting().then(() => revealElement(header, {}, instant));
  state.firstLoaded = true;
  return () => {};
}
