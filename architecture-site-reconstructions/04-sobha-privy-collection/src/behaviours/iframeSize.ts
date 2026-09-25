/**
 * Films and their placeholders cover their box: the stylesheet sizes them from `--iframe-width` / `--iframe-height`,
 * which follow the box's own size (the markup starts with the film's native size).
 */
import type { Cleanup } from "@/lib/runtime";

export function initIframeSize(root: ParentNode): Cleanup {
  const ro = new ResizeObserver((entries) => {
    for (const e of entries) {
      const box = e.borderBoxSize?.[0];
      if (!box) continue;
      const el = e.target as HTMLElement;
      el.style.setProperty("--iframe-width", box.inlineSize + "px");
      el.style.setProperty("--iframe-height", box.blockSize + "px");
    }
  });
  root.querySelectorAll<HTMLElement>('[data-plugin~="iframeSize"]').forEach((el) => ro.observe(el));
  return () => ro.disconnect();
}
