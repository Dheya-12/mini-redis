import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { entranceLength, mirroredExitAt, mirrorEase, parseTicker, renderTicker } from "./timing.ts";

const targets = (n: number) => Array.from({ length: n });

describe("mirrorEase", () => {
  it("swaps in/out and keeps inOut", () => {
    assert.equal(mirrorEase("power3.out"), "power3.in");
    assert.equal(mirrorEase("power2.in"), "power2.out");
    assert.equal(mirrorEase("sine.inOut"), "sine.inOut");
    assert.equal(mirrorEase("expo.out"), "expo.in");
    assert.equal(mirrorEase(), "power2.in");
  });
});

describe("entranceLength", () => {
  it("is the latest finishing move, stagger included", () => {
    const moves = [
      { at: 0.1, duration: 4.4, targets: targets(3) },
      { at: 0, duration: 4.5, targets: targets(3) },
      { at: 1.6, duration: 1.8, stagger: 0.15, targets: targets(4) },
    ];
    assert.equal(entranceLength(moves), 4.5);
  });

  it("matches the precinct chapter clock (dots + slow note)", () => {
    const moves = [
      { at: 3.333, duration: 7.333, stagger: 0.333, targets: targets(13) },
      { at: 8.333, duration: 9, targets: targets(2) },
    ];
    assert.ok(Math.abs(entranceLength(moves) - 17.333) < 1e-9);
  });
});

describe("mirroredExitAt", () => {
  it("reflects a move about the end of the entrance", () => {
    // Entrance ends at 4.5; a move running 0.1→4.5 exits immediately at 4.5,
    // a move running 1.6→3.4 exits 1.1 beats after the hold.
    assert.equal(mirroredExitAt({ at: 0.1, duration: 4.4, targets: targets(1) }, 4.5), 4.5);
    assert.ok(Math.abs(mirroredExitAt({ at: 1.6, duration: 1.8, targets: targets(1) }, 4.5) - 5.6) < 1e-9);
  });

  it("honours an explicit exit position", () => {
    assert.equal(mirroredExitAt({ at: 3, duration: 7, exitAt: 1, targets: targets(13) }, 17.333), 18.333);
  });
});

describe("tickers", () => {
  it("counts big numbers from nearby and small ones from zero", () => {
    assert.equal(renderTicker(parseTicker("88"), 0), "49");
    assert.equal(renderTicker(parseTicker("3 min"), 0), "0 min");
    assert.equal(renderTicker(parseTicker("2–3"), 0), "0–0");
  });

  it("lands exactly on the authored figure", () => {
    for (const figure of ["88", "86–275", "112–156", "246.5–275", "3 min", "2–3"]) {
      assert.equal(renderTicker(parseTicker(figure), 1), figure);
    }
  });

  it("keeps decimals while counting", () => {
    assert.match(renderTicker(parseTicker("246.5–275"), 0.5), /^\d+\.\d–\d+$/);
  });
});
