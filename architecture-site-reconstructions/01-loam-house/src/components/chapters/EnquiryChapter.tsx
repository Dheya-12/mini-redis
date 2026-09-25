"use client";

import { useRef, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { BROCHURE_URL, ENQUIRY } from "@/content/site";
import { submitLead } from "@/lib/lead";
import { gsap } from "@/lib/motion/gsap";
import { useSiteUI } from "@/components/site/SiteProvider";

type Mode = "brochure" | "callback";

/**
 * The enquiry chapter. On desktop it overlays the hero's first screen and the card sits in
 * the hero grid's middle column; on phones it is its own chapter after the hero.
 */
export function EnquiryChapter() {
  return (
    <section className="enquiry chapter" id="enquire" data-chapter="enquiry" aria-label="Enquiry">
      <picture>
        <source media="(max-width: 800px)" srcSet={ENQUIRY.background.mobile} />
        <img className="enquiry__bg" src={ENQUIRY.background.src} alt="" aria-hidden loading="lazy" decoding="async" />
      </picture>
      <div className="enquiry__shade" />
      <EnquiryCard />
      <span className="impression">Artist’s impression</span>
    </section>
  );
}

/** Underline that draws in from the left on focus and retreats to the right on blur. */
function focusLineHandlers() {
  return {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      const line = e.currentTarget.parentElement?.querySelector(".ink-field__focus");
      if (line) gsap.to(line, { scaleX: 1, duration: 0.55, ease: "power3.out" });
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      const line = e.currentTarget.parentElement?.querySelector(".ink-field__focus");
      if (!line) return;
      gsap.to(line, {
        scaleX: 0,
        transformOrigin: "100% 50%",
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => void gsap.set(line, { transformOrigin: "0 50%" }),
      });
    },
  };
}

