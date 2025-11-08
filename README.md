# Jacked — Персональный дневник тренировок

Приложение для отслеживания тренировок с адаптивными сетапами, аналитикой прогресса и AI-помощником.

## Стек технологий

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Деплой**: Vercel
- **Пакетный менеджер**: pnpm

## Быстрый старт

### 1. Установка зависимостей

```bash
pnpm install
```

### 2. Настройка Supabase

1. Создайте проект на [Supabase](https://app.supabase.com)
2. Скопируйте `.env.local` и заполните переменные:
   - `NEXT_PUBLIC_SUPABASE_URL` — URL вашего проекта
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon/Public ключ
   - `SUPABASE_SERVICE_ROLE_KEY` — Service Role ключ (для серверных операций)

Найти эти значения можно в: **Project Settings → API**

### 3. Запуск dev-сервера

```bash
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Структура проекта

```
/app
  /(auth)/          # Страницы авторизации (login, signup)
  /(dashboard)/     # Защищённые страницы приложения
    page.tsx        # Дашборд (календарь + achievements)
    start/          # Выбор workout set
    [workoutId]/    # Активная тренировка
    history/        # История тренировок
    settings/       # Настройки
    exercises/      # Библиотека упражнений
/components         # UI компоненты (Button, Card, Input)
/features           # Фичи (calendar, workout-flow, ai-chat)
/lib                # Утилиты, Supabase клиенты, state machine
/server             # Server actions, API роуты
```

## Скрипты

- `pnpm dev` — запуск dev-сервера
- `pnpm build` — сборка для продакшена
- `pnpm start` — запуск продакшен-сборки
- `pnpm lint` — проверка ESLint
- `pnpm format` — форматирование кода (Prettier)
- `pnpm type-check` — проверка типов TypeScript

## Деплой на Vercel

### Через GitHub

1. Запушьте код в GitHub репозиторий
2. Импортируйте проект на [Vercel](https://vercel.com/new)
3. Добавьте переменные окружения в настройках проекта:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Vercel автоматически задеплоит приложение

### Через CLI

```bash
pnpm install -g vercel
vercel
```

## Дизайн-система

- **Цвета**: `#FFFFFF` (фон), `#000000` (текст), `#FF2F00` (акцент), `#CFE9FF` (вторичный)
- **Типографика**: Suisse Int'l, размеры 16/20/32/60px
- **Радиусы**: 20px (карточки), 60px (кнопки)

Подробнее в [brief.md](./brief.md)

## Документация

- [Next.js](https://nextjs.org/docs)
- [Supabase](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
