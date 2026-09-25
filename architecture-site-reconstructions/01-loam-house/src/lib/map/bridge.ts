"use client";

import type { EntryCamera } from "./engine";

/**
 * Hand-off between the precinct map (which owns the camera) and the page's motion engine
 * (which drives the camera's scrubbed entry on the chapter clock).
 */
let camera: EntryCamera | null = null;
const waiting = new Set<(c: EntryCamera) => void>();

export function publishEntryCamera(c: EntryCamera | null) {
  camera = c;
  if (c) waiting.forEach((fn) => fn(c));
}

/** Calls `fn` with the camera as soon as it exists. Returns an unsubscribe. */
export function withEntryCamera(fn: (c: EntryCamera) => void) {
  if (camera) {
    fn(camera);
    return () => {};
  }
  waiting.add(fn);
  return () => void waiting.delete(fn);
}
