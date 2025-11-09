# Схема базы данных для приложения тренировок

## Обзор

База данных состоит из 9 основных таблиц, которые хранят информацию о пользователях, упражнениях, шаблонах тренировок, фактически выполненных тренировках и истории личных рекордов.

## Таблицы

### 1. `users` - Профили пользователей

Хранит базовую информацию о пользователях.

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Первичный ключ |
| `email` | TEXT | Email пользователя (уникальный) |
| `name` | TEXT | Имя пользователя |
| `avatar_url` | TEXT | URL аватара |
| `created_at` | TIMESTAMPTZ | Дата создания |
| `updated_at` | TIMESTAMPTZ | Дата обновления |

### 2. `exercises` - Упражнения

Хранит все доступные упражнения.

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Первичный ключ |
| `name` | TEXT | Название упражнения |
| `instructions` | TEXT | Инструкция по выполнению |
| `tags` | TEXT[] | Массив тегов (push, pull, legs, chest, back, biceps и т.д.) |
| `created_at` | TIMESTAMPTZ | Дата создания |
| `updated_at` | TIMESTAMPTZ | Дата обновления |

**Примеры тегов:**
- Группы мышц: `chest`, `back`, `legs`, `biceps`, `triceps`, `shoulders`, `core`
- Типы движений: `push`, `pull`, `full-body`, `complex`
- Оборудование: `bodyweight`, `barbell`, `dumbbell`

### 3. `exercise_records` - Личные рекорды пользователя

Хранит личные рекорды пользователя по каждому упражнению.

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Первичный ключ |
| `user_id` | UUID | Внешний ключ на `users` |
| `exercise_id` | UUID | Внешний ключ на `exercises` |
| `max_weight` | DECIMAL | Максимальный вес (кг) |
| `max_reps` | INTEGER | Максимальное количество повторений |
| `max_duration` | INTEGER | Максимальная длительность (секунды) |
| `last_updated` | TIMESTAMPTZ | Дата последнего обновления рекорда |
| `created_at` | TIMESTAMPTZ | Дата создания |

**Уникальное ограничение:** (`user_id`, `exercise_id`) - один рекорд на каждую пару пользователь-упражнение.

### 4. `exercise_record_history` - История личных рекордов

Хранит историю изменений личных рекордов пользователя. Позволяет отслеживать прогресс во времени.

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Первичный ключ |
| `user_id` | UUID | Внешний ключ на `users` |
| `exercise_id` | UUID | Внешний ключ на `exercises` |
| `workout_session_id` | UUID | Внешний ключ на `workout_sessions` (опционально) |
| `weight` | DECIMAL | Вес (кг) |
| `reps` | INTEGER | Количество повторений |
| `duration` | INTEGER | Длительность (секунды) |
| `achieved_at` | TIMESTAMPTZ | Дата и время достижения рекорда |
| `notes` | TEXT | Заметки о достижении |
| `created_at` | TIMESTAMPTZ | Дата создания записи |

**Использование:**
- Отслеживание прогресса по каждому упражнению
- Построение графиков роста показателей
- Мотивация и визуализация прогресса

### 5. `workout_sets` - Шаблоны тренировок

Хранит предзаготовленные шаблоны тренировок.

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Первичный ключ |
| `user_id` | UUID | Внешний ключ на `users` |
| `name` | TEXT | Название шаблона |
| `description` | TEXT | Описание шаблона |
| `created_at` | TIMESTAMPTZ | Дата создания |
| `updated_at` | TIMESTAMPTZ | Дата обновления |

### 6. `workout_set_exercises` - Упражнения в шаблонах

Связывает упражнения с шаблонами тренировок (связь многие-ко-многим).

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Первичный ключ |
| `workout_set_id` | UUID | Внешний ключ на `workout_sets` |
| `exercise_id` | UUID | Внешний ключ на `exercises` |
| `order_index` | INTEGER | Порядковый номер упражнения в шаблоне |
| `target_sets` | INTEGER | Целевое количество подходов (по умолчанию 3) |
| `target_reps` | INTEGER | Целевое количество повторений |
| `target_weight` | DECIMAL | Целевой вес (кг) |
| `rest_duration` | INTEGER | Время отдыха между подходами (секунды, по умолчанию 90) |
| `created_at` | TIMESTAMPTZ | Дата создания |

**Уникальное ограничение:** (`workout_set_id`, `exercise_id`) - каждое упражнение один раз в шаблоне.

### 7. `workout_sessions` - Сессии тренировок

Хранит историю всех выполненных тренировок.

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Первичный ключ |
| `user_id` | UUID | Внешний ключ на `users` |
| `started_at` | TIMESTAMPTZ | Время начала тренировки |
| `completed_at` | TIMESTAMPTZ | Время завершения тренировки |
| `duration` | INTEGER | Общая длительность тренировки (секунды) |
| `notes` | TEXT | Заметки о тренировке |
| `created_at` | TIMESTAMPTZ | Дата создания |
| `updated_at` | TIMESTAMPTZ | Дата обновления |

> Привязка к шаблону теперь выражается только на уровне упражнений сессии. Сама запись тренировки независима от `workout_sets`.

### 8. `workout_session_exercises` - Упражнения в сессии

