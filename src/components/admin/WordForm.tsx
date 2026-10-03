"use client";

import { useState } from "react";

export type WordFormData = {
  kyrgyz: string;
  russian: string;
  type: string;
  topic: string;
  pos: string;
  difficulty: string;
};

type Props = {
  initial?: Partial<WordFormData>;
  onSubmit: (data: WordFormData) => Promise<void>;
  submitLabel: string;
};

const TOPICS = ["Природа", "Погода", "Общее", "Работа", "Еда", "Семья", "Школа", "Язык", "Животные", "Дом", "Город", "Транспорт", "Одежда", "Здоровье", "Время", "Цвета", "Праздник", "Эмоции", "Спорт", "Путешествия"];

const POS_OPTIONS: [value: string, label: string][] = [
  ["noun", "Существительное"],
  ["verb", "Глагол"],
  ["adj", "Прилагательное"],
  ["adv", "Наречие"],
  ["pronoun", "Местоимение"],
  ["numeral", "Числительное"],
  ["particle", "Частица"],
  ["phrase", "Фраза"],
];

export default function WordForm({ initial, onSubmit, submitLabel }: Props) {
  const [form, setForm] = useState<WordFormData>({
    kyrgyz: initial?.kyrgyz ?? "",
    russian: initial?.russian ?? "",
    type: initial?.type ?? "WORD",
    topic: initial?.topic ?? "",
    pos: initial?.pos ?? "",
    difficulty: initial?.difficulty ?? "1",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: keyof WordFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.kyrgyz || !form.russian || !form.topic) {
      setError("Заполните обязательные поля: кыргызское слово, перевод, топик");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onSubmit(form);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Кыргызское слово *</label>
        <input value={form.kyrgyz} onChange={(e) => set("kyrgyz", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Перевод (рус.) *</label>
        <input value={form.russian} onChange={(e) => set("russian", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Топик *</label>
          <select value={form.topic} onChange={(e) => set("topic", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">— выбрать —</option>
            {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
          <select value={form.type} onChange={(e) => set("type", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="WORD">Слово</option>
            <option value="PHRASE">Фраза</option>
            <option value="IDIOM">Идиома</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Часть речи</label>
          <select value={form.pos} onChange={(e) => set("pos", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">— не указано —</option>
            {POS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Сложность</label>
          <select value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="1">1 — лёгкое</option>
            <option value="2">2 — среднее</option>
            <option value="3">3 — сложное</option>
          </select>
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors mt-2">
        {loading ? "Сохраняем..." : submitLabel}
      </button>
    </form>
  );
}
