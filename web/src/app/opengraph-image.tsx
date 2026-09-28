import { ImageResponse } from "next/og";

export const alt = "Keystride — minimal, fast typing speed test";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Colors mirror the default "serika" theme tokens (images can't read CSS variables).
const C = { bg: "#1e1f22", sub: "#8a8d93", text: "#d8d6cc", main: "#e2b714" };

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 90, background: C.bg, color: C.text, fontFamily: "monospace" }}>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700 }}>
          key<span style={{ color: C.main }}>stride</span>
        </div>
        <div style={{ display: "flex", fontSize: 40, color: C.sub, marginTop: 24 }}>minimal, fast typing speed test</div>
        <div style={{ display: "flex", fontSize: 34, marginTop: 64, gap: 12 }}>
          <span style={{ color: C.text }}>the quick brown fox</span>
          <span style={{ width: 4, height: 44, background: C.main }} />
          <span style={{ color: C.sub }}>jumps over the lazy dog</span>
        </div>
      </div>
    ),
    size,
  );
}
