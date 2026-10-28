"use client";

// Last resort: only renders when the root layout itself fails, so it can't use
// the app providers, i18n or the design-system components. Plain and bilingual.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#F5F4EF",
          color: "#12211D",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 360 }}>
          <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Algo salió mal · Something went wrong</h1>
          <p style={{ margin: "0 0 20px", color: "#4a5a55" }}>
            Ocurrió un error inesperado. · An unexpected error happened.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              height: 48,
              padding: "0 24px",
              borderRadius: 999,
              border: 0,
              background: "#0F6E62",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar · Try again
          </button>
        </div>
      </body>
    </html>
  );
}
