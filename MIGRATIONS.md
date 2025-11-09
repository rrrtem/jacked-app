# Миграции базы данных

Примеры SQL-скриптов для обновления схемы базы данных в будущем.

## Как применять миграции

1. Откройте **Supabase Dashboard** → **SQL Editor**
2. Скопируйте нужный SQL-скрипт
3. Выполните его (Run или Ctrl+Enter)
4. Проверьте результат в **Table Editor**

⚠️ **Важно**: Всегда делайте бэкап перед миграцией!

---

## Миграция 1: Добавление поля для аватара упражнения

Добавляет возможность прикрепить изображение к упражнению.

```sql
-- Добавляем поле для URL изображения
ALTER TABLE exercises 
ADD COLUMN image_url TEXT;

-- Добавляем индекс для быстрого поиска упражнений с изображениями
CREATE INDEX idx_exercises_with_images ON exercises(image_url) 
WHERE image_url IS NOT NULL;

-- Комментарий к полю
COMMENT ON COLUMN exercises.image_url IS 'URL изображения упражнения из Supabase Storage';
```

---

## Миграция 2: Добавление категорий упражнений

Создаёт таблицу категорий для более структурированной организации упражнений.

```sql
-- Создаём таблицу категорий
CREATE TABLE exercise_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- Название иконки или emoji
  color TEXT, -- HEX цвет для UI
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Добавляем поле категории в упражнения
ALTER TABLE exercises 
ADD COLUMN category_id UUID REFERENCES exercise_categories(id) ON DELETE SET NULL;

-- Создаём индекс
CREATE INDEX idx_exercises_category ON exercises(category_id);

-- RLS для категорий (публичные для чтения)
ALTER TABLE exercise_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone" ON exercise_categories
  FOR SELECT USING (true);

-- Добавляем базовые категории
INSERT INTO exercise_categories (name, description, icon, color) VALUES
  ('Грудь', 'Упражнения на грудные мышцы', '💪', '#FF2F00'),
  ('Спина', 'Упражнения на мышцы спины', '🏋️', '#2196F3'),
  ('Ноги', 'Упражнения на нижнюю часть тела', '🦵', '#4CAF50'),
  ('Плечи', 'Упражнения на дельты', '🤸', '#FF9800'),
  ('Руки', 'Бицепс, трицепс, предплечья', '💪', '#9C27B0'),
  ('Кор', 'Упражнения на пресс и кор', '🧘', '#FFEB3B'),
  ('Кардио', 'Кардио упражнения', '🏃', '#F44336');
```

---

## Миграция 3: Добавление заметок к упражнениям в сессии

Позволяет делать заметки к каждому упражнению во время тренировки.

```sql
-- Добавляем поле для заметок
ALTER TABLE workout_session_exercises 
ADD COLUMN notes TEXT;

-- Комментарий
COMMENT ON COLUMN workout_session_exercises.notes IS 'Заметки к упражнению (самочувствие, техника и т.д.)';
```

---

## Миграция 4: Добавление оценки сложности тренировки

Добавляет возможность оценить сложность тренировки по шкале 1-10.

```sql
-- Добавляем поле рейтинга
ALTER TABLE workout_sessions 
ADD COLUMN difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 10);

-- Добавляем поле для самочувствия
ALTER TABLE workout_sessions 
ADD COLUMN mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5);

-- Комментарии
COMMENT ON COLUMN workout_sessions.difficulty_rating IS 'Оценка сложности тренировки (1-10)';
COMMENT ON COLUMN workout_sessions.mood_rating IS 'Самочувствие после тренировки (1-5)';

-- Индекс для статистики
CREATE INDEX idx_workout_sessions_ratings ON workout_sessions(difficulty_rating, mood_rating) 
WHERE completed_at IS NOT NULL;
```

---

## Миграция 5: Добавление таблицы для селфи после тренировки

Создаёт таблицу для хранения фото прогресса.

```sql
-- Создаём таблицу для фотографий
CREATE TABLE workout_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_workout_photos_user ON workout_photos(user_id);
CREATE INDEX idx_workout_photos_session ON workout_photos(workout_session_id);
CREATE INDEX idx_workout_photos_taken ON workout_photos(taken_at DESC);

-- RLS политики
ALTER TABLE workout_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own photos" ON workout_photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos" ON workout_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos" ON workout_photos
  FOR DELETE USING (auth.uid() = user_id);

-- Комментарии
COMMENT ON TABLE workout_photos IS 'Фотографии прогресса и селфи после тренировок';
```

---

## Миграция 6: Добавление целей (goals)

Создаёт систему целей для пользователя.

```sql
-- Создаём таблицу целей
CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('weight', 'reps', 'duration', 'workouts_per_week')),
  target_value DECIMAL(10, 2) NOT NULL,
  current_value DECIMAL(10, 2) DEFAULT 0,
  deadline DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_user_goals_user ON user_goals(user_id);
CREATE INDEX idx_user_goals_exercise ON user_goals(exercise_id);
CREATE INDEX idx_user_goals_completed ON user_goals(completed_at) WHERE completed_at IS NOT NULL;

-- RLS
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON user_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON user_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON user_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON user_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Триггер для обновления updated_at
CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Комментарии
COMMENT ON TABLE user_goals IS 'Цели пользователя по упражнениям и тренировкам';
```

---

## Миграция 7: Добавление AI-подсказок

