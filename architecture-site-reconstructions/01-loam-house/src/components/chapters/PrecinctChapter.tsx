"use client";

import { useEffect, useRef } from "react";
import {
  AMENITIES,
  AMENITY_COLOR,
  BUILDINGS,
  BUS_STOP_RADIUS,
  BUS_STOPS,
  buildingFor,
  CATEGORY_LABEL,
  DOT_RADIUS,
  LANDMARKS,
  PLAN_CLIP,
  PLAN_PLACEMENT,
  ROAD_NAMES,
  STATION_RADIUS,
  STATIONS,
  SUBURBS,
  type MultiLineLabel,
} from "@/content/precinct-map";
import { PRECINCT } from "@/content/site";
import { publishEntryCamera } from "@/lib/map/bridge";
import { PLAN_TRANSFORM, PrecinctMapEngine, resolveMapElements } from "@/lib/map/engine";
import { ensureGsap } from "@/lib/motion/gsap";
import { JourneyIcon } from "@/components/site/icons";
import { ChapterPlate, Headline } from "./ChapterPlate";

/* eslint-disable @next/next/no-img-element -- the lens photo is swapped by the map engine */

function StackedLabel({ label, lineHeight, className }: { label: MultiLineLabel; lineHeight: number; className: string }) {
  const y0 = label.y - ((label.lines.length - 1) * lineHeight) / 2;
  return (
    <text className={className} textAnchor={className === "map-building-label" ? "middle" : undefined}>
      {label.lines.map((line, i) => (
        <tspan key={line + i} x={label.x} y={y0 + i * lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/**
 * 05 — The precinct. The thirteen resident amenities as dots on the site plan; click a dot
 * to dive into it, or pull out to see the building in its neighbourhood. The cartography
 * is rendered here; the camera, level of detail and dives belong to PrecinctMapEngine.
 */
export function PrecinctChapter() {
  const chapter = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!chapter.current) return;
    ensureGsap();
    const engine = new PrecinctMapEngine(resolveMapElements(chapter.current));
    publishEntryCamera(engine.camera);
    void engine.loadCartography("/assets/map/area_clean.svg", "/assets/map/precinct_clean.svg");
    return () => {
      publishEntryCamera(null);
      engine.destroy();
    };
  }, []);

  return (
    <section
      ref={chapter}
      className="precinct chapter"
      id="amenities"
      data-chapter="precinct"
      data-mode="precinct"
    >
      <div className="precinct__stage">
        <svg data-map="svg" className="precinct__map" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <clipPath id="plan-clip" clipPathUnits="userSpaceOnUse">
              <rect x={PLAN_CLIP.x} y={PLAN_CLIP.top} width={PLAN_CLIP.width} height={PLAN_CLIP.bottom - PLAN_CLIP.top} />
            </clipPath>
          </defs>
          {/* Camera rotation lives here, inside the SVG's own paint pass. */}
          <g data-map="spin">
            <g data-map="area" />
            <g data-map="suburbs" className="map-suburbs">
              {SUBURBS.map((s) => (
                <StackedLabel key={s.lines.join()} label={s} lineHeight={14} className="map-suburb-label" />
              ))}
              {LANDMARKS.map((l) => (
                <StackedLabel key={l.lines.join()} label={l} lineHeight={8} className="map-landmark-label" />
              ))}
            </g>
            <g data-map="roads" className="map-roads">
              {ROAD_NAMES.map((r, i) => (
                <text key={`${r.name}-${i}`} className="map-road-label" x={r.x} y={r.y}>
                  {r.name}
                </text>
              ))}
            </g>
            <g data-map="stations">
              {STATIONS.map((s) => {
                const labelLeft = s.x > 900;
                return (
                  <g key={s.name} className="map-station" data-x={s.x} data-y={s.y}>
                    <circle className="map-marker__halo" cx={s.x} cy={s.y} r={STATION_RADIUS} fill="#40453b" />
                    <circle cx={s.x} cy={s.y} r={STATION_RADIUS} />
                    <text
                      className="map-station__label"
                      x={s.x + (labelLeft ? -8 : 8)}
                      y={s.y}
                      textAnchor={labelLeft ? "end" : "start"}
                      dominantBaseline="central"
                    >
                      {s.name}
                    </text>
                  </g>
                );
              })}
            </g>
            <g data-map="busStops">
              {BUS_STOPS.map((s) => (
                <g key={s.name} className="map-bus-stop" data-x={s.x} data-y={s.y}>
                  <circle className="map-marker__halo" cx={s.x} cy={s.y} r={BUS_STOP_RADIUS} fill="#1c1e19" />
                  <circle cx={s.x} cy={s.y} r={BUS_STOP_RADIUS} fill="#1c1e19" />
                </g>
              ))}
            </g>
            <g transform={PLAN_TRANSFORM}>
              <g data-map="plan" clipPath="url(#plan-clip)" />
              <g data-map="buildingLabels">
                {BUILDINGS.map((b) => (
                  <StackedLabel key={b.name} label={b} lineHeight={15} className="map-building-label" />
                ))}
              </g>
            </g>
            <g data-map="dots" className="map-dots" transform={PLAN_TRANSFORM}>
              {AMENITIES.map((a) => (
                <g key={a.id} className="amenity-dot" data-id={a.id}>
                  <g className="amenity-dot__reveal" data-reveal="dot">
                    <circle className="amenity-dot__hit" cx={a.x} cy={a.y} r={DOT_RADIUS * 1.35} />
                    <g className="amenity-dot__halo">
                      <circle className="amenity-dot__ping" data-part="ping" cx={a.x} cy={a.y} r={DOT_RADIUS} fill={AMENITY_COLOR} />
                    </g>
                    <g className="amenity-dot__pulse" data-part="pulse">
                      <circle className="amenity-dot__core" cx={a.x} cy={a.y} r={DOT_RADIUS} fill={AMENITY_COLOR} />
                      <text
                        className="amenity-dot__num"
                        x={a.x}
                        y={a.y}
                        dy="0.22em"
                        transform={`rotate(${-PLAN_PLACEMENT.rotate} ${a.x} ${a.y})`}
                      >
                        {a.id}
                      </text>
                    </g>
                  </g>
                </g>
              ))}
            </g>
          </g>
        </svg>

        <div data-map="lens" className="precinct__lens" aria-hidden>
          <img data-map="lensImage" alt="" loading="lazy" decoding="async" />
        </div>

        <ChapterPlate num={PRECINCT.plate.num} title={PRECINCT.plate.title} />

        <div data-map="note" className="precinct__note">
          <p data-map="dotName" className="precinct__dot-name" aria-hidden />
          <p className="eyebrow" data-reveal="note-eyebrow">
            {PRECINCT.eyebrow}
          </p>
          <Headline lines={PRECINCT.headline} className="precinct__title" role="note-heading" />
          <p className="precinct__lede" data-reveal="note-body">
            {PRECINCT.lede}
          </p>
        </div>

        <div data-map="panels" className="precinct__panels">
          {AMENITIES.map((a) => (
            <div key={a.id} className="amenity-panel" data-panel={a.id}>
              <div className="amenity-panel__inner">
                <span className="amenity-panel__eyebrow" data-panel-part="eyebrow">
                  {CATEGORY_LABEL[a.category]} · {buildingFor(a)}
                </span>
                <h2 className="amenity-panel__title">{a.name}</h2>
                <p className="amenity-panel__body" data-panel-part="body">
                  {a.blurb}
                </p>
                <span className="amenity-panel__back" data-panel-part="back">
                  Click anywhere to return
                </span>
              </div>
            </div>
          ))}
        </div>

        <nav data-map="journey" className="precinct__journey" aria-label="Map view">
          <div data-reveal="chrome">
            <button type="button" className="journey-btn">
              <span className="journey-btn__out" title="See it in context">
                <JourneyIcon direction="out" />
                <span className="sr-only">See it in context</span>
              </span>
              <span className="journey-btn__back" title="Back to the precinct">
                <JourneyIcon direction="back" />
                <span className="sr-only">Back to the precinct</span>
              </span>
            </button>
          </div>
        </nav>
      </div>
    </section>
  );
}
