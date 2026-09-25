import { gsap, ScrollTrigger } from "@/lib/motion";
import { toDom } from "@/lib/tree-dom";
import type { TreeNode } from "@/lib/tree";
import listing from "@/content/listing.json";
import teamsJson from "@/content/teams.json";

/**
 * /projects and /journal index controls. The server markup shows the first page of cards;
 * everything else (Load More, sector/team filters, grid/list, search, sort) is rebuilt here
 * from the full listing captured from the site's own data payload.
 */
type Cleanup = () => void;
type Project = (typeof listing.projects)[number];
type Article = (typeof listing.articles)[number];
const teams = teamsJson as unknown as Record<string, TreeNode>;
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode) => [...root.querySelectorAll<T>(sel)];

const OPTION = "flex w-full items-center justify-between gap-4 rounded-[2px] px-2.5 py-2 text-left body text-warm-black transition-colors hover:bg-warm-black/4";
const PANEL = "absolute top-full left-0 z-50 mt-1 min-w-[220px] rounded-sm bg-white p-1 shadow-[0_8px_24px_rgb(32_34_26/0.08)]";

/** Small listbox popover attached to one of the site's dropdown buttons. */
function dropdown(button: HTMLButtonElement, options: string[], onPick: (value: string | null) => void): Cleanup {
  const host = button.parentElement!;
  host.classList.add("relative");
  const panel = document.createElement("div");
  panel.className = PANEL;
  panel.setAttribute("role", "listbox");
  panel.hidden = true;
  const label = button.querySelector<HTMLElement>(".cap-trim, span");
  const base = label?.textContent ?? "";
  const pick = (v: string | null) => {
    if (label) label.textContent = v ?? base;
    close();
    onPick(v);
  };
  for (const v of [null, ...options]) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = OPTION;
    b.setAttribute("role", "option");
    b.textContent = v ?? `All`;
    b.addEventListener("click", () => pick(v));
    panel.append(b);
  }
  host.append(panel);
  const open = () => { panel.hidden = false; button.setAttribute("aria-expanded", "true"); };
  const close = () => { panel.hidden = true; button.setAttribute("aria-expanded", "false"); };
  const toggle = (e: Event) => { e.stopPropagation(); if (panel.hidden) open(); else close(); };
  const outside = (e: Event) => { if (!host.contains(e.target as Node)) close(); };
  button.addEventListener("click", toggle);
  document.addEventListener("click", outside);
  return () => { button.removeEventListener("click", toggle); document.removeEventListener("click", outside); panel.remove(); };
}

/* ------------------------------------------------------------------ projects */

// grid rhythm of the index: a wide card then four narrow ones, mirrored every five cards
const PATTERN = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0];
const PAGE = 15;

export function initProjectsIndex(root: HTMLElement): Cleanup | null {
  const grid = $(".site-grid.items-start.gap-y-8", root);
  const more = grid?.parentElement?.querySelector<HTMLButtonElement>(":scope > .flex.justify-center button");
  if (!grid) return null;
  const wrappers = $$(":scope > div", grid);
  const wide = wrappers.find((w) => w.className.includes("lg:col-span-8"))!;
  const narrow = wrappers.find((w) => w.className.includes("lg:col-span-4"))!;
  const offs: Cleanup[] = [];
  let sector: string | null = null;
  let team: string | null = null;
  let shown = wrappers.length;
  let view: "grid" | "list" = "grid";

  const card = (p: Project, i: number) => {
    const w = (PATTERN[i % PATTERN.length] ? wide : narrow).cloneNode(true) as HTMLElement;
    const a = $("a", w)!;
    a.setAttribute("href", p.href);
    const img = $<HTMLImageElement>("img", w);
    if (img && p.image) { img.src = p.image; img.style.backgroundImage = "none"; }
    const specs = $$(".project-details > span.body-xsmall", w);
    const parts = [p.location, p.size, p.type].filter(Boolean) as string[];
    specs.forEach((s, k) => (s.textContent = parts[k] ?? ""));
    const title = $(".project-title", w);
    if (title) title.textContent = p.title;
    const logo = $(".team-logo", w);
    if (logo && p.team && teams[p.team]) { logo.setAttribute("aria-label", p.team); logo.replaceChildren(toDom(teams[p.team])); }
    return w;
  };
  const row = (p: Project) => {
    const a = document.createElement("a");
    a.href = p.href;
    a.className = "group col-span-full grid grid-cols-12 items-center gap-4 border-t border-warm-black/24 py-5 text-warm-black";
    a.innerHTML = `<span class="col-span-6 h6 lg:col-span-5"></span><span class="col-span-3 body-small lg:col-span-3"></span><span class="col-span-3 body-small lg:col-span-2"></span><span class="team-logo hidden marist-body-small lg:col-span-2 lg:flex"></span>`;
    const [t, l, ty, logo] = [...a.children] as HTMLElement[];
    t.textContent = p.title;
    l.textContent = p.location ?? "";
    ty.textContent = p.type ?? "";
    if (p.team && teams[p.team]) logo.append(toDom(teams[p.team]));
    return a;
  };
  const list = () => listing.projects.filter((p) => (!sector || p.sectors.includes(sector)) && (!team || p.team === team));
  const render = (reset: boolean) => {
    const items = list();
    if (reset) { grid.replaceChildren(); shown = 0; }
    const next = items.slice(shown, reset ? PAGE : shown + PAGE);
    next.forEach((p, k) => grid.append(view === "grid" ? card(p, shown + k) : row(p)));
    shown += next.length;
    if (more) more.parentElement!.hidden = shown >= items.length;
    ScrollTrigger.refresh();
  };
  const onMore = () => render(false);
  more?.addEventListener("click", onMore);
  offs.push(() => more?.removeEventListener("click", onMore));

  const sectors = [...new Set(listing.projects.flatMap((p) => p.sectors))].sort();
  const teamNames = [...new Set(listing.projects.map((p) => p.team).filter(Boolean) as string[])].sort();
  $$<HTMLButtonElement>("button[aria-label='Sector']", root).forEach((b) => offs.push(dropdown(b, sectors, (v) => { sector = v; render(true); })));
  $$<HTMLButtonElement>("button[aria-label='Team']", root).forEach((b) => offs.push(dropdown(b, teamNames, (v) => { team = v; render(true); })));

  const [gridBtn, listBtn] = $$<HTMLButtonElement>("button", $(".flex.grow.items-center", root) ?? root).filter((b) => /^(Grid|List)$/.test(b.textContent || ""));
  const setView = (v: "grid" | "list") => {
    view = v;
    gridBtn?.classList.toggle("text-warm-black/50", v !== "grid");
    gridBtn?.classList.toggle("text-warm-black", v === "grid");
    listBtn?.classList.toggle("text-warm-black/50", v !== "list");
    listBtn?.classList.toggle("text-warm-black", v === "list");
    grid.classList.toggle("gap-y-8", v === "grid");
    grid.classList.toggle("lg:gap-y-24", v === "grid");
    render(true);
  };
  const g = () => setView("grid"), l = () => setView("list");
  gridBtn?.addEventListener("click", g);
  listBtn?.addEventListener("click", l);
  offs.push(() => { gridBtn?.removeEventListener("click", g); listBtn?.removeEventListener("click", l); });
  return () => offs.forEach((f) => f());
}

