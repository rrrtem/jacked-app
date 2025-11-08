# Диаграмма базы данных

## Визуальная схема связей

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │◄─────────┐
│ email           │          │
│ name            │          │
│ avatar_url      │          │
│ created_at      │          │
│ updated_at      │          │
└─────────────────┘          │
         ▲                   │
         │                   │
         │                   │
    ┌────┴────┐         ┌────┴────┐
    │         │         │         │
    │         │         │         │
┌───┴────────────┐ ┌───┴────────────────┐
│ exercise_      │ │ workout_sets       │
│ records        │ │────────────────────│
│────────────────│ │ id (PK)            │◄────────┐
│ id (PK)        │ │ user_id (FK)       │         │
│ user_id (FK)   │ │ name               │         │
│ exercise_id(FK)│ │ description        │         │
│ max_weight     │ │ created_at         │         │
│ max_reps       │ │ updated_at         │         │
│ max_duration   │ └────────────────────┘         │
│ last_updated   │          ▲                     │
└────────────────┘          │                     │
         ▲                  │                     │
         │                  │                     │
         │         ┌────────┴───────────┐         │
         │         │ workout_set_       │         │
         │         │ exercises          │         │
         │         │────────────────────│         │
         │         │ id (PK)            │         │
         │         │ workout_set_id(FK) │         │
         │         │ exercise_id (FK)   │─────┐   │
         │         │ order_index        │     │   │
         │         │ target_sets        │     │   │
         │         │ target_reps        │     │   │
         │         │ target_weight      │     │   │
         │         │ rest_duration      │     │   │
         │         └────────────────────┘     │   │
         │                                    │   │
    ┌────┴────────────┐                      │   │
    │   exercises     │                      │   │
    │─────────────────│                      │   │
    │ id (PK)         │◄─────────────────────┘   │
    │ name            │                          │
    │ instructions    │                          │
    │ tags[]          │◄─────────┐               │
    │ created_at      │          │               │
    │ updated_at      │          │               │
    └─────────────────┘          │               │
              ▲                  │               │
              │                  │               │
              │                  │               │
              │         ┌────────┴──────────┐    │
              │         │ workout_session_  │    │
              │         │ exercises         │    │
              │         │───────────────────│    │
              │         │ id (PK)           │◄───┼────┐
              │         │ workout_session_  │    │    │
              │         │   _id (FK)        │    │    │
              └─────────┤ exercise_id (FK)  │    │    │
                        │ order_index       │    │    │
                        │ warmup_completed  │    │    │
                        └───────────────────┘    │    │
                                 ▲               │    │
                                 │               │    │
                        ┌────────┴───────────┐   │    │
                        │ workout_sets_data  │   │    │
                        │────────────────────│   │    │
                        │ id (PK)            │   │    │
                        │ workout_session_   │   │    │
                        │   exercise_id (FK) │───┘    │
                        │ set_number         │        │
                        │ weight             │        │
                        │ reps               │        │
                        │ duration           │        │
                        │ completed          │        │
                        │ notes              │        │
                        └────────────────────┘        │
                                                      │
┌─────────────────────────────────────────────┐      │
│         workout_sessions                     │      │
│──────────────────────────────────────────────│      │
│ id (PK)                                      │◄─────┘
│ user_id (FK) ──────────────────────────────► users
│ workout_set_id (FK) ───────────────────────► workout_sets
│ started_at                                   │
│ completed_at                                 │
│ duration                                     │
│ notes                                        │
│ created_at                                   │
│ updated_at                                   │
└──────────────────────────────────────────────┘
```

## Описание связей

### 1. users → exercise_records (1:N)

Один пользователь может иметь множество личных рекордов (по одному на упражнение).

```sql
exercise_records.user_id → users.id
```

### 2. users → workout_sets (1:N)

Один пользователь может создать множество шаблонов тренировок.

```sql
workout_sets.user_id → users.id
```

### 3. users → workout_sessions (1:N)

Один пользователь может иметь множество тренировочных сессий (история).

```sql
workout_sessions.user_id → users.id
```

### 4. exercises → exercise_records (1:N)

Одно упражнение может иметь рекорды от разных пользователей.

```sql
exercise_records.exercise_id → exercises.id
```

### 5. workout_sets ↔ exercises (M:N через workout_set_exercises)

Связь многие-ко-многим:
- Один шаблон может включать много упражнений
- Одно упражнение может быть в разных шаблонах

```sql
workout_set_exercises.workout_set_id → workout_sets.id
workout_set_exercises.exercise_id → exercises.id
```

### 6. workout_sessions → workout_sets (N:1, опционально)

Сессия может быть создана на основе шаблона (но необязательно).

```sql
workout_sessions.workout_set_id → workout_sets.id (nullable)
```

### 7. workout_sessions → workout_session_exercises (1:N)

Одна сессия содержит несколько упражнений.

```sql
workout_session_exercises.workout_session_id → workout_sessions.id
```

### 8. exercises → workout_session_exercises (1:N)

Одно упражнение может быть использовано в разных сессиях.

```sql
workout_session_exercises.exercise_id → exercises.id
```

### 9. workout_session_exercises → workout_sets_data (1:N)

Каждое упражнение в сессии содержит несколько подходов (sets).

```sql
workout_sets_data.workout_session_exercise_id → workout_session_exercises.id
```

## Жизненный цикл данных

### Создание тренировки

```
1. Пользователь выбирает шаблон (workout_sets)
   └─ или создаёт новую тренировку с нуля

2. Создаётся workout_session
   └─ Сохраняется started_at
   └─ Опционально: workout_set_id

3. Добавляются упражнения в workout_session_exercises
   └─ Для каждого упражнения в шаблоне
   └─ Сохраняется order_index

