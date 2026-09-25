/**
 * Modals: the menu (home, privacy policy) and the location details (location page).
 *
 * A modal opens from any link to its id (`href="#menu"`) and closes from its close controls, Escape, or a click
 * outside its content. It animates with the stylesheet's `modal-in` / `modal-out` transitions, marks the document
 * (`with-modal …`) and holds the page's scrolling while open, and keeps keyboard focus inside itself. A link inside it
 * to a section of the page (the menu's chapters) closes it and jumps to that section. Only one is open at a time.
 *
 * Companions:
 * - modalHeaderClass: while open, the header takes the modal's theme (400 ms after it starts opening / closing).
 * - modalHideHeader: while open, the header slides away.
 * - modalHash: the open modal's id is kept in the address (`/location#dubai-hills`), and an address with it opens it.
 *
 * Events on the modal (bubbling): `modal:open`, `modal:close` (both at the start of the animation), `modal:closed`.
 */
import { state, type Cleanup } from "@/lib/runtime";
import { matches } from "@/lib/mq";
import { dataOptions } from "@/lib/enable";
import { transition, stopTransition } from "./transition";
import { showImages } from "./appear";
import { setUi, uiClasses } from "./header";
import { scrollToElement } from "./smooth";

type Options = {
  closeSelector: string;
  autoClose: boolean;
  autoCloseIgnoreSelector: string;
  keyboardClose: boolean;
  animationNameIn: string;
  animationNameOut: string;
  animationLinkTransitionIn: string;
  htmlScrollClassName: string;
  onePerPage: boolean;
  resetFormOnClose: boolean;
  triggerActiveClassName: string | null;
  restoreFocus: boolean;
};

