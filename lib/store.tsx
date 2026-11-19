"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { brandScale } from "./color";
import type { Plan } from "./plan";

export type Theme = "light" | "dark" | "hc";
export type SavedCopy = { title: string; body: string; cta: string };

type Persisted = {
  theme: Theme;
  brand: string;
  stamps: number[];
  plan: Plan | null;
  savedCopy: SavedCopy | null;
};

type Store = Persisted & {
  setTheme: (t: Theme) => void;
  setBrand: (hex: string) => void;
  stamp: (stop: number) => void;
  setPlan: (p: Plan) => void;
  setSavedCopy: (c: SavedCopy) => void;
  reset: () => void;
  justStamped: number | null;
  announce: (msg: string) => void;
};

export const DEFAULT_BRAND = "#3b4bdb";
const KEY = "dbm:v1";
const initial: Persisted = { theme: "light", brand: DEFAULT_BRAND, stamps: [], plan: null, savedCopy: null };

const Ctx = createContext<Store | null>(null);

function load(): Persisted | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    // Older saves may carry a `density` field; keep only the fields we still use.
    const { density: _density, ...saved } = JSON.parse(raw) as Partial<Persisted> & { density?: unknown };
    return { ...initial, ...saved };
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(initial);
  const [justStamped, setJustStamped] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  // State, not a ref: the save effect must skip the commit that still holds the defaults.
  // With a ref, React dev mode (effects run twice) saved the defaults over the stored progress.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = load();
    if (saved) setState(saved);
    else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) setState((s) => ({ ...s, theme: "dark" }));
    setLoaded(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = state.theme;
    const { light, dark, hc } = brandScale(state.brand);
    root.style.setProperty("--brand-light", light);
    root.style.setProperty("--brand-dark", dark);
    root.style.setProperty("--brand-hc", hc);
    if (!loaded) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* private mode: progress just won't survive a reload */
    }
  }, [state, loaded]);

  const announce = useCallback((msg: string) => {
    setMessage("");
    window.setTimeout(() => setMessage(msg), 30);
  }, []);

  const stamp = useCallback(
    (stop: number) => {
      setState((s) => {
        if (s.stamps.includes(stop)) return s;
        const stamps = [...s.stamps, stop].sort((a, b) => a - b);
        announce(`Stamp earned for stop ${String(stop).padStart(2, "0")}. ${stamps.length} of 10 stamps.`);
        return { ...s, stamps };
      });
      setJustStamped(stop);
      window.setTimeout(() => setJustStamped((j) => (j === stop ? null : j)), 1400);
    },
    [announce],
  );

  const value = useMemo<Store>(
    () => ({
      ...state,
      justStamped,
      announce,
      stamp,
      setTheme: (theme) => setState((s) => ({ ...s, theme })),
      setBrand: (brand) => setState((s) => ({ ...s, brand })),
      setPlan: (plan) => setState((s) => ({ ...s, plan })),
      setSavedCopy: (savedCopy) => setState((s) => ({ ...s, savedCopy })),
      reset: () => setState({ ...initial, theme: state.theme }),
    }),
    [state, justStamped, announce, stamp],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="sr-only" role="status" aria-live="polite">
        {message}
      </div>
    </Ctx.Provider>
  );
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}
