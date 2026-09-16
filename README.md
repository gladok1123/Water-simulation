# Штиль — медитация на воде

Расслабляющая симуляция воды бассейна: WebGL-рендер с бликами и каустикой,
звук волн, «дыхательные» круги и несколько настроений (мудов).

## Стек

- [Next.js](https://nextjs.org) 16 (App Router, Turbopack) + React 19
- Tailwind CSS 4
- WebGL-шейдеры (`src/lib/shaders.ts`), процедурный звук (`src/lib/sound.ts`)
- PostgreSQL + Drizzle ORM (health-проверка `/api/health`)

## Запуск

```bash
npm install
npm run dev        # http://localhost:3000
```

Переменные окружения:

- `DATABASE_URL` — строка подключения к PostgreSQL (требуется для `/api/health`;
  сама визуализация работает и без неё)

Полезные скрипты: `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`.

## Структура

- `src/app/page.tsx` — главный экран с интро-оверлеем
- `src/components/WaterCanvas.tsx` — WebGL-канвас воды
- `src/components/Controls.tsx` — выбор настроения, звук, капли, дыхание
- `src/components/BreathingOverlay.tsx` — дыхательные круги
- `src/lib/shaders.ts` — GLSL-шейдеры, `src/lib/moods.ts` — настройки мудов
- `src/lib/sound.ts` — процедурный звук воды
