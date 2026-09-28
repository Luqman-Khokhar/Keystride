"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import type { SecondSample } from "@/lib/engine/types";
import { CloseIcon } from "@/components/ui/icons";

interface ResultChartProps {
  samples: SecondSample[];
}

const HEIGHT = 200;
const PAD = { top: 12, right: 36, bottom: 24, left: 36 };

function niceMax(v: number) {
  if (v <= 0) return 10;
  const step = v > 100 ? 50 : v > 40 ? 20 : 10;
  return Math.ceil(v / step) * step;
}

/** Hand-rolled SVG chart: wpm + raw lines, error markers on a right axis. */
export function ResultChart({ samples }: ResultChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    const innerW = Math.max(0, width - PAD.left - PAD.right);
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const yMax = niceMax(Math.max(...samples.map((s) => Math.max(s.wpm, s.raw))));
    const errMax = Math.max(1, ...samples.map((s) => s.errors));
    const n = samples.length;
    const x = (i: number) => PAD.left + (n > 1 ? (i / (n - 1)) * innerW : innerW / 2);
    const y = (v: number) => PAD.top + innerH - (v / yMax) * innerH;
    const yErr = (v: number) => PAD.top + innerH - (v / errMax) * innerH;
    const path = (key: "wpm" | "raw") =>
      samples.map((s, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(s[key]).toFixed(1)}`).join("");
    const xTickEvery = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(innerW / 48))));
    return { innerW, innerH, yMax, errMax, x, y, yErr, path, xTickEvery };
  }, [samples, width]);

  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / Math.max(1, rect.width);
    setHover(Math.round(rel * (samples.length - 1)));
  };

  const h = hover !== null ? samples[hover] : null;
  const summary = `Speed over time: ${samples.length} seconds, peak raw ${Math.round(
    Math.max(...samples.map((s) => s.raw)),
  )} wpm.`;

  return (
    <div className="w-full">
      <div className="mb-1 flex h-5 flex-wrap items-center gap-x-4 text-xs text-sub" aria-live="polite">
        {h ? (
          <>
            <span>{h.second}s</span>
            <span className="text-main">WPM {Math.round(h.wpm)}</span>
            <span className="text-text">Raw {Math.round(h.raw)}</span>
            <span className="text-error">Errors {h.errors}</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1">
              <span aria-hidden="true" className="h-0.5 w-4 bg-main" /> WPM
            </span>
            <span className="flex items-center gap-1">
              <span aria-hidden="true" className="h-0.5 w-4 border-t-2 border-dashed border-sub" /> Raw
            </span>
            <span className="flex items-center gap-1">
              <CloseIcon className="size-3 text-error" /> Errors
            </span>
          </>
        )}
      </div>

      <div ref={wrapRef} className="w-full" style={{ height: HEIGHT }}>
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="img" aria-label={summary} className="block">
            {/* grid + y axis */}
            {[0, 0.5, 1].map((f) => {
              const v = geo.yMax * f;
              return (
                <g key={f}>
                  <line
                    x1={PAD.left}
                    x2={PAD.left + geo.innerW}
                    y1={geo.y(v)}
                    y2={geo.y(v)}
                    className="stroke-sub-alt"
                    strokeWidth={1}
                  />
                  <text x={PAD.left - 8} y={geo.y(v)} dy="0.32em" textAnchor="end" className="fill-sub text-xs">
                    {Math.round(v)}
                  </text>
                </g>
              );
            })}
            {/* right axis: errors (only when there were any) */}
            {samples.some((s) => s.errors > 0) && (
              <text
                x={PAD.left + geo.innerW + 8}
                y={geo.yErr(geo.errMax)}
                dy="0.32em"
                className="fill-error text-xs"
              >
                {geo.errMax}
              </text>
            )}
            {/* x axis */}
            {samples.map((s, i) =>
              i % geo.xTickEvery === 0 || i === samples.length - 1 ? (
                <text
                  key={s.second}
                  x={geo.x(i)}
                  y={HEIGHT - 6}
                  textAnchor="middle"
                  className="fill-sub text-xs"
                >
                  {s.second}
                </text>
              ) : null,
            )}

            <path d={geo.path("raw")} fill="none" className="chart-fade stroke-sub" strokeWidth={2} strokeDasharray="4 4" strokeLinejoin="round" />
            <path d={geo.path("wpm")} pathLength={1} fill="none" className="chart-draw stroke-main" strokeWidth={2.5} strokeLinejoin="round" />

            {samples.map((s, i) =>
              s.errors > 0 ? (
                <path
                  key={`e${s.second}`}
                  d={`M${geo.x(i) - 3},${geo.yErr(s.errors) - 3}l6,6m0,-6l-6,6`}
                  className="chart-fade stroke-error"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                />
              ) : null,
            )}

            {h && hover !== null && (
              <line
                x1={geo.x(hover)}
                x2={geo.x(hover)}
                y1={PAD.top}
                y2={PAD.top + geo.innerH}
                className="stroke-sub"
                strokeWidth={1}
              />
            )}

            <rect
              x={PAD.left}
              y={PAD.top}
              width={geo.innerW}
              height={geo.innerH}
              fill="transparent"
              onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
            />
          </svg>
        )}
      </div>
    </div>
  );
}
