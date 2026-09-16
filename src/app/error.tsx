"use client";

import { useEffect } from "react";

export default function Error({
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
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-xl font-bold text-gray-900">Что-то пошло не так</h1>
        <p className="text-sm text-gray-500">
          Произошла непредвиденная ошибка. Попробуйте ещё раз.
        </p>
        <div className="space-y-3 pt-2">
          <button
            onClick={reset}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-colors"
          >
            Попробовать снова
          </button>
          <a
            href="/dashboard"
            className="block w-full py-3.5 border border-gray-300 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
          >
            На главную
          </a>
        </div>
      </div>
    </main>
  );
}
