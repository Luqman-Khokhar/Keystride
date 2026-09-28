import { ImageResponse } from "next/og";
import { testLabel } from "@/lib/format";
import { getPublicResult } from "@/lib/results";
import { SITE_URL } from "@/lib/site";

export const alt = "Typing test result on Keystride";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default "serika" theme tokens (images can't read CSS variables).
const C = { bg: "#1e1f22", bgAlt: "#2a2c30", sub: "#8a8d93", text: "#d8d6cc", main: "#e2b714" };

/** Polyline points for the wpm-over-time sparkline. */
function sparkline(values: number[], w: number, h: number): string {
  if (values.length < 2) return "";
  const max = Math.max(...values, 1);
  return values
    .map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`)
    .join(" ");
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const r = await getPublicResult((await params).id);

  if (!r) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, color: C.text, fontSize: 72, fontFamily: "monospace" }}>
          key<span style={{ color: C.main }}>stride</span>
        </div>
      ),
      size,
    );
  }

  const points = sparkline(r.samples.map((s) => s.wpm), 1020, 150);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: "60px 90px", background: C.bg, color: C.text, fontFamily: "monospace" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 36 }}>
          <div style={{ display: "flex" }}>
            key<span style={{ color: C.main }}>stride</span>
          </div>
          <div style={{ display: "flex", color: C.sub }}>{testLabel(r)}</div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 70, marginTop: 50 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 40, color: C.sub }}>wpm</div>
            <div style={{ display: "flex", fontSize: 190, lineHeight: 1, color: C.main, fontWeight: 700 }}>{Math.round(r.wpm)}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 20 }}>
            <div style={{ display: "flex", fontSize: 40, color: C.sub }}>acc</div>
            <div style={{ display: "flex", fontSize: 96, lineHeight: 1, color: C.main }}>{Math.round(r.accuracy)}%</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 24 }}>
            <div style={{ display: "flex", fontSize: 40, color: C.sub }}>by</div>
            <div style={{ display: "flex", fontSize: 56, lineHeight: 1.2 }}>{r.username}</div>
          </div>
        </div>

        {points && (
          <svg width="1020" height="130" viewBox="0 0 1020 150" style={{ marginTop: 40 }}>
            <polyline points={points} fill="none" stroke={C.main} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        )}

        <div style={{ display: "flex", marginTop: "auto", fontSize: 30, color: C.sub }}>
          can you beat it? → {new URL(SITE_URL).host}
        </div>
      </div>
    ),
    size,
  );
}