4. Во время выполнения создаются workout_sets_data
   └─ Для каждого подхода
   └─ Сохраняется weight, reps, duration
```

### Выполнение тренировки

```
┌─────────────────────────────────────────────┐
│ 1. Warmup Timer                             │
│    ├─ Пользователь разминается              │
│    └─ markWarmupCompleted()                 │
│                                             │
│ 2. Exercise Warmup (progression)            │
│    ├─ Warm-up подходы                       │
│    └─ saveWorkoutSet() для каждого          │
│                                             │
│ 3. Working Sets                             │
│    ├─ Пользователь выполняет подход         │
│    ├─ saveWorkoutSet()                      │
│    ├─ Rest Timer                            │
│    └─ Повторять для всех подходов           │
│                                             │
│ 4. Next Exercise или Finish                 │
│    ├─ Если есть ещё упражнения → пункт 2    │
│    └─ Если всё выполнено → завершение       │
│                                             │
│ 5. Complete Workout                         │
│    ├─ completeWorkoutSession()              │
│    ├─ Сохраняется completed_at              │
│    ├─ Рассчитывается duration               │
│    └─ Обновляются рекорды (если есть)       │
└─────────────────────────────────────────────┘
```

### Обновление рекордов

```
После завершения тренировки:

1. Получить все подходы пользователя
   SELECT * FROM workout_sets_data
   WHERE workout_session_exercise_id IN (...)

2. Для каждого упражнения:
   ├─ Найти max(weight)
   ├─ Найти max(reps)
   └─ Найти max(duration)

3. Сравнить с текущими рекордами
   SELECT * FROM exercise_records
   WHERE user_id = ? AND exercise_id = ?

4. Обновить, если новый результат лучше
   UPDATE exercise_records
   SET max_weight = ?, max_reps = ?, max_duration = ?
   WHERE user_id = ? AND exercise_id = ?
```

## Запросы для статистики

### Общая статистика пользователя

```sql
SELECT 
  COUNT(DISTINCT ws.id) as total_workouts,
  COUNT(DISTINCT DATE(ws.started_at)) as workout_days,
  SUM(ws.duration) / 3600.0 as total_hours,
  AVG(ws.duration) / 60.0 as avg_duration_minutes
FROM workout_sessions ws
WHERE ws.user_id = 'user-uuid'
  AND ws.completed_at IS NOT NULL;
```

### Прогресс по упражнению

```sql
SELECT 
  ws.started_at::date as workout_date,
  MAX(wsd.weight) as max_weight,
  MAX(wsd.reps) as max_reps
FROM workout_sessions ws
JOIN workout_session_exercises wse ON wse.workout_session_id = ws.id
JOIN workout_sets_data wsd ON wsd.workout_session_exercise_id = wse.id
WHERE ws.user_id = 'user-uuid'
  AND wse.exercise_id = 'exercise-uuid'
  AND ws.completed_at IS NOT NULL
GROUP BY ws.started_at::date
ORDER BY ws.started_at DESC;
```

### Объём тренировки (volume)

```sql
SELECT 
  ws.id,
  ws.started_at,
  SUM(wsd.weight * wsd.reps) as total_volume
FROM workout_sessions ws
JOIN workout_session_exercises wse ON wse.workout_session_id = ws.id
JOIN workout_sets_data wsd ON wsd.workout_session_exercise_id = wse.id
WHERE ws.user_id = 'user-uuid'
  AND wsd.weight IS NOT NULL
  AND wsd.reps IS NOT NULL
GROUP BY ws.id
ORDER BY ws.started_at DESC;
```

### Частота тренировок по дням недели

```sql
SELECT 
  TO_CHAR(started_at, 'Day') as day_of_week,
  COUNT(*) as workout_count
FROM workout_sessions
WHERE user_id = 'user-uuid'
  AND completed_at IS NOT NULL
GROUP BY TO_CHAR(started_at, 'Day'), EXTRACT(DOW FROM started_at)
ORDER BY EXTRACT(DOW FROM started_at);
```

## Индексы для производительности

Созданные индексы в схеме:

```sql
-- Поиск пользователей
CREATE INDEX idx_users_email ON users(email);

-- Поиск упражнений по тегам (GIN для массивов)
CREATE INDEX idx_exercises_tags ON exercises USING GIN(tags);

-- Рекорды пользователя
CREATE INDEX idx_exercise_records_user ON exercise_records(user_id);
CREATE INDEX idx_exercise_records_exercise ON exercise_records(exercise_id);

-- Шаблоны и их упражнения
CREATE INDEX idx_workout_sets_user ON workout_sets(user_id);
CREATE INDEX idx_workout_set_exercises_set ON workout_set_exercises(workout_set_id);

-- История тренировок (сортировка по дате)
CREATE INDEX idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_started ON workout_sessions(started_at DESC);
CREATE INDEX idx_workout_sessions_completed ON workout_sessions(completed_at DESC);
```

## Каскадное удаление

При удалении записей автоматически удаляются связанные:

- `users` → удалятся все рекорды, шаблоны и сессии
- `workout_sets` → удалятся все workout_set_exercises
- `workout_sessions` → удалятся все упражнения и подходы
- `exercises` → зависит от политики (можно настроить)

```sql
ON DELETE CASCADE
```

## Безопасность (RLS)

Каждая таблица защищена Row Level Security:

```
✅ users          - видит только свой профиль
✅ exercises      - все видят все (READ-ONLY)
✅ exercise_records - только свои рекорды
✅ workout_sets   - только свои шаблоны
✅ workout_sessions - только свои тренировки
```

Политики проверяют `auth.uid() = user_id` автоматически.

