"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import Modal from "./Modal";

type ParsedWord = {
  kyrgyz: string;
  russian: string;
  topic: string;
  type?: string;
  pos?: string;
  difficulty?: number;
};

type PreviewResult = {
  preview: true;
  total: number;
  new: number;
  duplicates: number;
  duplicateWords: string[];
};

type ImportResult = {
  imported: number;
  skipped: number;
};

type Props = {
  onClose: () => void;
  onImported: () => void;
};

export default function ImportModal({ onClose, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [words, setWords] = useState<ParsedWord[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  function parseFile(file: File) {
    setParseError(null);
    setPreview(null);
    setResult(null);
    setWords(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

        if (rows.length === 0) {
          setParseError("Файл пустой или не содержит данных");
          return;
        }

        const parsed: ParsedWord[] = [];
        const missing: number[] = [];

        rows.forEach((row, i) => {
          const kyrgyz = String(row["kyrgyz"] ?? row["кыргызское"] ?? row["Kyrgyz"] ?? "").trim();
          const russian = String(row["russian"] ?? row["русское"] ?? row["Russian"] ?? "").trim();
          const topic = String(row["topic"] ?? row["топик"] ?? row["Topic"] ?? "").trim();

          if (!kyrgyz || !russian || !topic) {
            missing.push(i + 2);
            return;
          }

          parsed.push({
            kyrgyz,
            russian,
            topic,
            type: String(row["type"] ?? row["тип"] ?? "").trim().toUpperCase() || undefined,
            pos: String(row["pos"] ?? "").trim() || undefined,
            difficulty: Number(row["difficulty"] ?? row["сложность"] ?? 0) || undefined,
          });
        });

        if (parsed.length === 0) {
          setParseError("Не найдено корректных строк. Нужны колонки: kyrgyz, russian, topic");
          return;
        }

        if (missing.length > 0) {
          setParseError(
            `${missing.length} строк пропущены (нет обязательных полей): строки ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "..." : ""}`
          );
        }

        setWords(parsed);
      } catch {
        setParseError("Не удалось прочитать файл. Убедитесь что это .xlsx или .csv");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    parseFile(files[0]);
  }

  async function handlePreview() {
    if (!words) return;
    setLoading(true);
    try {
      const res = await fetch("/api/words/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      setPreview(data);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Ошибка сервера");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!words) return;
    setLoading(true);
    try {
      const res = await fetch("/api/words/import?confirm=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      setResult(data);
      onImported();
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Ошибка сервера");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Импорт Excel / CSV" onClose={onClose}>
      {result ? (
        <div className="text-center py-4">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-lg font-medium text-gray-900 mb-1">Импорт завершён</p>
          <p className="text-gray-600">Добавлено: <strong>{result.imported}</strong> слов, пропущено дублей: <strong>{result.skipped}</strong></p>
          <button onClick={onClose} className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            Закрыть
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            }`}
          >
            <div className="text-3xl mb-2">📂</div>
            <p className="text-sm text-gray-600">Перетащи файл сюда или <span className="text-blue-600 font-medium">выбери файл</span></p>
            <p className="text-xs text-gray-400 mt-1">.xlsx, .xls, .csv</p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {parseError && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{parseError}</p>
          )}

          {/* Preview таблица */}
          {words && !preview && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Распознано <strong>{words.length}</strong> слов. Первые 5:</p>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Кыргызское</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Русское</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Топик</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {words.slice(0, 5).map((w, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-900">{w.kyrgyz}</td>
                        <td className="px-3 py-2 text-gray-700">{w.russian}</td>
                        <td className="px-3 py-2 text-gray-500">{w.topic}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={handlePreview}
                disabled={loading}
                className="mt-3 w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
              >
                {loading ? "Проверяем..." : "Проверить дубли →"}
              </button>
            </div>
          )}

          {/* Результат проверки */}
          {preview && (
            <div>
              <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
                <div className="px-4 py-3 flex justify-between text-sm">
                  <span className="text-gray-600">Всего в файле</span>
                  <span className="font-medium">{preview.total}</span>
                </div>
                <div className="px-4 py-3 flex justify-between text-sm">
                  <span className="text-green-700">Новых слов</span>
                  <span className="font-medium text-green-700">{preview.new}</span>
                </div>
                <div className="px-4 py-3 flex justify-between text-sm">
                  <span className="text-amber-700">Дублей (пропустим)</span>
                  <span className="font-medium text-amber-700">{preview.duplicates}</span>
                </div>
              </div>

              {preview.duplicateWords.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Дубли: {preview.duplicateWords.slice(0, 8).join(", ")}{preview.duplicateWords.length > 8 ? "..." : ""}
                </p>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={() => { setPreview(null); setWords(null); }}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  Отмена
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || preview.new === 0}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {loading ? "Импортируем..." : `Добавить ${preview.new} слов`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
