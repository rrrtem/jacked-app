-- ============================================
-- МИГРАЦИЯ: Добавление полей для рекордов и статистики
-- ============================================

-- 1. Добавляем колонку total_volume в workout_sessions
ALTER TABLE workout_sessions 
ADD COLUMN IF NOT EXISTS total_volume DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN workout_sessions.total_volume IS 'Общий вес поднятый за тренировку (вес × повторы × подходы) в кг';

-- 2. Добавляем колонки в таблицу users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_workouts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_weight_lifted DECIMAL(12, 2) DEFAULT 0;

COMMENT ON COLUMN users.total_workouts IS 'Общее количество завершенных тренировок';
COMMENT ON COLUMN users.total_weight_lifted IS 'Общий вес поднятый за все время в кг';

-- Индексы для быстрой фильтрации
CREATE INDEX IF NOT EXISTS idx_users_total_workouts ON users(total_workouts);
CREATE INDEX IF NOT EXISTS idx_users_total_weight_lifted ON users(total_weight_lifted);

-- 3. Создаем таблицу истории рекордов
CREATE TABLE IF NOT EXISTS exercise_record_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  workout_session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
  weight DECIMAL(10, 2), -- Вес в кг
  reps INTEGER, -- Количество повторений
  duration INTEGER, -- Длительность в секундах
  notes TEXT, -- Заметки о рекорде
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_exercise_record_history_user ON exercise_record_history(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_record_history_exercise ON exercise_record_history(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_record_history_achieved ON exercise_record_history(achieved_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_record_history_session ON exercise_record_history(workout_session_id);

-- RLS для exercise_record_history
ALTER TABLE exercise_record_history ENABLE ROW LEVEL SECURITY;

-- Удаляем политики, если они существуют (для идемпотентности)
DROP POLICY IF EXISTS "Users can view own record history" ON exercise_record_history;
DROP POLICY IF EXISTS "Users can insert own record history" ON exercise_record_history;
DROP POLICY IF EXISTS "Users can update own record history" ON exercise_record_history;
DROP POLICY IF EXISTS "Users can delete own record history" ON exercise_record_history;

-- Создаем политики заново
CREATE POLICY "Users can view own record history" ON exercise_record_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own record history" ON exercise_record_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own record history" ON exercise_record_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own record history" ON exercise_record_history
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Переименовываем таблицу workout_sets_data в workout_session_sets (если еще не переименована)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'workout_sets_data'
  ) THEN
    ALTER TABLE workout_sets_data RENAME TO workout_session_sets;
  END IF;
END $$;

-- 5. Функция для автоматического обновления статистики пользователя после завершения тренировки
CREATE OR REPLACE FUNCTION update_user_workout_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Обновляем статистику только при завершении тренировки
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD.completed_at IS DISTINCT FROM NEW.completed_at) THEN
    UPDATE users
    SET 
      total_workouts = total_workouts + 1,
      total_weight_lifted = total_weight_lifted + COALESCE(NEW.total_volume, 0)
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления статистики
DROP TRIGGER IF EXISTS trigger_update_user_workout_stats ON workout_sessions;
CREATE TRIGGER trigger_update_user_workout_stats
  AFTER UPDATE ON workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_workout_stats();

-- 6. Инициализируем значения для существующих пользователей
UPDATE users
SET total_workouts = (
  SELECT COUNT(*)
  FROM workout_sessions
  WHERE workout_sessions.user_id = users.id
    AND workout_sessions.completed_at IS NOT NULL
)
WHERE total_workouts = 0;

-- Подсчитываем total_weight_lifted для существующих пользователей
UPDATE users u
SET total_weight_lifted = COALESCE((
  SELECT SUM(ws.total_volume)
  FROM workout_sessions ws
  WHERE ws.user_id = u.id
    AND ws.completed_at IS NOT NULL
    AND ws.total_volume IS NOT NULL
), 0)
WHERE total_weight_lifted = 0;

COMMENT ON TABLE exercise_record_history IS 'История личных рекордов пользователя по упражнениям';

