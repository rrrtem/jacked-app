# Инструкции по применению миграции

## Обзор изменений

Эта миграция добавляет следующие функции:

1. **Tracking общего объема тренировки** - поле `total_volume` в таблице `workout_sessions`
2. **Статистика пользователя** - поля `total_workouts` и `total_weight_lifted` в таблице `users`
3. **История рекордов** - новая таблица `exercise_record_history` для отслеживания всех рекордов
4. **Автоматическое обновление статистики** - триггер, который обновляет статистику пользователя при завершении тренировки
5. **Обновление рекордов** - функция автоматически определяет и сохраняет новые рекорды по упражнениям

## Как применить миграцию

### Вариант 1: Через Supabase Dashboard (рекомендуется)

1. Откройте ваш проект в Supabase Dashboard
2. Перейдите в раздел **SQL Editor**
3. Создайте новый запрос
4. Скопируйте содержимое файла `migration_workout_records.sql`
5. Вставьте в редактор и нажмите **Run**

### Вариант 2: Через Supabase CLI

```bash
# Убедитесь, что Supabase CLI установлен
supabase --version

# Войдите в свой аккаунт (если еще не вошли)
supabase login

# Примените миграцию
supabase db push --db-url "your-database-connection-string"
```

### Вариант 3: Через psql

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" < db/migration_workout_records.sql
```

## Что делает миграция

### 1. Новые колонки в `workout_sessions`
- `total_volume` (DECIMAL) - общий поднятый вес за тренировку (вес × повторы)

### 2. Новые колонки в `users`
- `total_workouts` (INTEGER) - общее количество завершенных тренировок
- `total_weight_lifted` (DECIMAL) - общий вес, поднятый за все время

### 3. Новая таблица `exercise_record_history`
Хранит историю всех установленных рекордов:
- `weight` - вес в кг
- `reps` - количество повторений
- `duration` - длительность в секундах
- `workout_session_id` - ссылка на тренировку, где был установлен рекорд
- `achieved_at` - дата и время установления рекорда

### 4. Автоматический триггер
При завершении тренировки (`completed_at` устанавливается):
- Увеличивается `total_workouts` пользователя на 1
- К `total_weight_lifted` добавляется `total_volume` этой тренировки

### 5. Инициализация существующих данных
Для пользователей, у которых уже есть завершенные тренировки:
- Подсчитывается количество тренировок
- Суммируется общий поднятый вес

## Проверка применения миграции

После применения миграции выполните следующие проверки:

```sql
-- Проверка новых колонок в workout_sessions
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workout_sessions' 
AND column_name = 'total_volume';

-- Проверка новых колонок в users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('total_workouts', 'total_weight_lifted');

-- Проверка новой таблицы
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'exercise_record_history'
);

-- Проверка триггера
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'workout_sessions' 
AND trigger_name = 'trigger_update_user_workout_stats';
```

## Использование в коде

### Автоматическое обновление рекордов

При завершении тренировки функция `saveWorkoutToDatabase()` автоматически:

1. Подсчитывает `total_volume` (вес × повторы для всех подходов)
2. Сохраняет тренировку в БД
3. Вызывает `updateRecordsFromWorkout()` для проверки и обновления рекордов
4. Записывает новые рекорды в историю

### Типы рекордов

Функция автоматически определяет тип рекорда по тегам упражнения:

- **Упражнения с тегом `duration`**: отслеживается максимальная длительность
- **Упражнения с тегом `weight`**: отслеживается максимальный вес и количество повторений
- **Упражнения без веса**: отслеживается максимальное количество повторений

### Пример использования API

```typescript
import { updateRecordsFromWorkout, getUserStats } from '@/lib/supabase/queries'

// Обновление рекордов после тренировки
const newRecords = await updateRecordsFromWorkout(
  userId,
  workoutSessionId,
  [
    {
      exerciseId: 'exercise-uuid',
      exerciseTags: ['weight', 'chest', 'push'],
      sets: [
        { weight: 80, reps: 10 },
        { weight: 85, reps: 8 },
        { weight: 90, reps: 6 }
      ]
    }
  ]
)

// Получение статистики пользователя
const stats = await getUserStats(userId)
console.log(`Total workouts: ${stats.total_workouts}`)
console.log(`Total weight lifted: ${stats.total_weight_lifted} kg`)
```

## Откат миграции

Если нужно откатить изменения:

```sql
-- Удалить триггер
DROP TRIGGER IF EXISTS trigger_update_user_workout_stats ON workout_sessions;
DROP FUNCTION IF EXISTS update_user_workout_stats();

-- Удалить таблицу истории рекордов
DROP TABLE IF EXISTS exercise_record_history CASCADE;

-- Удалить колонки из users
ALTER TABLE users 
DROP COLUMN IF EXISTS total_workouts,
DROP COLUMN IF EXISTS total_weight_lifted;

-- Удалить колонку из workout_sessions
ALTER TABLE workout_sessions 
DROP COLUMN IF EXISTS total_volume;
```

## Troubleshooting

### Ошибка: "permission denied"
Убедитесь, что вы подключены как пользователь с правами администратора.

### Ошибка: "column already exists"
Миграция использует `IF NOT EXISTS`, поэтому эта ошибка не должна возникать. Если возникла, проверьте версию PostgreSQL.

### Триггер не срабатывает
Проверьте, что триггер создан:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_user_workout_stats';
```

## Дополнительные заметки

- Миграция безопасна для применения на production
- Все изменения используют `IF NOT EXISTS` для идемпотентности
- Триггер обновляет статистику только при первом завершении тренировки
- История рекордов сохраняется даже если запись из `workout_sessions` удалена (используется `ON DELETE SET NULL`)

