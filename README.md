# Штиль — медитация на воде

Расслабляющая симуляция воды бассейна: WebGL-рендер с бликами и каустикой,
звук волн, «дыхательные» круги и несколько настроений (мудов).

## Стек

- [Next.js](https://nextjs.org) 16 (App Router, Turbopack) + React 19
- Tailwind CSS 4
- WebGL-шейдеры (`src/lib/shaders.ts`), процедурный звук (`src/lib/sound.ts`)

Приложение полностью клиентское — никаких баз данных и переменных окружения
не требуется, деплой на [Vercel](https://vercel.com) работает из коробки.

## Запуск

```bash
npm install
npm run dev        # http://localhost:3000
```

Полезные скрипты: `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`.

`/api/health` — простой health-check (`{ "ok": true }`) для мониторинга деплоя.

## Структура

- `src/app/page.tsx` — главный экран с интро-оверлеем
- `src/components/WaterCanvas.tsx` — WebGL-канвас воды
- `src/components/Controls.tsx` — выбор настроения, звук, капли, дыхание
- `src/components/BreathingOverlay.tsx` — дыхательные круги
- `src/lib/shaders.ts` — GLSL-шейдеры, `src/lib/moods.ts` — настройки мудов
- `src/lib/sound.ts` — процедурный звук воды
