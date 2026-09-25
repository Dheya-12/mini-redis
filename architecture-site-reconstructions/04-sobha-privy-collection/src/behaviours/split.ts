/**
 * Text splitting for the reveal animations (Splitting.js does the word / char / line detection).
 *
 * The stylesheet animates the pieces through CSS variables: `--char-index`, `--line-index`, `--line-total`,
 * `--line-char-offset`. Before splitting, words joined by a non-breaking space are kept together, hyphens get their
 * own span so a line can still break after them, and the whitespace after each word is folded into the word so a
 * line never starts with a space.
 */
type SplittingFn = typeof import("splitting").default;
let Splitting: SplittingFn = () => [];
/** Splitting.js touches `document` when loaded, so it is loaded in the browser only, before the first reveal */
let loading: Promise<void> | null = null;
export function ensureSplitting() {
  loading ??= import("splitting").then((m) => { Splitting = m.default; });
  return loading;
}

/** keeps `word&nbsp;word` together and marks spaces before inline elements */
function keepNonBreaking(el: HTMLElement, asWord = false) {
  let html = el.innerHTML;
  if (!html.includes("&nbsp;") && !html.includes(" ")) return;
  html = html.replace(/[^\s\t\r\n><]+(&nbsp;| )[^\s\t\r\n><]+/g, (m) => `<span class="text-nowrap${asWord ? " word" : ""}">${m}</span>`);
  html = html.replace(/(<[^>]+>) </g, '<span class="whitespace"></span>$1<');
  el.innerHTML = html;
  el.querySelectorAll(".text-nowrap + .text-nowrap").forEach((n) => {
    if (n.previousSibling?.nodeType === Node.ELEMENT_NODE) {
      const spacer = document.createElement("span");
      spacer.className = "word-nowrap-spacer";
      n.parentNode!.insertBefore(spacer, n);
    }
  });
}

/** "a-b" → "a<span>-</span>b" */
function isolateHyphens(el: HTMLElement) {
  const all = [el, ...Array.from(el.querySelectorAll<HTMLElement>("*"))];
  for (let i = all.length - 1; i >= 0; i--) {
    for (const node of Array.from(all[i].childNodes)) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent!.includes("-")) {
        const frag = document.createRange().createContextualFragment(node.textContent!.split("-").map(escape).join("<span>-</span>"));
        node.parentNode!.replaceChild(frag, node);
      }
    }
  }
}
const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** whitespace goes into the word before it (or, for right-aligned text, the word after it) */
function foldWhitespace(el: HTMLElement) {
  const align = getComputedStyle(el).textAlign;
  if (align !== "right" && align !== "end") {
    el.querySelectorAll(".word + .whitespace").forEach((w) => w.previousElementSibling!.appendChild(w));
  } else {
    el.querySelectorAll(".whitespace + .word").forEach((w) => w.prepend(w.previousElementSibling!));
  }
}

/** a trailing space inside <nobr> moves after it */
function fixNobr(el: HTMLElement) {
  el.querySelectorAll("nobr").forEach((n) => {
    const last = n.lastChild;
    if (last?.textContent?.endsWith(" ")) {
      n.after(document.createTextNode(" "));
      last.textContent = last.textContent.slice(0, -1);
    }
  });
}

const original = new WeakMap<HTMLElement, string>();

export function splitChars(el: HTMLElement) {
  if (el.classList.contains("splitting")) return;
  original.set(el, el.innerHTML);
  el.classList.add("splitting", "is-splitting");
  keepNonBreaking(el);
  isolateHyphens(el);
  Splitting({ target: el, by: "chars", force: true });
  el.classList.remove("is-splitting");
  foldWhitespace(el);
}

export function splitLines(el: HTMLElement) {
  if (el.classList.contains("splitting")) return;
  original.set(el, el.innerHTML);
  el.classList.add("splitting", "is-splitting");
  keepNonBreaking(el);
  isolateHyphens(el);
  const [res] = Splitting({ target: el, by: "lines", force: true });
  el.classList.remove("is-splitting");
  for (const w of res?.words ?? []) {
    if (w.textContent?.includes("­")) w.classList.add("word--shy");
    const wrap = document.createElement("span");
    wrap.className = "word-wrap";
    while (w.firstChild) wrap.appendChild(w.firstChild);
    w.appendChild(wrap);
  }
  foldWhitespace(el);
  fixNobr(el);
}

/**
 * Titles: split into characters, then group the words into measured lines, each wrapped
 * `div.line-wrap(--line-index, --line-char-offset) > div.line`; `--char-index` restarts on every line, and centred
 * titles offset shorter lines so their characters finish together with the longest line's.
 */
export function splitTitle(el: HTMLElement) {
  if (el.classList.contains("splitting")) return;
  original.set(el, el.innerHTML);
  el.classList.add("splitting");
  const centred = el.classList.contains("text-center");
  keepNonBreaking(el, true);
  isolateHyphens(el);
  Splitting({ target: el, by: "chars", force: true });
  if (el.innerHTML.includes(" ")) el.innerHTML = el.innerHTML.replace(/ <span/g, '<span class="whitespace"></span><span');
  foldWhitespace(el);

  const lines: { parent: HTMLElement; from: number; to: number }[] = [];
  let bottom = -9999;
  const walk = (parent: HTMLElement) => {
    const kids = Array.from(parent.children) as HTMLElement[];
    const hasWords = kids.some((k) => k.classList.contains("word"));
    kids.forEach((k, i) => {
      if (hasWords) {
        const b = k.offsetTop + k.offsetHeight;
        if (b > bottom) { bottom = b; lines.push({ parent, from: i, to: i }); }
        else lines[lines.length - 1].to = i;
      } else walk(k);
    });
  };
  walk(el);
  const pieces = lines.map((l) => (Array.from(l.parent.children) as HTMLElement[]).slice(l.from, l.to + 1));
  const most = Math.max(0, ...pieces.map((p) => p.flatMap((e) => Array.from(e.querySelectorAll(".char"))).length));
  for (let i = pieces.length - 1; i >= 0; i--) {
    const group = pieces[i];
    if (!group.length) continue;
    const chars = group.flatMap((e) => Array.from(e.querySelectorAll<HTMLElement>(".char")));
    const offset = centred ? Math.floor((most - chars.length) / 2) : 0;
    const wrap = document.createElement("div");
    wrap.className = "line-wrap";
    wrap.setAttribute("style", `--line-index: ${i}; --line-char-offset: ${offset};`);
    const line = document.createElement("div");
    line.className = "line";
    group[0].before(wrap);
    wrap.appendChild(line);
    group.forEach((e) => line.appendChild(e));
    chars.forEach((c, k) => c.style.setProperty("--char-index", String(k)));
  }
  fixNobr(el);
}

/** restores the markup a split replaced */
export function unsplit(el: HTMLElement) {
  const html = original.get(el);
  if (html === undefined) return;
  el.innerHTML = html;
  el.classList.remove("splitting", "words", "lines", "chars");
  original.delete(el);
}
