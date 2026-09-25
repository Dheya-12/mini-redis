"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type SiteUI = {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  bookingOpen: boolean;
  openBooking: (prefill?: { name?: string; email?: string }) => void;
  closeBooking: () => void;
  bookingPrefill: { name?: string; email?: string };
};

const SiteUIContext = createContext<SiteUI | null>(null);

/** Page-wide UI state: the phone menu sheet and the appointment dialog. */
export function SiteProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<SiteUI["bookingPrefill"]>({});

  const openBooking = useCallback((prefill: SiteUI["bookingPrefill"] = {}) => {
    setBookingPrefill(prefill);
    setMenuOpen(false);
    setBookingOpen(true);
  }, []);
  const closeBooking = useCallback(() => setBookingOpen(false), []);

  const value = useMemo(
    () => ({ menuOpen, setMenuOpen, bookingOpen, openBooking, closeBooking, bookingPrefill }),
    [menuOpen, bookingOpen, openBooking, closeBooking, bookingPrefill],
  );
  return <SiteUIContext.Provider value={value}>{children}</SiteUIContext.Provider>;
}

export function useSiteUI() {
  const ctx = useContext(SiteUIContext);
  if (!ctx) throw new Error("useSiteUI must be used inside <SiteProvider>");
  return ctx;
}
