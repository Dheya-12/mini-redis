import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cameraPath, easeInOutPow, easeInOutSine, MARKER_CURVES, markerRadius, ramp, type ViewBox } from "./camera.ts";

const close = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

describe("cameraPath", () => {
  const precinct: ViewBox = [853.25, 318.6, 117, 83];
  const area: ViewBox = [-150, -400, 1500, 1500];

  it("starts and ends exactly on its frames", () => {
    const path = cameraPath(area, precinct);
    path.at(0).forEach((v, i) => close(v, area[i]));
    path.at(1).forEach((v, i) => close(v, precinct[i], 1e-4));
  });

  it("zooms out mid-flight when panning far (the van Wijk arc)", () => {
    const a: ViewBox = [0, 0, 10, 10];
    const b: ViewBox = [1000, 0, 10, 10];
    const mid = cameraPath(a, b).at(0.5);
    assert.ok(mid[2] > 10, "mid-flight width should exceed both ends");
  });

  it("handles a pure zoom", () => {
    const path = cameraPath([0, 0, 100, 100], [25, 25, 50, 50]);
    const mid = path.at(0.5);
    close(mid[0] + mid[2] / 2, 50);
    close(mid[2], Math.sqrt(100 * 50)); // geometric interpolation of width
    assert.ok(path.length > 0);
  });
});

describe("eases and ramps", () => {
  it("are anchored at 0 and 1", () => {
    close(easeInOutSine(0), 0);
    close(easeInOutSine(1), 1);
    close(easeInOutPow(0.5, 4), 0.5);
    close(easeInOutPow(1, 4), 1);
    assert.equal(ramp(5, 10, 20), 0);
    assert.equal(ramp(25, 10, 20), 1);
    close(ramp(15, 10, 20), 0.5);
  });
});

describe("markerRadius", () => {
  it("hits its anchors and clamps outside them", () => {
    close(markerRadius(MARKER_CURVES.amenity, 80), 24);
    assert.equal(markerRadius(MARKER_CURVES.amenity, 5000), 1.5);
    assert.equal(markerRadius(MARKER_CURVES.amenity, 0.1), 1600);
  });

  it("grows monotonically as the camera closes in", () => {
    let prev = 0;
    for (const w of [500, 300, 117, 80, 20, 5, 1]) {
      const r = markerRadius(MARKER_CURVES.amenity, w);
      assert.ok(r > prev);
      prev = r;
    }
  });
});
