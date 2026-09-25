"use client";

import Link from "next/link";
import { memo, useRef, useState, type FormEvent, type FocusEvent } from "react";
import { flushSync } from "react-dom";
import { CONTACT, FOOTER, WORDMARK } from "@/content/site";
import { submitLead } from "@/lib/lead";
import { gsap } from "@/lib/motion/gsap";
import { Headline } from "./ChapterPlate";
import { FrameImage } from "./FrameChapter";

/* eslint-disable @next/next/no-img-element -- static wordmark */

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** Static heading block, memoised so form state never re-renders the split headline. */
const ContactHeading = memo(function ContactHeading() {
  return (
    <>
      <p className="eyebrow contact__eyebrow" data-reveal="eyebrow" data-leave>
        {CONTACT.eyebrow}
      </p>
      {/* The wrapper carries no box of its own; the heading's margin collapses through it. */}
      <div data-leave>
        <Headline lines={CONTACT.headline} className="contact__title" />
      </div>
    </>
  );
});

function LineField({
  id,
  label,
  children,
  invalid,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  invalid: boolean;
}) {
  return (
    <div className={`line-field${invalid ? " line-field--invalid" : ""}`}>
      <label className="line-field__label" htmlFor={id}>
        <span>{label}</span>
      </label>
      {children}
      <i className="line-field__focus" />
    </div>
  );
}

const STEP_FIELDS: string[][] = [
  ["contact-name", "contact-email"],
  ["contact-phone", "contact-preferred"],
  ["contact-enquiry", "contact-message"],
];

