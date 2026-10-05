"use client";

import { useState } from "react";
import { methods } from "@/lib/data";

export default function BrewCalculator() {
  const [methodId, setMethodId] = useState("v60");
  const [dose, setDose] = useState(20);
  const m = methods.find((x) => x.id === methodId) ?? methods[0];
  const water = dose * m.ratio;

  return (
    <div className="calc">
      <div className="calc__methods" role="tablist" aria-label="Brew method">
        {methods.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={x.id === methodId}
            className="chip"
            onClick={() => setMethodId(x.id)}
          >
            {x.name}
          </button>
        ))}
      </div>

      <label className="calc__dose" htmlFor="dose">
        <span className="label">Coffee</span>
        <output htmlFor="dose" className="calc__big">{dose}<small> g</small></output>
      </label>
      <input
        id="dose"
        type="range"
        min={10}
        max={60}
        step={1}
        value={dose}
        onChange={(e) => setDose(Number(e.target.value))}
      />

      <dl className="calc__out">
        <div><dt>Water</dt><dd>{water} g</dd></div>
        <div><dt>Ratio</dt><dd>1 : {m.ratio}</dd></div>
        <div><dt>Bloom</dt><dd>{m.bloom ? `${dose * 2} g · 0:45` : "None"}</dd></div>
        <div><dt>Water temp</dt><dd>{m.temp} °C</dd></div>
        <div><dt>Brew time</dt><dd>{m.time}</dd></div>
        <div><dt>Grind</dt><dd>{m.grind}</dd></div>
      </dl>
      <p className="calc__yield">Makes about {Math.round(water * 0.9)} ml in the cup.</p>
    </div>
  );
}
