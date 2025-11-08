## Обзор
- **Цель**: персональный дневник тренировок с адаптивными сетапами, аналитикой прогресса и AI-помощником по подбору упражнений. Макеты предоставлены в `design/v01` и в Figma ([источник](https://www.figma.com/design/0JJ1RwqgGVl2cBNMEHh0K8/Untitled?node-id=1-2&t=Ma7eoYLKmSsiVWlt-1)).
- **Стек**: Next.js (App Router, TypeScript), Supabase (PostgreSQL + Auth + Storage + Edge Functions), хостинг Vercel. Клиентский доступ к Supabase через сервисный слой, ролевая модель с RLS.
- **Ключевые сценарии**: дашборд с календарём, запуск тренировок из пресетов/AI-чата, выполнение тренировки пошагово (warmup → progression → подходы → отдых), завершение с сохранением статистики, управление упражнениями и история.

## Дизайн-система
- **Типографика** (фиксированная шкала — строго придерживаться):
  - Гарнитура: `Suisse Int'l`, вес Regular.
  - `body` — 20px / 120% (базовый текст, почти на всех экранах).
  - `text-chat` — 16px / 120% (ввод и сообщения AI-чата).
  - `h1` — 32px / 120% (заголовки страниц и крупных блоков).
  - `supertitle` — 60px / 110% (названия упражнений в активном воркауте, таймер warm-up/rest).
  - Допустимое использование размеров: 16 → 20 → 32 → 60px без промежуточных вариаций.
- **Цветовая схема** (строго 4 оттенка):
  - `#FFFFFF` — фон.
  - `#000000` — текст, иконки, линии (при необходимости прозрачность снижать, но цвет не менять).
  - `#FF2F00` — главный акцент (таймер warmup/rest, номер подхода, кнопка «One more», основные CTA).
  - `#CFE9FF` — вторичный акцент (например, даты с тренировками в календаре).
  - Неактивные элементы: использовать 30% opacity от базового цвета (`rgba(0,0,0,0.3)` или `rgba(255,255,255,0.3)`), без ввода других серых оттенков.
- **Сетка и отступы**:
  - Основная ширина контейнера 100%.
  - Внутренние отступы у всего  10px
  - Радиусы: большие модальные контейнеры – 20px; карточки – 20px; кнопки – 60px (по CTA внизу).
- **Компоненты**: календарь с подсветкой, карточки упражнений, CTA-кнопка с заливкой `#FF2F00`, модальные блоки с блюром.

## Архитектура Next.js
- **Прозрачная структура маршрутов**: каждый файл/папка в `app/` напрямую соотносится с URL; для вложенных сегментов создаём подпапки, сохраняя принцип «один маршрут — один `page.tsx`».
- **App Router + RSC**:
  /app
    layout.tsx              // Корневой layout
    page.tsx                // Главная страница (/)
    start/page.tsx          // Выбор и запуск тренировки (/start)
    workout/[id]/page.tsx   // Активная тренировка (/workout/{id})
    exercise/[id]/page.tsx  // Детальная карточка упражнения (/exercise/{id})
    history/[date]/page.tsx // История тренировок по дате (/history/{date})
    globals.css
    favicon.ico
  /lib/
    supabase/
      client.ts             // Клиентский Supabase client
      server.ts             // Серверный Supabase client
      middleware.ts         // Middleware для auth
    state/
      workoutMachine.ts     // State machine для workout flow
    utils/
      cn.ts                 // Утилита для className (clsx + tailwind-merge)
      time.ts               // Утилиты работы со временем
    utils.ts                // Общие утилиты
  /server/
    actions/                // Server actions (CRUD операции)
    routers/                // API роуты
  /middleware.ts            // Next.js middleware (auth проверка)
  ```

## Модель данных Supabase

База данных состоит из 8 основных таблиц:

1. **users** - профили пользователей
2. **exercises** - упражнения с инструкциями и тегами
3. **exercise_records** - личные рекорды пользователя по упражнениям (max вес, повторы, длительность)
4. **workout_sets** - шаблоны тренировок
5. **workout_set_exercises** - упражнения в шаблонах (связь многие-ко-многим)
6. **workout_sessions** - сессии тренировок (история)
7. **workout_session_exercises** - упражнения в конкретной сессии
8. **workout_sets_data** - детальные данные о каждом подходе (вес, повторы, длительность)

### Файлы базы данных

- **`DATABASE_SUMMARY.md`** - краткое резюме и быстрый старт
- **`supabase_schema.sql`** - SQL-скрипт для создания всех таблиц (основной файл)
- **`DATABASE_SCHEMA.md`** - подробное описание схемы с примерами запросов
- **`DATABASE_DIAGRAM.md`** - визуальная диаграмма связей между таблицами
- **`SUPABASE_SETUP.md`** - пошаговая инструкция по настройке Supabase
- **`API_REFERENCE.md`** - справочник по всем функциям работы с БД
- **`MIGRATIONS.md`** - примеры миграций для будущих обновлений
- **`seed_data.sql`** - дополнительные тестовые данные для разработки
- **`lib/types/database.ts`** - TypeScript типы для всех таблиц
- **`lib/supabase/queries.ts`** - готовые функции для работы с данными


## Логика тренировки (state machine)
```
WarmupTimer
  → onNext → ExerciseWarmup (N шагов по прогрессии)
ExerciseWarmup
  → onCompleteSet → Rest
Rest (auto countdown)
  → onTimerEnd → WorkingSet
WorkingSet
  → onSubmitSet
    → if more sets → Rest
    → else if more exercises → ExerciseWarmup (следующего упражнения)
    → else → Finished
AddExercise (fork) → возвращает к ExerciseWarmup
Finished → завершение, статистика, селфи.



