# Инструкция по настройке Supabase

## Шаг 1: Создание проекта в Supabase

1. Перейдите на [supabase.com](https://supabase.com)
2. Войдите в свой аккаунт или создайте новый
3. Нажмите "New Project"
4. Заполните данные:
   - **Name**: Workout Tracker (или любое другое название)
   - **Database Password**: придумайте надежный пароль (сохраните его!)
   - **Region**: выберите ближайший к вам регион
   - **Pricing Plan**: Free (для начала)
5. Нажмите "Create new project" и дождитесь создания проекта (1-2 минуты)

## Шаг 2: Выполнение SQL-скрипта

1. В боковом меню проекта нажмите на **"SQL Editor"**
2. Нажмите **"New query"**
3. Скопируйте весь код из файла `supabase_schema.sql`
4. Вставьте его в редактор SQL
5. Нажмите **"Run"** (или Ctrl+Enter / Cmd+Enter)
6. Убедитесь, что выполнение прошло успешно (вы увидите "Success. No rows returned")

## Шаг 3: Проверка создания таблиц

1. В боковом меню нажмите **"Table Editor"**
2. Вы должны увидеть все созданные таблицы:
   - users
   - exercises
   - exercise_records
   - workout_sets
   - workout_set_exercises
   - workout_sessions
   - workout_session_exercises
   - workout_sets_data

3. Кликните на таблицу `exercises` - вы должны увидеть 10 тестовых упражнений

## Шаг 4: Получение API ключей

1. В боковом меню нажмите **"Settings"** (значок шестеренки внизу)
2. Выберите **"API"**
3. Скопируйте следующие значения:
   - **Project URL** (например: `https://xxxxxxxxxxxx.supabase.co`)
   - **anon public** ключ (длинная строка, начинается с `eyJ...`)
   - **service_role** ключ (для серверных операций, хранить в секрете!)

## Шаг 5: Настройка переменных окружения в проекте

1. Создайте файл `.env.local` в корне проекта
2. Добавьте следующие переменные:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...ваш_anon_ключ
SUPABASE_SERVICE_ROLE_KEY=eyJ...ваш_service_role_ключ
```

3. Замените значения на свои из шага 4
4. Сохраните файл

⚠️ **Важно**: Файл `.env.local` не должен попадать в git (он уже в `.gitignore`)

## Шаг 6: Настройка Authentication (опционально, для будущего)

Пока у нас один пользователь, но для будущего расширения:

1. В боковом меню нажмите **"Authentication"**
2. Выберите **"Providers"**
3. Включите нужные провайдеры (Email, Google, GitHub и т.д.)
4. Настройте redirect URLs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://ваш-домен.com/auth/callback`

## Шаг 7: Создание первого пользователя

Есть два варианта:

### Вариант А: Через SQL (простой способ)

Выполните в SQL Editor:

```sql
-- Вставляем тестового пользователя с вашими данными
INSERT INTO users (name, email) VALUES 
  ('Ваше Имя', 'ваш@email.com')
RETURNING *;
```

Скопируйте `id` созданного пользователя - он понадобится в коде.

### Вариант Б: Через Supabase Auth (для продакшена)

1. В боковом меню нажмите **"Authentication"** → **"Users"**
2. Нажмите **"Add user"** → **"Create new user"**
3. Заполните email и пароль
4. После создания пользователя в auth.users, автоматически создастся запись в public.users (если настроен триггер)

## Шаг 8: Настройка Row Level Security (RLS)

RLS уже настроен в SQL-скрипте, но для проверки:

1. Перейдите в **"Authentication"** → **"Policies"**
2. Выберите любую таблицу (например, `workout_sessions`)
3. Вы должны увидеть созданные политики:
   - "Users can view own workout sessions"
   - "Users can insert own workout sessions"
   - и т.д.

## Шаг 9: Тестирование подключения

Создайте тестовый файл `test-supabase.ts` в корне проекта:

```typescript
import { createClient } from '@/lib/supabase/client'

async function testConnection() {
  const supabase = createClient()
  
  // Проверяем подключение
  const { data, error } = await supabase
    .from('exercises')
    .select('count')
  
  if (error) {
    console.error('❌ Ошибка подключения:', error)
  } else {
    console.log('✅ Подключение успешно!')
    console.log('Количество упражнений:', data)
  }
}

testConnection()
```

Запустите:
```bash
npx tsx test-supabase.ts
```

## Шаг 10: Обновление клиента Supabase в коде

Убедитесь, что в файле `/lib/supabase/client.ts` используются правильные переменные окружения:

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

## Полезные команды SQL для администрирования

### Посмотреть всех пользователей

```sql
SELECT * FROM users;
```

### Посмотреть все упражнения с тегом "chest"

```sql
SELECT * FROM exercises WHERE 'chest' = ANY(tags);
```

### Посмотреть последние 10 тренировок

```sql
SELECT 
  ws.*,
  u.name as user_name
FROM workout_sessions ws
JOIN users u ON u.id = ws.user_id
WHERE ws.completed_at IS NOT NULL
ORDER BY ws.started_at DESC
LIMIT 10;
```

### Посмотреть статистику по тренировкам пользователя

```sql
SELECT 
  COUNT(*) as total_workouts,
  SUM(duration) as total_duration_seconds,
  AVG(duration) as avg_duration_seconds,
  MIN(started_at) as first_workout,
  MAX(started_at) as last_workout
FROM workout_sessions
WHERE user_id = 'ваш-user-id'
  AND completed_at IS NOT NULL;
```

### Очистить все данные тренировок (для тестирования)

```sql
-- Внимание! Удаляет ВСЕ тренировки
TRUNCATE workout_sets_data CASCADE;
TRUNCATE workout_session_exercises CASCADE;
TRUNCATE workout_sessions CASCADE;
```

## Troubleshooting (Решение проблем)

### Ошибка: "JWT expired"

Обновите страницу или перезапустите dev сервер. Токены истекают через некоторое время.

### Ошибка: "permission denied for table X"

Проверьте, что RLS политики настроены правильно и пользователь аутентифицирован.

### Ошибка: "relation X does not exist"

Таблица не создана. Перепроверьте выполнение SQL-скрипта в шаге 2.

### Упражнения не загружаются

1. Проверьте переменные окружения в `.env.local`
2. Проверьте, что тестовые данные добавлены (см. конец `supabase_schema.sql`)
3. Посмотрите логи в консоли браузера (F12)

## Бэкап базы данных

Рекомендуется делать регулярные бэкапы:

1. В боковом меню **"Database"** → **"Backups"**
2. Включите автоматические бэкапы (доступно на платных планах)
3. Или экспортируйте схему вручную через **"SQL Editor"**:

```sql
-- Экспорт всех данных упражнений
COPY (SELECT * FROM exercises) TO STDOUT WITH CSV HEADER;
```

## Мониторинг и логи

1. **"Logs"** - просмотр логов запросов
2. **"Reports"** - статистика использования API
3. **"Database"** → **"Roles"** - управление ролями

## Следующие шаги

✅ База данных настроена  
✅ Тестовые данные добавлены  
✅ RLS политики активны  

Теперь можно начать интегрировать запросы в Next.js приложение!

Используйте функции из `/lib/supabase/queries.ts` для работы с данными.

