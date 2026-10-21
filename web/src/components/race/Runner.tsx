"use client";

/**
 * Pixel-art racers on a 12×12 grid. "#" = lane color, "w" = light accent, "o" = eye.
 * Two frames (stride, passing) swap at a pace set by the racer's wpm; see .runner in globals.css.
 */
const BASE = [
  "............",
  "............",
  "...######...",
  "...######...",
  "...####o#...",
  "...######...",
  "....####....",
  "............",
  "....####....",
  "............",
  "............",
  "............",
];

const FRAMES: Record<number, string>[] = [
  {
    7: "...#####.#..",
    9: "...##..##...",
    10: "..##....##..",
    11: "..#......#..",
  },
  {
    7: "...######...",
    9: "....####....",
    10: ".....##.....",
    11: ".....###....",
  },
];

/** One character per lane color, drawn over the base body. */
const CHARACTERS: Record<number, Record<number, string>> = {
  // Fox: tall ears, white-tipped tail.
  1: {
    0: "...#....#...",
    1: "...##..##...",
    7: "w#..........",
    8: ".###........",
  },
  // Robot: antenna and visor.
  2: {
    0: "......w.....",
    1: "......#.....",
    4: "...#www#....",
  },
  // Cat: small ears, whiskers, tail curled up.
  3: {
    1: "...#....#...",
    5: ".........ww.",
    6: ".#..........",
    7: ".#..........",
    8: "..##........",
  },
  // Ninja: headband with tails flying behind.
  4: {
    3: "ww.wwwwww...",
    4: "w...........",
  },
};

const FILL: Record<string, string> = { "#": "runner-body", w: "runner-light", o: "runner-eye" };

/** One path per fill class: a 1×1 square for every pixel of that class. */
function framePaths(color: number, frame: number): [string, string][] {
  const overlay = CHARACTERS[color] ?? {};
  const d: Record<string, string> = {};
  BASE.forEach((base, y) => {
    const rows = [FRAMES[frame][y] ?? base, overlay[y]];
    for (let x = 0; x < 12; x++) {
      const px = rows.reduce((acc, row) => (row && row[x] !== "." ? row[x] : acc), ".");
      if (px === ".") continue;
      d[px] = (d[px] ?? "") + `M${x} ${y}h1v1h-1z`;
    }
  });
  return Object.entries(d);
}

const SPRITES: Record<number, [string, string][][]> = Object.fromEntries(
  Object.keys(CHARACTERS).map((c) => [c, FRAMES.map((_, f) => framePaths(Number(c), f))]),
);

export type RunnerState = "run" | "idle" | "win";

/** Stride cycle: faster typists take faster steps. Rounded so small wpm changes don't jolt the loop. */
function cycleSeconds(wpm: number): string {
  const s = Math.min(0.7, Math.max(0.24, 30 / Math.max(wpm, 1)));
  return `${Math.round(s * 20) / 20}s`;
}

export function Runner({
  color,
  state,
  wpm,
  className = "",
}: {
  color: number;
  state: RunnerState;
  wpm: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      className={`runner ${className}`}
      data-state={state}
      style={{ "--run-dur": cycleSeconds(wpm) } as React.CSSProperties}
    >
      <g className="runner-all">
        {(SPRITES[color] ?? SPRITES[1]).map((paths, f) => (
          <g key={f} className={`runner-f${f + 1}`}>
            {paths.map(([px, d]) => (
              <path key={px} d={d} className={FILL[px]} />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