/* ------------------------------------------------------------------ journal */

const pad = (n: number) => String(n).padStart(2, "0");

export function initJournalIndex(root: HTMLElement): Cleanup | null {
  const stack = $(".flex.flex-col.gap-\\[16px\\]", root);
  const input = $<HTMLInputElement>("input[type=search]", root);
  if (!stack) return null;
  const original = [...stack.children];
  const more = $$<HTMLButtonElement>("button", root).find((b) => /load more/i.test(b.textContent || ""));
  const template = $("a.group", $(".lg\\:col-span-3", stack) ?? stack)!;
  const offs: Cleanup[] = [];
  let order: "newest" | "oldest" = "newest";
  let extra = 0;

  const card = (a: Article) => {
    const c = template.cloneNode(true) as HTMLAnchorElement;
    c.setAttribute("href", a.href);
    const img = $<HTMLImageElement>("img", c);
    if (img && a.image) { img.src = a.image; img.alt = a.title; img.style.backgroundImage = "none"; }
    const d = new Date(a.date);
    const pills = $$(".number-pill > span", c);
    [pad(d.getDate()), pad(d.getMonth() + 1), String(d.getFullYear())].forEach((v, i) => pills[i] && (pills[i].textContent = v));
    const h = $("h3", c);
    if (h) h.textContent = a.title;
    const cell = document.createElement("div");
    cell.className = "lg:col-span-3 xl:col-span-6";
    cell.append(c);
    return cell;
  };
  const uniform = (items: Article[]) => {
    const g = document.createElement("div");
    g.className = "grid grid-cols-1 gap-[16px] md:grid-cols-2 lg:grid-cols-12 xl:grid-cols-24";
    items.forEach((a) => g.append(card(a)));
    return g;
  };
  const shownSlugs = new Set($$<HTMLAnchorElement>("a[href^='/journal/']", stack).map((a) => a.getAttribute("href")!.split("/").pop()));
  const render = () => {
    const q = (input?.value || "").trim().toLowerCase();
    if (!q && order === "newest") {
      stack.replaceChildren(...original);
      const rest = listing.articles.filter((a) => !shownSlugs.has(a.slug)).slice(0, extra);
      if (rest.length) stack.append(uniform(rest));
      if (more) more.hidden = extra >= listing.articles.length - shownSlugs.size;
    } else {
      let items = listing.articles.filter((a) => a.title.toLowerCase().includes(q));
      if (order === "oldest") items = [...items].sort((a, b) => a.date.localeCompare(b.date));
      stack.replaceChildren(uniform(items));
      if (more) more.hidden = true;
    }
    ScrollTrigger.refresh();
  };
  const onMore = () => { extra += 12; render(); };
  const onInput = () => render();
  more?.addEventListener("click", onMore);
  input?.addEventListener("input", onInput);
  offs.push(() => { more?.removeEventListener("click", onMore); input?.removeEventListener("input", onInput); });
  const sort = $<HTMLButtonElement>("button[aria-haspopup=listbox]", root);
  if (sort) offs.push(dropdown(sort, ["Newest", "Oldest"], (v) => { order = v === "Oldest" ? "oldest" : "newest"; render(); }));
  return () => offs.forEach((f) => f());
}

/* ------------------------------------------------------------------ stat counters */

export function initCounters(root: HTMLElement): Cleanup {
  const tweens = $$("span.tabular-nums", root).map((el) => {
    const m = /^(\D*)([\d,.]+)(.*)$/.exec(el.textContent?.trim() || "");
    if (!m) return null;
    const [, pre, num, post] = m;
    const target = parseFloat(num.replace(/,/g, ""));
    const decimals = (num.split(".")[1] || "").length;
    const fmt = (v: number) => pre + v.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + post;
    const state = { v: 0 };
    el.textContent = fmt(0);
    return gsap.to(state, {
      v: target, duration: 2, ease: "power2.out",
      onUpdate: () => (el.textContent = fmt(decimals ? state.v : Math.round(state.v))),
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });
  return () => tweens.forEach((t) => t?.kill());
}
