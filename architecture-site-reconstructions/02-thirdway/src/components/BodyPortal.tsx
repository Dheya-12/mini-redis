"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Renders its children at the end of <body>, outside the page's stacking context (like the original's dialogs). */
export default function BodyPortal({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the portal target only exists after hydration
  useEffect(() => setHost(document.body), []);
  return host ? createPortal(children, host) : null;
}