/** 07 — Contact: a three-step enquiry laid over the image, with the footer folded in. */
export function ContactChapter() {
  const [step, setStep] = useState(0);
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [sentName, setSentName] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const success = useRef<HTMLDivElement>(null);

  const control = (id: string) => form.current?.querySelector<Control>(`#${id}`) ?? null;
  const value = (id: string) => control(id)?.value.trim() ?? "";

  /** Validates the fields of one step; marks the failures and focuses the first. */
  const validate = (index: number) => {
    const failed = STEP_FIELDS[index].filter((id) => {
      const c = control(id);
      return c ? !c.checkValidity() : false;
    });
    setInvalid(new Set(failed));
    if (failed.length) control(failed[0])?.focus();
    return failed.length === 0;
  };

  const go = (delta: number) => {
    if (delta > 0 && !validate(step)) return;
    setStep((s) => Math.max(0, Math.min(STEP_FIELDS.length - 1, s + delta)));
  };

  const onFocus = (e: FocusEvent<Control>) => {
    const id = e.currentTarget.id;
    setInvalid((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    const line = e.currentTarget.parentElement?.querySelector(".line-field__focus");
    if (line) gsap.to(line, { scaleX: 1, duration: 0.5, ease: "power3.out" });
  };
  const onBlur = (e: FocusEvent<Control>) => {
    const line = e.currentTarget.parentElement?.querySelector(".line-field__focus");
    if (!line) return;
    gsap.to(line, {
      scaleX: 0,
      transformOrigin: "100% 50%",
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => void gsap.set(line, { transformOrigin: "0 50%" }),
    });
  };
  const fieldEvents = { onFocus, onBlur };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate(step)) return;
    setSending(true);
    setError(false);
    try {
      await submitLead({
        intent: "contact",
        name: value("contact-name"),
        email: value("contact-email"),
        phone: value("contact-phone"),
        preferred: value("contact-preferred"),
        enquiry: value("contact-enquiry"),
        message: value("contact-message"),
        website: form.current?.querySelector<HTMLInputElement>("[name='website']")?.value ?? "",
      });
      // The thank-you replaces the heading block, not just the form.
      const leaving = inner.current!.querySelectorAll("[data-leave]");
      gsap
        .timeline()
        .to(leaving, { opacity: 0, y: -16, filter: "blur(6px)", duration: 0.45, ease: "power2.in" })
        .set(leaving, { display: "none" })
        .add(() => {
          flushSync(() => setSentName(value("contact-name").split(/\s+/)[0] ?? ""));
          gsap.from(success.current, { opacity: 0, y: 18, filter: "blur(8px)", duration: 0.8, ease: "power2.out" });
        });
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  const bad = (id: string) => invalid.has(id);

  return (
    <section className="contact chapter" id="contact" data-chapter="contact" aria-label="Contact the team">
      <FrameImage image={CONTACT.image} className="contact__bg" />
      <div className="contact__shade" />
      <div className="contact__scrim" />
      <div className="scanlines" />
      <div className="contact__inner" ref={inner}>
        <ContactHeading />
        <ol className="stepper" aria-hidden data-leave>
          {CONTACT.steps.map((label, i) => (
            <li
              key={label}
              className={`stepper__dot${i === step ? " stepper__dot--active" : ""}${i < step ? " stepper__dot--done" : ""}`}
            >
              <span>{label}</span>
            </li>
          ))}
        </ol>
        <form className="step-form" ref={form} onSubmit={onSubmit} noValidate data-leave>
          <label className="step-form__honeypot" aria-hidden>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>

          <div className={`step-form__step${step === 0 ? " step-form__step--active" : ""}`} data-step="0">
            <LineField id="contact-name" label="Full name" invalid={bad("contact-name")}>
              <input
                className="line-field__control"
                id="contact-name"
                name="name"
                autoComplete="name"
                placeholder=" "
                required
                {...fieldEvents}
              />
            </LineField>
            <LineField id="contact-email" label="Email" invalid={bad("contact-email")}>
              <input
                className="line-field__control"
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder=" "
                required
                {...fieldEvents}
              />
            </LineField>
            <div className="step-form__nav">
              <span className="step-form__spacer" />
              <button type="button" className="step-btn step-btn--primary" onClick={() => go(1)} data-qa="contact-next">
                Continue
              </button>
            </div>
          </div>

          <div className={`step-form__step${step === 1 ? " step-form__step--active" : ""}`} data-step="1">
            <LineField id="contact-phone" label="Phone" invalid={bad("contact-phone")}>
              <input
                className="line-field__control"
                id="contact-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder=" "
                required
                {...fieldEvents}
              />
            </LineField>
            <LineField id="contact-preferred" label="Preferred contact" invalid={bad("contact-preferred")}>
              <select
                className="line-field__control"
                id="contact-preferred"
                name="preferred"
                required
                defaultValue=""
                {...fieldEvents}
              >
                <option value="" disabled hidden>
                  Choose one
                </option>
                <option>Call</option>
                <option>Email</option>
              </select>
            </LineField>
            <div className="step-form__nav">
              <button type="button" className="step-btn step-btn--ghost" onClick={() => go(-1)}>
                Back
              </button>
              <button type="button" className="step-btn step-btn--primary" onClick={() => go(1)} data-qa="contact-next">
                Continue
              </button>
            </div>
          </div>

          <div className={`step-form__step${step === 2 ? " step-form__step--active" : ""}`} data-step="2">
            <LineField id="contact-enquiry" label="Enquiry" invalid={bad("contact-enquiry")}>
              <select
                className="line-field__control"
                id="contact-enquiry"
                name="enquiry"
                required
                defaultValue=""
                {...fieldEvents}
              >
                <option value="" disabled hidden>
                  Select an enquiry type
                </option>
                {CONTACT.enquiryTypes.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </LineField>
            <LineField id="contact-message" label="Message" invalid={bad("contact-message")}>
              <textarea
                className="line-field__control"
                id="contact-message"
                name="message"
                rows={2}
                placeholder=" "
                required
                {...fieldEvents}
              />
            </LineField>
            <div className="step-form__nav">
              <button type="button" className="step-btn step-btn--ghost" onClick={() => go(-1)}>
                Back
              </button>
              <button type="submit" className="step-btn step-btn--primary" disabled={sending}>
                Send enquiry
              </button>
            </div>
          </div>
          {error ? <p className="lead-error">{CONTACT.error}</p> : null}
        </form>

        <div className="contact__success" ref={success} hidden={sentName === null}>
          <p className="contact__thanks">Thank you{sentName ? `, ${sentName}` : ""}.</p>
          <p className="contact__thanks-body">Your enquiry is with the team — we’ll be in touch shortly.</p>
        </div>

        <p className="contact__agents">
          Prefer to talk now?
          {CONTACT.agents.map((agent) => (
            <a key={agent.tel} href={`tel:${agent.tel}`}>
              {agent.name} · {agent.phone}
            </a>
          ))}
        </p>
      </div>

      <footer className="site-footer">
        <a className="wordmark" href="#top">
          <img src={WORDMARK} alt="Loam House" />
        </a>
        <p>
          {FOOTER.displaySuite[0]}
          <br />
          {FOOTER.displaySuite[1]}
        </p>
        <p>
          {FOOTER.release[0]}
          <br />
          {FOOTER.release[1]}
        </p>
        <span className="site-footer__legal">
          <Link href="/privacy-policy">Privacy</Link> · <Link href="/disclaimer">Disclaimer</Link>
        </span>
      </footer>
      <span className="impression">Artist’s impression</span>
    </section>
  );
}
