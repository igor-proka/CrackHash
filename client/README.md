# CrackHash Client

React-интерфейс для создания запросов на взлом MD5-хэша, проверки статуса обработки и просмотра мониторинга задач из MongoDB.

## Стек

- React 18 + Vite
- TypeScript в режиме `strict`
- SCSS с глобальными design tokens и разбиением стилей по слоям/страницам
- Axios для REST API-клиентов
- Jest + React Testing Library для unit/component-тестов
- Production Docker image: статическая Vite-сборка отдается через nginx

## Структура

```text
src/app/                  оболочка приложения, header, состояние темы и языка
src/pages/CrackPage/      форма взлома, ручная проверка статуса, MD5 generator, история запросов
src/pages/MonitoringPage/ фильтры мониторинга, список запросов, детали, таблица частей задач
src/shared/api/           типизированные Axios-клиенты и API-функции
src/shared/lib/           форматирование, MD5, hooks для localStorage и polling
src/shared/types/         TypeScript-типы API и i18n
src/shared/ui/            переиспользуемые UI-компоненты
src/styles/               SCSS tokens, base styles, layout, стили страниц
src/test/                 настройка Jest
```

## Команды

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

`npm run test:watch` запускает Jest в watch-режиме во время разработки.

## Тесты

Текущие тесты покрывают базовую frontend-поверхность:

- утилиты форматирования: `formatDuration`, `formatDateTime`, `compactId`;
- переиспользуемый UI: `StatusBadge`;
- UI сценария взлома: нормализация hash при submit, inline-ошибка отправки, состояния истории запросов;
- UI мониторинга: фильтры, состояния loading/empty/error/success, отображение деталей запроса и частей задач.

Тесты лежат рядом с кодом, который проверяют: например, `StatusBadge.tsx` и `StatusBadge.test.tsx`.

## Docker

Client image собирается в два этапа:

1. `node:22-alpine` устанавливает зависимости и выполняет `npm run build`;
2. `nginx:1.27-alpine` отдает `dist` и проксирует API-запросы:
   - `/api/hash/*` -> `manager:8082`;
   - `/api/monitoring/*` -> `monitoring-api:8083`.