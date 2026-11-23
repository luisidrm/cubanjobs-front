import { ImageResponse } from "next/og";

export const alt = "Brújula — Empleo y talento en Cuba";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default share preview for every page without its own image (WhatsApp, Telegram, Facebook).
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 90,
        background: "#0F6E62",
        color: "#F5F4EF",
      }}
    >
      <div style={{ fontSize: 120, fontWeight: 700, letterSpacing: -3 }}>
        Brújula
      </div>
      <div style={{ fontSize: 52, marginTop: 24, opacity: 0.95 }}>
        Empleo y talento en Cuba
      </div>
      <div style={{ fontSize: 34, marginTop: 40, opacity: 0.75 }}>
        Jobs and talent · CUP · MLC · USD
      </div>
    </div>,
    size,
  );
}
