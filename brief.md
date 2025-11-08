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
- **Прозрачная структура маршрутов**: каждый файл/папка в `app/` напрямую соотносится с URL; для вложенных сегментов создаём подпапки, сохраняя принцип «один маршрут — один `page.tsx`». Любые вспомогательные компоненты находятся в `components/` или `features/` (группировка по доменным областям), а не смешиваются с маршрутами, чтобы файл→маршрут оставался очевидным.
- **App Router + RSC**:
  - `/app/(auth)/` — страницы входа/регистрации (Supabase Auth).
  - `/app/(dashboard)/` — защищённый layout с Supabase Session Provider.
  - Использование Server Components для загрузки агрегированных данных и Client Components для интерактивных частей (календарь, таймеры).
- **Состояние**:
  - TanStack Query для клиентских данных (упражнения, сетапы, история) с Supabase RPC.
  - Zustand или Jotai для локального состояния активной тренировки (шаги, таймеры, изменения параметров подхода).
  - Централизованный `WorkoutFlowService` (state-machine, см. ниже) для переходов warmup → rest → подход.
- **Директории**:
  ```
  /app
    /(auth)/
    /(dashboard)/
      layout.tsx
      page.tsx                // /
      start/page.tsx          // /start
      [workoutId]/page.tsx    // /{workout-date-id}
      settings/page.tsx
      history/page.tsx
      exercises/page.tsx
      exercises/[exerciseId]/page.tsx
  /components                // UI атомы
  /features/                 // Фичи (calendar, workout-flow, ai-chat)
  /lib/
    supabase/
    state/workoutMachine.ts
    utils/time.ts
  /server/
    actions/                 // server actions (CRUD)
    routers/                 // tRPC или кастомные роуты
  ```
- **Интеграции**:
  - Supabase client на сервере (RSC) и клиенский SDK с Row Level Security.
  - Edge Functions для AI/LLM запросов (проксирование к OpenAI/Claude, управление ключами).
  - Vercel Edge runtime для быстрого ответа таймеров/вебсокетов (при расширении).

## Страницы и компоненты
### `/` — Дашборд
- **Header**: приветствие пользователя, доступ к настройкам/профилю.
- **Календарь**: клиентский компонент с подсветкой дат завершённых тренировок (статистика по окончанию тренировки). Клик → переход на `/history?date=...`.
- **Achievements Widget**: список упражнений с персональными рекордами (статусы max weight / max reps).
- **CTA**: кнопка «Start» → `/start`.

### `/start`
- Список преднастроенных наборов (`workout_sets`) + возможность «Создать свой» (позже) и «Спросить AI».
- Фильтры по типу нагрузки, мышечной группе, последней тренировки.
- Кнопка запуска запоминает выбранный сет → создаёт `workout_session` (draft) → редирект на `/[workout-date-id]`.

### `/[workout-date-id]`
- Основное полотно со state machine:
  1. **Warmup (time-based)** — таймер обратного отсчёта, карточка упражнения (выбор/смена), кнопки `Change`, `Next`.
  2. **Exercise Warmup / Progression** — серия warm sets (проценты от `max_weight`, настраивается в сетапе).
  3. **Working Set** — экран подхода: инструкция, параметры (editable), кнопка `Next`.
  4. **Rest** — таймер, блокирует переход → автопереход.
  5. **Loop** — повтор пока не завершено количество подходов или пользователь не завершит упражнение.
  6. **Add exercise** — возможность добавить упражнение mid-session (из библиотеки).
  7. **Finished** — итог с метриками + возможность прикрепить селфи (Supabase Storage).
- Сохранение истории в реальном времени (чтобы не потерять прогресс).

### `/settings`
- Профиль, единицы измерения (кг/фунты, минуты/сек), управление AI-предпочтениями, шаблонами прогрессии.

### `/history`
- Список завершённых тренировок + календарь с детализацией.
- Детальный просмотр по дате: упражнения, лучший вес/повторение, заметки, селфи.

### `/exercises`
- Таблица пользовательских упражнений + глобальная библиотека.
- CRUD: добавить/редактировать упражнение, мышечные группы, max weight/rep.

### `/exercises/[exerciseId]`
- Карточка упражнения с инструкцией, историей прогресса (график), личными рекордами, тегами.

