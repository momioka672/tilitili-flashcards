"use client";

import { useEffect, useState, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import WordForm, { WordFormData } from "@/components/admin/WordForm";
import ImportModal from "@/components/admin/ImportModal";

type Word = {
  id: string;
  kyrgyz: string;
  russian: string;
  type: string;
  topic: string;
  pos: string | null;
  difficulty: number;
};

const TOPICS = ["", "Природа", "Погода", "Общее", "Работа", "Еда", "Семья", "Школа", "Язык", "Животные", "Дом", "Город", "Транспорт", "Одежда", "Здоровье", "Время", "Цвета", "Праздник", "Эмоции", "Спорт", "Путешествия"];
const TYPE_LABELS: Record<string, string> = { WORD: "Слово", PHRASE: "Фраза", IDIOM: "Идиома" };

export default function AdminWordsPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [topic, setTopic] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editWord, setEditWord] = useState<Word | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const PAGE_SIZE = 50;

  const fetchWords = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (topic) params.set("topic", topic);
    if (type) params.set("type", type);
    if (search) params.set("search", search);
    const res = await fetch(`/api/words?${params}`);
    const data = await res.json();
    setWords(data.words ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, topic, type, search]);

  useEffect(() => { fetchWords(); }, [fetchWords]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  async function handleAdd(form: WordFormData) {
    const res = await fetch("/api/words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, difficulty: Number(form.difficulty) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Ошибка");
    setShowAdd(false);
    setPage(1);
    fetchWords();
  }

  async function handleEdit(form: WordFormData) {
    if (!editWord) return;
    const res = await fetch(`/api/words/${editWord.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, difficulty: Number(form.difficulty) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Ошибка");
    setEditWord(null);
    fetchWords();
  }

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/words/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    fetchWords();
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Словарь <span className="text-gray-400 font-normal text-base">({total} слов)</span></h1>
          <div className="flex gap-2">
            <button onClick={() => setShowImport(true)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm">
              Импорт Excel
            </button>
            <button onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm">
              + Добавить слово
            </button>
          </div>
        </div>

        {/* Фильтры */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 min-w-48">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Поиск по слову..."
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">Найти</button>
          </form>

          <select value={topic} onChange={(e) => { setTopic(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Все топики</option>
            {TOPICS.filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Все типы</option>
            <option value="WORD">Слово</option>
            <option value="PHRASE">Фраза</option>
            <option value="IDIOM">Идиома</option>
          </select>
        </div>

        {/* Таблица */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400">Загружаем...</div>
          ) : words.length === 0 ? (
            <div className="py-16 text-center text-gray-400">Слов не найдено</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Кыргызское</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Перевод</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Тип</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Топик</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Сложность</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {words.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{w.kyrgyz}</td>
                      <td className="px-4 py-3 text-gray-700">{w.russian}</td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{TYPE_LABELS[w.type] ?? w.type}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{w.topic}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{w.difficulty}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditWord(w)}
                            className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                            Редактировать
                          </button>
                          <button onClick={() => setDeleteId(w.id)}
                            className="px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors">
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
              ← Назад
            </button>
            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
              Вперёд →
            </button>
          </div>
        )}
      </div>

      {/* Модалка: импорт Excel */}
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImported={() => { setPage(1); fetchWords(); }} />
      )}

      {/* Модалка: добавить */}
      {showAdd && (
        <Modal title="Добавить слово" onClose={() => setShowAdd(false)}>
          <WordForm submitLabel="Добавить" onSubmit={handleAdd} />
        </Modal>
      )}

      {/* Модалка: редактировать */}
      {editWord && (
        <Modal title="Редактировать слово" onClose={() => setEditWord(null)}>
          <WordForm
            submitLabel="Сохранить"
            initial={{ ...editWord, pos: editWord.pos ?? "", difficulty: String(editWord.difficulty) }}
            onSubmit={handleEdit}
          />
        </Modal>
      )}

      {/* Модалка: подтверждение удаления */}
      {deleteId && (
        <Modal title="Удалить слово?" onClose={() => setDeleteId(null)}>
          <p className="text-gray-600 mb-6">Это действие нельзя отменить. Слово будет удалено вместе со статистикой пользователей.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Отмена
            </button>
            <button onClick={handleDelete}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
              Удалить
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