function EnquiryCard() {
  const { openBooking } = useSiteUI();
  const card = useRef<HTMLElement>(null);
  const formView = useRef<HTMLDivElement>(null);
  const successView = useRef<HTMLDivElement>(null);
  const phoneWrap = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("brochure");
  const [copy, setCopy] = useState<{ eyebrow: string; intro: string; send: string; toggle: string }>({
    ...ENQUIRY.brochure,
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [thanks, setThanks] = useState({ eyebrow: "Thank you", email: "", callback: false });
  const [upsellSending, setUpsellSending] = useState(false);
  const [upsellError, setUpsellError] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const upsellPhone = useRef<HTMLInputElement>(null);
  const focusLine = focusLineHandlers();

  /** One card, two depths of ask: only the delta (the phone field and four labels) moves. */
  const toggleMode = (e: React.MouseEvent) => {
    e.preventDefault();
    const next: Mode = mode === "brochure" ? "callback" : "brochure";
    setMode(next);
    const wrap = phoneWrap.current!;
    const inner = wrap.firstElementChild as HTMLElement;
    if (next === "callback") {
      gsap
        .timeline()
        .to(wrap, { height: inner.offsetHeight + 26, duration: 0.6, ease: "power3.out" }, 0)
        .fromTo(
          inner,
          { y: 40, opacity: 0, filter: "blur(6px)" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "power3.out" },
          0.12,
        );
    } else {
      gsap
        .timeline()
        .to(inner, { y: 30, opacity: 0, filter: "blur(6px)", duration: 0.35, ease: "power2.in" }, 0)
        .to(wrap, { height: 0, duration: 0.5, ease: "power3.inOut" }, 0.1);
    }
    const nextCopy =
      next === "callback" ? ENQUIRY.callback : { ...ENQUIRY.brochure, intro: ENQUIRY.brochureIntroReturn };
    const swapping = card.current!.querySelectorAll("[data-swap]");
    gsap
      .timeline()
      .to(swapping, { opacity: 0, y: -8, filter: "blur(4px)", duration: 0.28, ease: "power2.in" })
      .add(() => setCopy(nextCopy))
      .to(swapping, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.4, ease: "power2.out" });
  };

  /** Brochure: "on its way to <email>" plus a call-back offer. Call-back: just the confirmation. */
  const playThanks = (name: string, email: string, callback: boolean) => {
    const first = name.split(/\s+/)[0] ?? "";
    // Commit the thank-you markup before the timeline measures it.
    flushSync(() =>
      setThanks({ eyebrow: first ? `Thank you, ${first}` : "Thank you", email: email || "your inbox", callback }),
    );
    const c = card.current!;
    const form = formView.current!;
    const success = successView.current!;
    c.style.minHeight = `${c.offsetHeight}px`; // the card never resizes on the swap
    const tl = gsap
      .timeline()
      .to(form.children, { opacity: 0, y: -18, filter: "blur(6px)", duration: 0.45, ease: "power2.in", stagger: 0.05 })
      .set(form, { display: "none" })
      .set(success, { display: "block" })
      .from(success.querySelector(".ink-card__rule"), {
        scaleX: 0,
        transformOrigin: "0 50%",
        duration: 1,
        ease: "power3.out",
      })
      .from(
        success.querySelector(".ink-card__eyebrow-text"),
        { yPercent: 130, duration: 0.9, ease: "power3.out" },
        "-=.7",
      );
    if (!callback) {
      const lines = success.querySelectorAll(".ink-card__success-line span");
      tl.from(
        lines,
        { x: (i: number) => (i % 2 ? 90 : -90), opacity: 0, duration: 1.3, ease: "expo.out", stagger: 0.08 },
        "-=.55",
      )
        .from(lines, { filter: "blur(16px)", duration: 1.5, ease: "power1.out", stagger: 0.08 }, "<")
        .from(
          success.querySelector(".ink-card__view"),
          { opacity: 0, y: 16, duration: 0.6, ease: "power2.out" },
          "-=.7",
        );
    }
    tl.from(
      success.querySelector(".ink-card__upsell"),
      { opacity: 0, y: 18, duration: 0.7, ease: "power2.out" },
      callback ? "-=.5" : "-=.4",
    );
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const name = nameRef.current?.value.trim() ?? "";
    const email = emailRef.current?.value.trim() ?? "";
    const phone = phoneRef.current?.value.trim() ?? "";
    setSending(true);
    setError(false);
    try {
      await submitLead({ intent: mode, name, email, phone, website: honeypot.current?.value ?? "" });
      playThanks(name, email, mode === "callback");
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  const onUpsell = async () => {
    const phone = upsellPhone.current?.value.trim() ?? "";
    if (!phone) return;
    setUpsellSending(true);
    setUpsellError(false);
    try {
      await submitLead({
        intent: "callback",
        name: nameRef.current?.value.trim(),
        email: emailRef.current?.value.trim(),
        phone,
      });
      const c = card.current!;
      const success = successView.current!;
      const upsell = success.querySelector<HTMLElement>(".ink-card__upsell")!;
      c.style.minHeight = `${c.offsetHeight}px`;
      upsell.style.minHeight = `${upsell.offsetHeight}px`;
      const leaving = success.querySelectorAll(
        ".ink-card__upsell-intro, .ink-card__upsell-form, .ink-card__success-line",
      );
      const done = success.querySelector(".ink-card__upsell-done");
      gsap
        .timeline()
        .to(leaving, { opacity: 0, y: -14, filter: "blur(5px)", duration: 0.4, ease: "power2.in", stagger: 0.03 })
        .set(leaving, { display: "none" })
        .set(done, { display: "block" })
        .from(done, { opacity: 0, y: 16, filter: "blur(6px)", duration: 0.8, ease: "power2.out" }, "+=.15");
    } catch {
      setUpsellError(true);
    } finally {
      setUpsellSending(false);
    }
  };

  const book = (e: React.MouseEvent) => {
    e.preventDefault();
    openBooking({ name: nameRef.current?.value.trim(), email: emailRef.current?.value.trim() });
  };

  return (
    <aside className="ink-card" ref={card} data-hero="card" data-reveal="card">
      <div ref={formView}>
        <p className="ink-card__eyebrow">
          <span className="ink-card__eyebrow-mask">
            <span className="ink-card__eyebrow-text" data-swap>
              {copy.eyebrow}
            </span>
          </span>
          <i className="ink-card__rule" />
        </p>
        <p className="ink-card__intro" data-swap>
          {copy.intro}
        </p>
        <form onSubmit={onSubmit}>
          <label style={{ position: "absolute", left: -9999 }} aria-hidden>
            Website
            <input ref={honeypot} name="website" tabIndex={-1} autoComplete="off" />
          </label>
          <div className="ink-field">
            <label className="ink-field__label" htmlFor="enquiry-name">
              <span>Name</span>
            </label>
            <input
              ref={nameRef}
              className="ink-field__input"
              id="enquiry-name"
              name="name"
              autoComplete="name"
              placeholder=" "
              required
              {...focusLine}
            />
            <i className="ink-field__focus" />
            <i className="ink-field__caret" />
          </div>
          <div className="ink-field">
            <label className="ink-field__label" htmlFor="enquiry-email">
              <span>Email</span>
            </label>
            <input
              ref={emailRef}
              className="ink-field__input"
              id="enquiry-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              {...focusLine}
            />
            <i className="ink-field__focus" />
          </div>
          <div className="ink-card__phone" ref={phoneWrap}>
            <div className="ink-field">
              <label className="ink-field__label" htmlFor="enquiry-phone">
                <span>Phone</span>
              </label>
              <input
                ref={phoneRef}
                className="ink-field__input"
                id="enquiry-phone"
                type="tel"
                name="phone"
                autoComplete="tel"
                required={mode === "callback"}
                {...focusLine}
              />
              <i className="ink-field__focus" />
            </div>
          </div>
          <button type="submit" className="ink-btn ink-btn--primary" disabled={sending} data-qa="enquiry-send">
            <span data-swap>{copy.send}</span>
          </button>
          {error ? <p className="lead-error">{ENQUIRY.error}</p> : null}
        </form>
        <a className="ink-btn ink-btn--ghost" href="#" onClick={book}>
          {ENQUIRY.appointment}
        </a>
        <a className="ink-btn ink-btn--ghost" href="#" onClick={toggleMode} data-qa="enquiry-mode">
          <span data-swap>{copy.toggle}</span>
        </a>
        <small className="ink-card__trust">{ENQUIRY.trust}</small>
      </div>

      <div className="ink-card__success" ref={successView}>
        <p className="ink-card__eyebrow">
          <span className="ink-card__eyebrow-mask">
            <span className="ink-card__eyebrow-text">{thanks.eyebrow}</span>
          </span>
          <i className="ink-card__rule" />
        </p>
        {thanks.callback ? null : (
          <>
            <div className="ink-card__success-line">
              <span>Your brochure</span>
            </div>
            <div className="ink-card__success-line">
              <span>
                <em>is on its way to</em>
              </span>
            </div>
            <div className="ink-card__success-line">
              <span className="ink-card__email">{thanks.email}</span>
            </div>
            <a className="ink-btn ink-btn--primary ink-card__view" href={BROCHURE_URL} target="_blank" rel="noopener">
              View the brochure now
            </a>
          </>
        )}
        <div className="ink-card__upsell">
          {thanks.callback ? (
            <p className="ink-card__upsell-done" style={{ display: "block" }}>
              One of our sales team <em>will call you soon.</em>
            </p>
          ) : (
            <>
              <p className="ink-card__upsell-intro">
                If you would like further information, enter your number below and one of our sales team will be happy
                to give you a call back.
              </p>
              <div className="ink-card__upsell-form">
                <div className="ink-field">
                  <label className="ink-field__label" htmlFor="enquiry-upsell-phone">
                    <span>Phone</span>
                  </label>
                  <input
                    ref={upsellPhone}
                    className="ink-field__input"
                    id="enquiry-upsell-phone"
                    type="tel"
                    placeholder=" "
                    {...focusLine}
                  />
                  <i className="ink-field__focus" />
                  <i className="ink-field__caret" />
                </div>
                <button type="button" className="ink-btn ink-btn--ghost" onClick={onUpsell} disabled={upsellSending}>
                  Request a call back
                </button>
              </div>
              {upsellError ? <p className="lead-error">{ENQUIRY.error}</p> : null}
              <p className="ink-card__upsell-done" style={{ display: "none" }}>
                One of our sales team <em>will call you soon.</em>
              </p>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