## Модель данных Supabase (черновик)
```
users
  id (uuid, PK, auth.uid)
  full_name
  avatar_url
  locale
  settings (jsonb)  // единицы измерения, длительности, ai-параметры
  created_at

exercises
  id (uuid, PK)
  owner_id (uuid, FK → users.id, nullable для глобальных упражнений)
  title
  description
  muscle_groups text[]
  equipment text[]
  media_urls text[]
  metadata jsonb       // прогрессии, тип (strength/cardio)
  is_public boolean
  created_at

workout_sets
  id (uuid, PK)
  owner_id (uuid, FK → users.id, nullable для дефолтных)
  title
  description
  difficulty enum('beginner','intermediate','advanced')
  tags text[]
  progression jsonb    // правила warmup/working set
  warmup_settings jsonb
  visibility enum('private','shared','public')
  created_at

workout_sessions
  id (uuid, PK)
  user_id (uuid, FK → users.id)
  set_id (uuid, FK → workout_sets.id, nullable)
  status enum('draft','active','finished','aborted')
  started_at timestamptz
  finished_at timestamptz
  total_duration interval
  warmup_config jsonb
  notes text
  ai_plan jsonb         // если сет сгенерирован AI

workout_session_exercises
  id (uuid, PK)
  session_id (uuid, FK → workout_sessions.id)
  exercise_id (uuid, FK → exercises.id)
  order_index int
  progression jsonb       // индивидуальные правила
  status enum('pending','in_progress','completed')

exercise_sets
  id (uuid, PK)
  session_exercise_id (uuid, FK)
  set_number int
  type enum('warmup','working','drop','rest-pause')
  target_weight numeric
  target_reps int
  target_time interval
  actual_weight numeric
  actual_reps int
  actual_time interval
  rpe numeric
  notes text
  started_at timestamptz
  completed_at timestamptz

rest_periods
  id (uuid, PK)
  session_exercise_id (uuid, FK)
  set_id (uuid, FK → exercise_sets.id)
  target_duration interval
  actual_duration interval
  started_at timestamptz

achievements
  id (uuid, PK)
  user_id (uuid, FK)
  exercise_id (uuid, FK)
  metric enum('weight','reps','time','volume')
  value numeric
  recorded_at timestamptz

ai_requests
  id (uuid, PK)
  user_id (uuid, FK)
  session_id (uuid, FK)
  prompt text
  response jsonb
  model varchar
  cost numeric
  created_at
```
- **Индексы**: по `user_id`, `session_id`, `exercise_id`. Материализованные вьюхи для скорого доступа к рекордам и календарю активности.
- **RLS**:
  - Пользователь видит свои записи (`user_id = auth.uid()`).
  - `exercises.is_public = true` доступ для всех,
  - `workout_sets.visibility` регулирует доступ (публичные, расшаренные).
  - Роли: `authenticated` (основной пользователь), `service_role` (Edge Functions), `anon` (только аутентификация).

## API / серверная логика
- **Server Actions / Route Handlers**:
  - `POST /api/workouts/start` — инициализация сета (создаёт `workout_session`).
  - `PATCH /api/workouts/:id/state` — обновление шага тренировки (использует state-machine).
  - `POST /api/workouts/:id/complete` — завершение (подсчёт итоговой статистики, обновление `achievements`).
  - `POST /api/ai/suggest` — проксирование к OpenAI/Claude (Edge Function с тарифным лимитом).
  - `GET /api/exercises` — список упражнений (+ фильтр по типу, доступу).
- **Реалтайм**: подписка Supabase Realtime на `workout_sessions` для синхронизации между устройствами (опционально, пригодится для mobile/desktop).

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
```
- Таймеры — клиентский компонент с синхронизацией (передача стартового времени + остатка, fallback при рефреше).
- Логика прогрессии хранится в JSON `progression` (массы warmup, проценты от `max_weight`, RPE и т.д.).

## Тестирование
- Unit: утилиты прогрессии, конвертация единиц, state machine.
- E2E: Playwright (путь: запуск тренировки, warmup → rest → завершение).
- Contract tests: Supabase Edge Function (AI) + schema snapshot (pgTAP или Supabase migrations).

## План работ (итерации)
1. **Подготовка инфраструктуры**: репозиторий, Supabase проект, настройка RLS, CI (lint, test), деплой на Vercel (preview).
2. **Авторизация и базовые страницы**: login/signup, protected layout.
3. **Дашборд**: календарь + achievements (чтение данных).
4. **Справочники**: упражнения, сетапы; CRUD + фильтры.
5. **Старт тренировки**: /start, генерация сессии, связь с сетапом.
6. **Workout Flow MVP**: warmup → подходы → rest, сохранение сетов.
7. **История и аналитика**: `/history`, карточки упражнения.
8. **AI-интеграция**: чат-подбор упражнений, адаптация warmup (после выбора модели).
9. **Медиа и селфи**: загрузка в Supabase Storage, политика доступа.
10. **Проверки и полировка**: offline fallback, таймеры, уведомления, локализация (EN, позже RU).

## Открытые вопросы
- Уточнить финальное семейство шрифтов и толщины (макеты не содержат явных спецификаций).
- Предустановленные сетапы и база упражнений (ожидаем данные от заказчика).
- Выбор AI-провайдера: единая абстракция под OpenAI/Claude, лимиты и логирование.
- Дополнительные типы упражнений (кардио, интервальные) и параметры (дистанция, темп).
- Триггеры для «день отмечен» — используем статус `finished` + наличие хотя бы одного подхода.
- Требования к push-уведомлениям/напоминаниям (если планируются).

