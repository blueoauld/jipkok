import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        background: "#ffffff",
        color: "#191f28",
      }}
    >
      <div
        style={{
          display: "flex",
          width: 96,
          height: 8,
          borderRadius: 999,
          background: "#3182f6",
        }}
      />
      <div
        style={{
          display: "flex",
          fontSize: 112,
          fontWeight: 700,
          letterSpacing: -2,
        }}
      >
        Jipkok
      </div>
      <div style={{ display: "flex", fontSize: 36, color: "#6b7684" }}>
        Start a conversation with someone nearby
      </div>
    </div>,
    size,
  );
}
