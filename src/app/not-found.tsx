import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="text-6xl font-extrabold text-blue-600">404</div>
        <h1 className="text-xl font-bold text-gray-900">Страница не найдена</h1>
        <p className="text-sm text-gray-500">
          Возможно, ссылка устарела или страница была удалена.
        </p>
        <Link
          href="/dashboard"
          className="block w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-colors"
        >
          На главную
        </Link>
      </div>
    </main>
  );
}