Связывает упражнения с конкретной тренировочной сессией.

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Первичный ключ |
| `workout_session_id` | UUID | Внешний ключ на `workout_sessions` |
| `exercise_id` | UUID | Внешний ключ на `exercises` |
| `order_index` | INTEGER | Порядковый номер упражнения в сессии |
| `warmup_completed` | BOOLEAN | Завершена ли разминка (по умолчанию false) |
| `workout_set_exercise_id` | UUID | Опциональная ссылка на `workout_set_exercises`, если упражнение пришло из шаблона |
| `created_at` | TIMESTAMPTZ | Дата создания |

### 9. `workout_session_sets` - Данные о подходах

Хранит детальную информацию о каждом подходе в упражнении сессии.

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Первичный ключ |
| `workout_session_exercise_id` | UUID | Внешний ключ на `workout_session_exercises` |
| `set_number` | INTEGER | Номер подхода (1, 2, 3...) |
| `weight` | DECIMAL | Вес (кг) |
| `reps` | INTEGER | Количество повторений |
| `duration` | INTEGER | Длительность подхода (секунды, для упражнений на время) |
| `completed` | BOOLEAN | Завершён ли подход (по умолчанию true) |
| `notes` | TEXT | Заметки к подходу |
| `created_at` | TIMESTAMPTZ | Дата создания |

## Связи между таблицами

```
users
  ├── exercise_records (личные рекорды)
  ├── exercise_record_history (история рекордов)
  ├── workout_sets (шаблоны тренировок)
  └── workout_sessions (история тренировок)

exercises
  ├── exercise_records (рекорды по упражнениям)
  ├── exercise_record_history (история рекордов по упражнениям)
  ├── workout_set_exercises (упражнения в шаблонах)
  └── workout_session_exercises (упражнения в сессиях)

workout_sets
  └── workout_set_exercises (состав шаблона)
      └── workout_session_exercises (упражнения сессии, взятые из шаблона)

workout_sessions
  ├── exercise_record_history (рекорды, установленные в сессии)
  └── workout_session_exercises (упражнения в сессии)
      └── workout_session_sets (подходы)
```

## Примеры запросов

### Получить все упражнения с тегом "chest"

```sql
SELECT * FROM exercises 
WHERE 'chest' = ANY(tags);
```

### Получить историю тренировок пользователя за текущий месяц

```sql
SELECT * FROM workout_sessions 
WHERE user_id = 'user-uuid'
  AND started_at >= date_trunc('month', CURRENT_DATE)
  AND started_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
ORDER BY started_at DESC;
```

### Получить детальную информацию о тренировке с подходами

```sql
SELECT 
  ws.started_at,
  ws.duration,
  e.name as exercise_name,
  wsd.set_number,
  wsd.weight,
  wsd.reps
FROM workout_sessions ws
JOIN workout_session_exercises wse ON wse.workout_session_id = ws.id
JOIN exercises e ON e.id = wse.exercise_id
JOIN workout_session_sets wss ON wss.workout_session_exercise_id = wse.id
WHERE ws.id = 'session-uuid'
ORDER BY wse.order_index, wss.set_number;
```

### Получить личные рекорды пользователя

```sql
SELECT 
  e.name,
  er.max_weight,
  er.max_reps,
  er.max_duration,
  er.last_updated
FROM exercise_records er
JOIN exercises e ON e.id = er.exercise_id
WHERE er.user_id = 'user-uuid'
ORDER BY er.last_updated DESC;
```

### Получить историю рекордов по упражнению

```sql
SELECT 
  erh.achieved_at,
  erh.weight,
  erh.reps,
  erh.duration,
  erh.notes
FROM exercise_record_history erh
WHERE erh.user_id = 'user-uuid'
  AND erh.exercise_id = 'exercise-uuid'
ORDER BY erh.achieved_at DESC;
```

### Получить график прогресса по весу в упражнении

```sql
SELECT 
  DATE(erh.achieved_at) as date,
  MAX(erh.weight) as max_weight_on_date
FROM exercise_record_history erh
WHERE erh.user_id = 'user-uuid'
  AND erh.exercise_id = 'exercise-uuid'
  AND erh.weight IS NOT NULL
GROUP BY DATE(erh.achieved_at)
ORDER BY date ASC;
```

### Получить все рекорды, установленные за последний месяц

```sql
SELECT 
  e.name as exercise_name,
  erh.weight,
  erh.reps,
  erh.duration,
  erh.achieved_at,
  ws.started_at as workout_date
FROM exercise_record_history erh
JOIN exercises e ON e.id = erh.exercise_id
LEFT JOIN workout_sessions ws ON ws.id = erh.workout_session_id
WHERE erh.user_id = 'user-uuid'
  AND erh.achieved_at >= NOW() - interval '1 month'
ORDER BY erh.achieved_at DESC;
```

## Row Level Security (RLS)

База данных настроена с политиками RLS для защиты данных:

- **Упражнения** (`exercises`) - доступны для чтения всем
- **Все остальные таблицы** - пользователь видит только свои данные
- Автоматическая проверка на основе `auth.uid()` из Supabase Auth

## Автоматические триггеры

- Поле `updated_at` автоматически обновляется при изменении записи
- Используется функция `update_updated_at_column()`

## Тестовые данные

В скрипте включены тестовые данные для разработки:
- Тестовый пользователь
- 10 базовых упражнений (push-ups, pull-ups, squats и т.д.)
- Один тестовый шаблон тренировки "Full Body Workout"

## Установка

1. Откройте Supabase Dashboard
2. Перейдите в SQL Editor
3. Скопируйте содержимое файла `supabase_schema.sql`
4. Выполните запрос

Готово! База данных настроена и готова к использованию.

