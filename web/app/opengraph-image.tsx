import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          gap: 24,
          background: "#007aff",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            border: "6px solid #111111",
            background: "#ffffff",
            color: "#111111",
            padding: "24px 48px",
            boxShadow: "12px 12px 0 0 #111111",
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: 4,
          }}
        >
          JIPKOK.EXE
        </div>
        <div style={{ display: "flex", fontSize: 36, fontWeight: 600 }}>
          jipkok.app
        </div>
      </div>
    ),
    size,
  );
}