const DEFAULTS: Options = {
  closeSelector: ".js-modal-close",
  autoClose: true,
  autoCloseIgnoreSelector: ".js-modal-ignore-auto-close",
  keyboardClose: true,
  animationNameIn: "modal-in",
  animationNameOut: "modal-out",
  animationLinkTransitionIn: "modal-link-transition-in",
  htmlScrollClassName: "with-modal",
  onePerPage: true,
  resetFormOnClose: true,
  triggerActiveClassName: null,
  restoreFocus: true,
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openCount = 0;
let current: Modal | null = null;
const instances = new WeakMap<HTMLElement, Modal>();

export const modalOf = (el: Element | null) => (el ? instances.get(el as HTMLElement) ?? null : null);

/** holds the page still while any modal is open */
function updateDocument(classNames: string) {
  const html = document.documentElement;
  for (const c of classNames.split(/\s+/).filter(Boolean)) html.classList.toggle(c, openCount > 0);
  if (openCount > 0) state.lenis?.stop();
  else state.lenis?.start();
}

class Modal {
  readonly el: HTMLElement;
  readonly o: Options;
  visible: boolean;
  private trigger: HTMLElement | null = null;
  private focused: HTMLElement | null = null;
  private ignore: HTMLElement[];
  private detach: Cleanup[] = [];
  private offs: Cleanup[] = [];
  private closeTimer = 0;

  constructor(el: HTMLElement) {
    this.el = el;
    this.o = { ...DEFAULTS, ...(dataOptions(el, "modal") as Partial<Options>) };
    const ignore = Array.from(el.querySelectorAll<HTMLElement>(this.o.autoCloseIgnoreSelector));
    this.ignore = ignore.length ? ignore : [el];
    this.visible = !el.classList.contains("is-hidden");
    el.classList.add("modal");
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-hidden", this.visible ? "false" : "true");
    // wheel and touch inside the modal scroll its own content, not the (held) page
    el.setAttribute("data-lenis-prevent", "");
    const onHashLink = (e: MouseEvent) => this.handleHashLink(e);
    el.addEventListener("click", onHashLink);
    this.offs.push(() => el.removeEventListener("click", onHashLink));

    if (el.id) {
      const sel = `a[href="#${CSS.escape(el.id)}"]`;
      const onTrigger = (e: MouseEvent) => {
        const a = (e.target as Element | null)?.closest<HTMLElement>(sel);
        if (!a || e.defaultPrevented) return;
        e.preventDefault();
        if (this.visible) this.hide(); else this.show(a);
      };
      const preload = (e: Event) => { if ((e.target as Element | null)?.closest?.(sel)) showImages(el); };
      document.addEventListener("click", onTrigger);
      document.addEventListener("mouseover", preload, { passive: true });
      document.addEventListener("touchstart", preload, { passive: true });
      this.offs.push(() => {
        document.removeEventListener("click", onTrigger);
        document.removeEventListener("mouseover", preload);
        document.removeEventListener("touchstart", preload);
      });
    }
    if (this.visible) { openCount++; this.beforeShow(); this.setupFocus(); }
    instances.set(el, this);
  }

  private emit(name: string) { this.el.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: { modal: this } })); }

  show(trigger?: HTMLElement) {
    if (this.visible) return;
    this.focused = document.activeElement as HTMLElement | null;
    this.trigger = trigger ?? this.trigger;
    this.visible = true;
    openCount++;
    if (this.o.onePerPage) {
      current?.hide();
      // eslint-disable-next-line @typescript-eslint/no-this-alias -- the one open modal, module-wide
      current = this;
    }
    stopTransition(this.el);
    this.el.classList.remove("is-hidden", "modal--animating-out");
    this.el.classList.add("is-invisible");
    showImages(this.el);
    this.setupFocus();
    this.beforeShow();
    transition(this.el, this.o.animationNameIn, { before: (el) => el.setAttribute("aria-hidden", "false") });
  }

  hide() {
    if (!this.visible) return;
    if (current === this) current = null;
    this.visible = false;
    openCount = Math.max(openCount - 1, 0);
    stopTransition(this.el);
    this.el.classList.add("modal--animating-out");
    if (this.o.triggerActiveClassName) this.trigger?.classList.remove(this.o.triggerActiveClassName);
    this.emit("modal:close");
    this.detachListeners();
    transition(this.el, this.o.animationNameOut, { after: (el) => el.setAttribute("aria-hidden", "true") }).then(() => {
      if (this.visible) return;
      this.el.classList.remove("modal--animating-out");
      this.afterHide();
    });
  }

  private beforeShow() {
    if (this.o.triggerActiveClassName) this.trigger?.classList.add(this.o.triggerActiveClassName);
    updateDocument(this.o.htmlScrollClassName);
    const scroller = this.el.querySelector<HTMLElement>(".js-scroll-parent");
    if (scroller) scroller.scrollTop = 0;
    this.emit("modal:open");
    this.attachListeners();
  }

  private afterHide() {
    const f = this.focused;
    this.focused = null;
    if (f && this.o.restoreFocus && !f.closest(".modal")) f.focus({ preventScroll: true });
    if (this.o.resetFormOnClose) this.el.querySelectorAll("form").forEach((form) => form.reset());
    updateDocument(this.o.htmlScrollClassName);
    this.emit("modal:closed");
  }

  private attachListeners() {
    const onClose = (e: MouseEvent) => {
      if (!(e.target as Element | null)?.closest(this.o.closeSelector)) return;
      clearTimeout(this.closeTimer);
      this.closeTimer = window.setTimeout(() => this.hide(), 60);
    };
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t || !t.isConnected || !document.body.contains(t)) return;
      if (this.trigger && this.trigger.contains(t)) return;
      if (this.ignore.some((i) => i.contains(t))) return;
      this.hide();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && this.o.keyboardClose && !(document.activeElement as Element | null)?.matches("input,textarea,select")) this.hide();
      if (e.key === "Tab") this.trapTab(e);
    };
    const onFocusIn = (e: FocusEvent) => {
      if (current === this && !this.el.contains(e.target as Node)) this.el.focus({ preventScroll: true });
    };
    this.el.addEventListener("click", onClose);
    // the opening click is still travelling up: listen from the next task on
    const timer = window.setTimeout(() => { if (this.o.autoClose) document.addEventListener("click", onDocClick); });
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocusIn);
    this.detach = [
      () => clearTimeout(timer),
      () => this.el.removeEventListener("click", onClose),
      () => document.removeEventListener("click", onDocClick),
      () => document.removeEventListener("keydown", onKey),
      () => document.removeEventListener("focusin", onFocusIn),
    ];
  }

  private detachListeners() { this.detach.forEach((f) => f()); this.detach = []; }

  private focusables() {
    return Array.from(this.el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent || n.getClientRects().length);
  }

  private trapTab(e: KeyboardEvent) {
    const list = this.focusables();
    if (!list.length) { e.preventDefault(); return; }
    const first = list[0], last = list[list.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === this.el)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }

  private setupFocus() {
    if ((document.activeElement as Element | null)?.matches("input, textarea, select")) return;
    const auto = this.el.querySelector<HTMLElement>("[autofocus]");
    (auto ?? this.el).focus({ preventScroll: true });
  }

  /** a link to a section of the page closes the modal and jumps there */
  private handleHashLink(e: MouseEvent) {
    const a = (e.target as Element | null)?.closest("a");
    const href = a?.getAttribute("href");
    if (!a || e.defaultPrevented || !href || !href.includes("#")) return;
    const path = href.replace(/#.*/, "");
    if (path && path.replace(/\/+$/, "") !== location.pathname.replace(/\/+$/, "")) return;
    const id = href.replace(/.*#/, "");
    const target = id ? document.getElementById(id) : null;
    if (!target || this.el.contains(target)) return;
    const r = target.getBoundingClientRect();
    if (!r.width && !r.height) return;
    e.preventDefault();
    this.focused = null;
    const fullScreen = matches("sm-down") || this.el.classList.contains("modal--full");
    const jump = () => scrollToElement(target, { immediate: true });
    if (fullScreen) { this.hide(); jump(); return; }
    const name = this.o.animationLinkTransitionIn;
    if (name) {
      const cls = ["animation", `animation--${name}`, `animation--${name}--active`];
      transition(this.el, name, { after: (el) => el.classList.add(...cls) }).then(() => {
        this.hide();
        jump();
        this.el.addEventListener("modal:closed", () => this.el.classList.remove(...cls), { once: true });
      });
    } else {
      this.el.addEventListener("modal:closed", () => scrollToElement(target), { once: true });
      this.hide();
    }
  }

  destroy() {
    if (this.visible) { openCount = Math.max(openCount - 1, 0); updateDocument(this.o.htmlScrollClassName); }
    if (current === this) current = null;
    clearTimeout(this.closeTimer);
    this.detachListeners();
    this.offs.forEach((f) => f());
    instances.delete(this.el);
  }
}

/** the header takes the modal's theme while it is open */
function headerClass(modal: HTMLElement): Cleanup {
  const cls = (modal.getAttribute("data-modal-header-class-class") ?? "ui-dark") + " ui-modal-temp";
  let saved = "";
  let timer = 0;
  const header = () => document.querySelector<HTMLElement>(".header");
  const open = () => {
    const h = header();
    if (!h) return;
    saved = uiClasses(h).join(" ");
    clearTimeout(timer);
    timer = window.setTimeout(() => setUi(h, cls), 400);
  };
  const close = () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      const h = header();
      if (h && uiClasses(h).join(" ") === cls) setUi(h, saved);
    }, 400);
  };
  modal.addEventListener("modal:open", open);
  modal.addEventListener("modal:close", close);
  return () => { clearTimeout(timer); modal.removeEventListener("modal:open", open); modal.removeEventListener("modal:close", close); };
}

