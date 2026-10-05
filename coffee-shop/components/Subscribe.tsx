"use client";

import { useState } from "react";

export default function Subscribe() {
  const [done, setDone] = useState(false);
  return (
    <form
      className="sub"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      <label className="label" htmlFor="email">Roast notes, every other Friday</label>
      <p className="muted">What we&apos;re roasting next, and when the good lots land.</p>
      {done ? (
        <p className="sub__done" role="status">You&apos;re on the list. First letter goes out Friday.</p>
      ) : (
        <div className="sub__row">
          <input id="email" type="email" required placeholder="you@example.com" autoComplete="email" />
          <button className="btn" type="submit">Subscribe</button>
        </div>
      )}
    </form>
  );
}