Сохраняет историю AI-рекомендаций для пользователя.

```sql
-- Создаём таблицу для AI-рекомендаций
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('exercise', 'workout', 'rest', 'nutrition')),
  content JSONB NOT NULL,
  applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_ai_recommendations_user ON ai_recommendations(user_id);
CREATE INDEX idx_ai_recommendations_type ON ai_recommendations(recommendation_type);
CREATE INDEX idx_ai_recommendations_created ON ai_recommendations(created_at DESC);

-- GIN индекс для JSONB
CREATE INDEX idx_ai_recommendations_content ON ai_recommendations USING GIN(content);

-- RLS
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations" ON ai_recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations" ON ai_recommendations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations" ON ai_recommendations
  FOR UPDATE USING (auth.uid() = user_id);

-- Комментарии
COMMENT ON TABLE ai_recommendations IS 'История AI-рекомендаций для пользователя';
COMMENT ON COLUMN ai_recommendations.content IS 'JSON с деталями рекомендации';
```

---

## Миграция 8: Добавление супер-сетов

Позволяет группировать упражнения в супер-сеты.

```sql
-- Добавляем поле для группировки в супер-сеты
ALTER TABLE workout_set_exercises 
ADD COLUMN superset_group INTEGER DEFAULT NULL;

ALTER TABLE workout_session_exercises 
ADD COLUMN superset_group INTEGER DEFAULT NULL;

-- Комментарии
COMMENT ON COLUMN workout_set_exercises.superset_group IS 'Номер группы для супер-сетов (null = обычное упражнение)';
COMMENT ON COLUMN workout_session_exercises.superset_group IS 'Номер группы для супер-сетов (null = обычное упражнение)';

-- Индексы для быстрой выборки супер-сетов
CREATE INDEX idx_workout_set_exercises_superset ON workout_set_exercises(superset_group) 
WHERE superset_group IS NOT NULL;

CREATE INDEX idx_workout_session_exercises_superset ON workout_session_exercises(superset_group) 
WHERE superset_group IS NOT NULL;
```

---

## Миграция 9: Добавление публичных шаблонов

Позволяет делиться шаблонами тренировок с другими пользователями.

```sql
-- Добавляем поля для публичных шаблонов
ALTER TABLE workout_sets 
ADD COLUMN is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN shares_count INTEGER DEFAULT 0,
ADD COLUMN likes_count INTEGER DEFAULT 0;

-- Индекс для публичных шаблонов
CREATE INDEX idx_workout_sets_public ON workout_sets(is_public, likes_count DESC) 
WHERE is_public = TRUE;

-- Обновляем RLS - разрешаем просмотр публичных шаблонов всем
DROP POLICY "Users can view own workout sets" ON workout_sets;

CREATE POLICY "Users can view own workout sets" ON workout_sets
  FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

-- Комментарии
COMMENT ON COLUMN workout_sets.is_public IS 'Доступен ли шаблон для всех пользователей';
```

---

## Миграция 10: Добавление таблицы для трекинга веса тела

Отслеживает вес тела пользователя.

```sql
-- Создаём таблицу для записей веса
CREATE TABLE body_weight_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight DECIMAL(5, 2) NOT NULL,
  measured_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_body_weight_logs_user ON body_weight_logs(user_id);
CREATE INDEX idx_body_weight_logs_measured ON body_weight_logs(measured_at DESC);

-- RLS
ALTER TABLE body_weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weight logs" ON body_weight_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight logs" ON body_weight_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight logs" ON body_weight_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight logs" ON body_weight_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Комментарии
COMMENT ON TABLE body_weight_logs IS 'Журнал измерений веса тела';
```

---

## Откат миграций

Если нужно откатить изменения:

### Откат миграции 1

```sql
ALTER TABLE exercises DROP COLUMN image_url;
DROP INDEX IF EXISTS idx_exercises_with_images;
```

### Откат миграции 2

```sql
ALTER TABLE exercises DROP COLUMN category_id;
DROP TABLE IF EXISTS exercise_categories CASCADE;
DROP INDEX IF EXISTS idx_exercises_category;
```

### Откат миграции 5

```sql
DROP TABLE IF EXISTS workout_photos CASCADE;
```

---

## Проверка текущей схемы

Посмотреть все таблицы:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Посмотреть структуру таблицы:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'exercises'
ORDER BY ordinal_position;
```

Посмотреть все индексы:

```sql
SELECT 
  tablename, 
  indexname, 
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## Best Practices

1. **Всегда делайте бэкап** перед миграцией
2. **Тестируйте на копии** базы данных
3. **Используйте транзакции** для сложных миграций
4. **Сохраняйте скрипты** миграций в репозитории
5. **Добавляйте комментарии** к новым полям
6. **Обновляйте TypeScript типы** после миграции
7. **Проверяйте RLS политики** для новых таблиц

---

## Обновление TypeScript типов после миграции

После применения миграции обновите типы:

1. Используйте Supabase CLI:

```bash
npx supabase gen types typescript --project-id your-project-id > lib/types/database.ts
```

2. Или обновите вручную в `lib/types/database.ts`

---

## Версионирование миграций

Рекомендуется создавать файлы миграций с номерами версий:

```
migrations/
  001_initial_schema.sql
  002_add_exercise_images.sql
  003_add_categories.sql
  ...
```

И вести таблицу версий:

```sql
CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO schema_migrations (version) VALUES (1);
```