/** the header slides away while the modal is open */
function hideHeader(modal: HTMLElement): Cleanup {
  const header = () => document.querySelector<HTMLElement>(".header");
  const open = () => { const h = header(); if (h) transition(h, "hide-header", { after: (el) => el.classList.add("header--hidden-slow") }); };
  const close = () => { const h = header(); if (h) transition(h, "show-header", { before: (el) => el.classList.remove("header--hidden-slow") }); };
  modal.addEventListener("modal:open", open);
  modal.addEventListener("modal:close", close);
  return () => { modal.removeEventListener("modal:open", open); modal.removeEventListener("modal:close", close); };
}

/** the open modal's id stays in the address; an address with it opens the modal */
function hash(modal: HTMLElement): Cleanup {
  const set = (id: string | null) => history.replaceState(history.state, document.title, location.pathname + location.search + (id ? "#" + id : ""));
  const open = () => { if (modal.id) set(modal.id); };
  const close = () => { if (modal.id && location.hash.slice(1) === modal.id) set(null); };
  modal.addEventListener("modal:open", open);
  modal.addEventListener("modal:close", close);
  if (modal.id && location.hash.slice(1) === modal.id) modalOf(modal)?.show();
  return () => { modal.removeEventListener("modal:open", open); modal.removeEventListener("modal:close", close); };
}

export function initModals(root: HTMLElement): Cleanup {
  const offs: Cleanup[] = [];
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-plugin~="modal"]'))) {
    const m = new Modal(el);
    offs.push(() => m.destroy());
    const plugins = (el.getAttribute("data-plugin") ?? "").split(/\s+/);
    if (plugins.includes("modalHeaderClass")) offs.push(headerClass(el));
    if (plugins.includes("modalHideHeader")) offs.push(hideHeader(el));
    if (plugins.includes("modalHash")) offs.push(hash(el));
  }
  return () => offs.reverse().forEach((f) => f());
}
