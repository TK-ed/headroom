"use client";

import { useEffect, useState } from "react";

export type ChartTokens = {
  actual: string;
  forecast: string;
  band: string;
  grid: string;
  axis: string;
  surface: string;
};

const LIGHT: ChartTokens = {
  actual: "#2a78d6",
  forecast: "#eb6834",
  band: "rgba(235,104,52,0.13)",
  grid: "#e6e3da",
  axis: "#6b6960",
  surface: "#fbfaf7",
};

function read(): ChartTokens {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
  return {
    actual: v("--series-actual", LIGHT.actual),
    forecast: v("--series-forecast", LIGHT.forecast),
    band: v("--band", LIGHT.band),
    grid: v("--grid", LIGHT.grid),
    axis: v("--muted-foreground", LIGHT.axis),
    surface: v("--card", LIGHT.surface),
  };
}

/**
 * Recharts takes literal colours, not CSS variables in every prop, so we read
 * the theme tokens and re-read them when the OS scheme or the theme toggle changes.
 */
export function useChartTokens(): ChartTokens {
  const [tokens, setTokens] = useState(LIGHT);

  useEffect(() => {
    const update = () => setTokens(read());
    update();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", update);
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      mq.removeEventListener("change", update);
      mo.disconnect();
    };
  }, []);

  return tokens;
}
