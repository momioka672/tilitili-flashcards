"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ru">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f9fafb" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 16px",
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 48 }}>⚠️</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
              Критическая ошибка
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 20 }}>
              Приложение не смогло загрузиться.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "12px 24px",
                background: "#2563eb",
                color: "#fff",
                fontWeight: 600,
                border: "none",
                borderRadius: 16,
                cursor: "pointer",
              }}
            >
              Перезагрузить
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
