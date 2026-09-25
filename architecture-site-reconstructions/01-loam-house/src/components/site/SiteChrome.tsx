"use client";

import { useEffect, useState } from "react";
import { NAV_LINKS, WORDMARK } from "@/content/site";
import { CalendarIcon, DownloadIcon } from "./icons";
import { useSiteUI } from "./SiteProvider";

/* eslint-disable @next/next/no-img-element -- the wordmark is a static PNG recoloured with CSS filters */

/** Fixed chrome: masthead, the phone burger and the phone menu sheet. */
export function SiteChrome() {
  return (
    <>
      <Masthead />
      <Burger />
      <MenuSheet />
    </>
  );
}

function Masthead() {
  const { openBooking } = useSiteUI();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`masthead${scrolled ? " masthead--scrolled" : ""}`}>
      <a className="wordmark" href="#top" aria-label="Loam House home" data-intro="brand">
        <img src={WORDMARK} alt="Loam House" />
      </a>
      <nav className="masthead__nav" aria-label="Primary navigation">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
      <div className="masthead__ctas">
        <a className="pill-btn" href="#enquire" data-intro="cta">
          <span className="pill-btn__fill" aria-hidden />
          <span className="pill-btn__icon" aria-hidden>
            <DownloadIcon arrowClassName="pill-btn__arrow" />
          </span>
          <span className="pill-btn__label">
            <span className="pill-btn__label-full">Download the brochure</span>
            <span className="pill-btn__label-short">Brochure</span>
          </span>
        </a>
        <button className="pill-btn" type="button" data-intro="cta" onClick={() => openBooking()}>
          <span className="pill-btn__fill" aria-hidden />
          <span className="pill-btn__icon" aria-hidden>
            <CalendarIcon dotClassName="pill-btn__dot" />
          </span>
          <span className="pill-btn__label">
            <span className="pill-btn__label-full">Book an appointment</span>
            <span className="pill-btn__label-short">Appointment</span>
          </span>
        </button>
      </div>
    </header>
  );
}

function Burger() {
  const { menuOpen, setMenuOpen } = useSiteUI();
  return (
    <button
      type="button"
      className={`burger${menuOpen ? " burger--open" : ""}`}
      aria-label={menuOpen ? "Close navigation" : "Open navigation"}
      aria-expanded={menuOpen}
      data-intro="burger"
      onClick={() => setMenuOpen(!menuOpen)}
    >
      <span className="burger__bar" />
      <span className="burger__bar" />
      <span className="burger__bar" />
    </button>
  );
}

function MenuSheet() {
  const { menuOpen, setMenuOpen, openBooking } = useSiteUI();
  const close = () => setMenuOpen(false);
  return (
    <div className={`menu-sheet${menuOpen ? " menu-sheet--open" : ""}`} data-menu-sheet inert={!menuOpen}>
      <div className="menu-sheet__stripes" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <i key={n} style={{ ["--n" as string]: n }} data-menu-stripe={n === 1 ? "" : undefined} />
        ))}
      </div>
      <div className="menu-sheet__inner">
        <div className="menu-sheet__head">
          <a className="wordmark" href="#top" aria-label="Loam House home" onClick={close}>
            <img src={WORDMARK} alt="Loam House" />
          </a>
        </div>
        <nav className="menu-sheet__nav" aria-label="Primary">
          {NAV_LINKS.map((link, i) => (
            <a key={link.href} className="menu-sheet__link" href={link.href} onClick={close}>
              <span className="menu-sheet__link-inner" style={{ ["--n" as string]: i }}>
                <em className="menu-sheet__index">{String(i + 1).padStart(2, "0")}</em>
                {link.label}
              </span>
            </a>
          ))}
        </nav>
        <div className="menu-sheet__foot">
          <div className="menu-sheet__ctas">
            <a className="menu-sheet__cta menu-sheet__cta--solid" href="#enquire" onClick={close}>
              <DownloadIcon />
              <span className="menu-sheet__cta-label">Download the brochure</span>
            </a>
            <button type="button" className="menu-sheet__cta menu-sheet__cta--ghost" onClick={() => openBooking()}>
              <CalendarIcon />
              <span className="menu-sheet__cta-label">Book an appointment</span>
            </button>
          </div>
          <div className="menu-sheet__contact">
            <p>Display Suite · 216B Bay Road, Sandringham VIC 3191</p>
            <p>Final release by Auyin</p>
          </div>
        </div>
      </div>
    </div>
  );
}

