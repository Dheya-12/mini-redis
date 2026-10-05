"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type BagState = { count: number; total: number; last: string | null; add: (name: string, price: number) => void };
const BagContext = createContext<BagState | null>(null);

export function BagProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [last, setLast] = useState<string | null>(null);

  const add = useCallback((name: string, price: number) => {
    setCount((n) => n + 1);
    setTotal((t) => t + price);
    setLast(name);
  }, []);

  useEffect(() => {
    if (!last) return;
    const id = setTimeout(() => setLast(null), 2600);
    return () => clearTimeout(id);
  }, [last, count]);

  return (
    <BagContext.Provider value={{ count, total, last, add }}>
      {children}
      <div className="toast" role="status" aria-live="polite" data-show={last ? "true" : "false"}>
        {last ? `${last} added · ${count} in bag · $${total.toFixed(2)}` : ""}
      </div>
    </BagContext.Provider>
  );
}

function useBag() {
  const bag = useContext(BagContext);
  if (!bag) throw new Error("useBag must be used inside BagProvider");
  return bag;
}

export function BagButton() {
  const { count } = useBag();
  return (
    <a className="nav__bag" href="#beans">
      Bag <span className="nav__count">{count}</span>
    </a>
  );
}

export function AddToBag({ name, price }: { name: string; price: number }) {
  const { add } = useBag();
  return (
    <button type="button" className="btn btn--small" onClick={() => add(name, price)}>
      Add to bag
    </button>
  );
}
