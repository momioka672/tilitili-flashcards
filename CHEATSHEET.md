# TiliTili Flashcards — Cheatsheet

## Запуск проекта

```bash
cd "/Users/momioka/Various Projects/tilitili-flashcards"
npm run dev
```

Открыть в браузере: http://localhost:3000

---

## Остановка проекта

В терминале где запущен сервер:
```
Ctrl + C
```

Или если сервер запущен в фоне — убить по порту:
```bash
lsof -ti:3000 | xargs kill
```

---

## База данных

Применить схему (после изменений в `prisma/schema.prisma`):
```bash
npx prisma db push
```

Заполнить тестовыми данными:
```bash
npx prisma db seed
```

Открыть визуальный редактор БД:
```bash
npx prisma studio
```

---

## Полезные страницы

| Страница | URL |
|---|---|
| Главная | http://localhost:3000 |
| Вход | http://localhost:3000/login |
| Регистрация | http://localhost:3000/register |
| Dashboard | http://localhost:3000/dashboard |
| Сессия | http://localhost:3000/session?mode=random&direction=ky-ru |
| Профиль | http://localhost:3000/profile |
| Управление словами | http://localhost:3000/admin/words |

---

## Переменные окружения (`.env`)

```
DATABASE_URL="postgresql://USER@localhost:5432/tilitili_flashcards"
JWT_SECRET="your-secret-key-min-32-chars-change-this"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Режимы сессии (параметры URL)

| Параметр | Значения |
|---|---|
| `mode` | `random` / `repeat` / `weak` / `topic` |
| `direction` | `ky-ru` / `ru-ky` |
| `topic` | `Природа`, `Семья`, `Еда`, … |

Пример: `/session?mode=topic&topic=Природа&direction=ky-ru`
