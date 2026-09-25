"use client";

import { useEffect } from "react";
import { CALENDLY_URL, CONTACT } from "@/content/site";
import { useSiteUI } from "./SiteProvider";

/**
 * Stand-in for the third-party scheduling popup. With NEXT_PUBLIC_CALENDLY_URL set it
 * links out to the real scheduler (prefilled); otherwise it offers the sales phone lines.
 */
export function BookingDialog() {
  const { bookingOpen, closeBooking, bookingPrefill } = useSiteUI();

  useEffect(() => {
    if (!bookingOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeBooking();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bookingOpen, closeBooking]);

  const schedulerHref = (() => {
    if (!CALENDLY_URL) return "";
    const q = new URLSearchParams({ hide_gdpr_banner: "1", background_color: "ffffff", text_color: "1e211d", primary_color: "1e211d" });
    if (bookingPrefill.name) q.set("name", bookingPrefill.name);
    if (bookingPrefill.email) q.set("email", bookingPrefill.email);
    return `${CALENDLY_URL}?${q}`;
  })();

  return (
    <div
      className={`booking${bookingOpen ? " booking--open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-title"
      inert={!bookingOpen}
      onClick={(e) => e.target === e.currentTarget && closeBooking()}
    >
      <div className="booking__sheet">
        <button type="button" className="booking__close" aria-label="Close" onClick={closeBooking}>
          ×
        </button>
        <p className="eyebrow">Loam House · Sandringham</p>
        <h2 id="booking-title" className="booking__title">
          Book a private
          <br />
          <em>appointment.</em>
        </h2>
        <p className="booking__body">
          Visit the display suite at 216B Bay Road, Sandringham. Choose a time with the sales team, or call
          directly.
        </p>
        <div className="booking__actions">
          {schedulerHref ? (
            <a className="booking__btn" href={schedulerHref} target="_blank" rel="noopener noreferrer">
              Choose a time
            </a>
          ) : null}
          {CONTACT.agents.map((agent) => (
            <a key={agent.tel} className="booking__btn booking__btn--ghost" href={`tel:${agent.tel}`}>
              {agent.name} · {agent.phone}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
