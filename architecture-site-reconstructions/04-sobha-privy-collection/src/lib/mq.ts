/**
 * Named breakpoints (xs, sm-down, md-up, lg-up …).
 *
 * The original's breakpoints are aspect-ratio aware (e.g. `md-up` is 568–667 px wide in portrait, or ≥ 668 px wide
 * and at least 416 px tall, or ≥ 980 px). They are defined once, in the stylesheet: each name is the media query that
 * holds its `.is-hidden--<name>` rule. Reading them from there keeps behaviour and styles in step.
 */
const cache = new Map<string, MediaQueryList | null>();

function cssQuery(name: string): string | null {
  const selector = `.is-hidden--${name}`;
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try { rules = sheet.cssRules; } catch { continue; }
    const hit = scan(rules, selector);
    if (hit) return hit;
  }
  return null;
}

function scan(rules: CSSRuleList, selector: string): string | null {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSMediaRule) {
      for (const inner of Array.from(rule.cssRules)) {
        if (inner instanceof CSSStyleRule && inner.selectorText.split(",").some((s) => s.trim() === selector)) return rule.media.mediaText;
      }
    }
  }
  return null;
}

export function mediaQuery(name: string): MediaQueryList | null {
  if (cache.has(name)) return cache.get(name)!;
  const q = cssQuery(name);
  const mql = q ? matchMedia(q) : null;
  cache.set(name, mql);
  return mql;
}

/** true when the named breakpoint applies; `null` / "null" means "always" */
export function matches(name: string | null | undefined): boolean {
  if (!name || name === "null" || name === "xs-up") return true;
  return !!mediaQuery(name)?.matches;
}

/** calls `fn` whenever the named breakpoint starts or stops applying */
export function onChange(name: string | null | undefined, fn: () => void): () => void {
  if (!name || name === "null") return () => {};
  const mql = mediaQuery(name);
  if (!mql) return () => {};
  mql.addEventListener("change", fn);
  return () => mql.removeEventListener("change", fn);
}
