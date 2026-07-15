import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Kairo — The API client that respects your time";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle at 50% 15%, rgba(249,115,22,0.28), rgba(10,10,10,0) 60%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg,#fb923c,#ea580c)",
              color: "white",
              fontSize: 36,
              fontWeight: 800,
            }}
          >
            K
          </div>
          <div style={{ display: "flex", color: "white", fontSize: 40, fontWeight: 800 }}>
            Kairo
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 60,
            fontWeight: 800,
            backgroundImage: "linear-gradient(135deg, #fff, #fdba74 55%, #f97316)",
            backgroundClip: "text",
            color: "transparent",
            textAlign: "center",
            padding: "0 80px",
            lineHeight: 1.15,
          }}
        >
          The API client that respects your time
        </div>
        <div style={{ display: "flex", color: "#a3a3a3", fontSize: 26, marginTop: 28 }}>
          Fast · Scriptable · Multi-Protocol · Built with Rust
        </div>
      </div>
    ),
    { ...size }
  );
}
