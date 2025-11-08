-- ============================================
-- СХЕМА БД ДЛЯ ПРИЛОЖЕНИЯ ТРЕНИРОВОК
-- ============================================

-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска по email
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- 2. ТАБЛИЦА УПРАЖНЕНИЙ
-- ============================================
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  instructions TEXT,
  tags TEXT[] DEFAULT '{}', -- Массив тегов: push-ups, full-body, back, chest, legs, biceps и т.д.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для поиска по тегам
CREATE INDEX idx_exercises_tags ON exercises USING GIN(tags);

-- ============================================
-- 3. ЛИЧНЫЕ РЕКОРДЫ ПОЛЬЗОВАТЕЛЯ ПО УПРАЖНЕНИЯМ
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  max_weight DECIMAL(10, 2), -- Максимальный вес в кг
  max_reps INTEGER, -- Максимальное количество повторений
  max_duration INTEGER, -- Максимальная длительность в секундах
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exercise_id) -- Один рекорд на пару пользователь-упражнение
);

-- Индексы для быстрого поиска
CREATE INDEX idx_exercise_records_user ON exercise_records(user_id);
CREATE INDEX idx_exercise_records_exercise ON exercise_records(exercise_id);

-- ============================================
-- 4. ШАБЛОНЫ ТРЕНИРОВОК (Workout Sets)
-- ============================================
CREATE TABLE IF NOT EXISTS workout_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска по пользователю
CREATE INDEX idx_workout_sets_user ON workout_sets(user_id);

-- ============================================
-- 5. УПРАЖНЕНИЯ В ШАБЛОНАХ ТРЕНИРОВОК
-- Связь многие-ко-многим между workout_sets и exercises
-- ============================================
CREATE TABLE IF NOT EXISTS workout_set_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_set_id UUID NOT NULL REFERENCES workout_sets(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0, -- Порядок упражнений в шаблоне
  target_sets INTEGER DEFAULT 3, -- Целевое количество подходов
  target_reps INTEGER, -- Целевое количество повторений
  target_weight DECIMAL(10, 2), -- Целевой вес
  rest_duration INTEGER DEFAULT 90, -- Время отдыха между подходами в секундах
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workout_set_id, exercise_id)
);

-- Индексы
CREATE INDEX idx_workout_set_exercises_set ON workout_set_exercises(workout_set_id);
CREATE INDEX idx_workout_set_exercises_exercise ON workout_set_exercises(exercise_id);

-- ============================================
-- 6. СЕССИИ ТРЕНИРОВОК
-- ============================================
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_set_id UUID REFERENCES workout_sets(id) ON DELETE SET NULL, -- Опционально, если создана из шаблона
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration INTEGER, -- Общая длительность в секундах
  notes TEXT, -- Заметки о тренировке
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_started ON workout_sessions(started_at DESC);
CREATE INDEX idx_workout_sessions_completed ON workout_sessions(completed_at DESC);

-- ============================================
-- 7. УПРАЖНЕНИЯ В СЕССИИ ТРЕНИРОВКИ
-- ============================================
CREATE TABLE IF NOT EXISTS workout_session_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0, -- Порядок упражнений в сессии
  warmup_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_workout_session_exercises_session ON workout_session_exercises(workout_session_id);
CREATE INDEX idx_workout_session_exercises_exercise ON workout_session_exercises(exercise_id);

-- ============================================
-- 8. ПОДХОДЫ В УПРАЖНЕНИЯХ (Sets Data)
-- ============================================
CREATE TABLE IF NOT EXISTS workout_sets_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_session_exercise_id UUID NOT NULL REFERENCES workout_session_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL, -- Номер подхода (1, 2, 3...)
  weight DECIMAL(10, 2), -- Вес в кг
  reps INTEGER, -- Количество повторений
  duration INTEGER, -- Длительность подхода в секундах (для упражнений на время)
  completed BOOLEAN DEFAULT TRUE,
  notes TEXT, -- Заметки к подходу
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_workout_sets_data_exercise ON workout_sets_data(workout_session_exercise_id);

-- ============================================
-- 9. ИСТОРИЯ ЛИЧНЫХ РЕКОРДОВ
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_record_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  workout_session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL, -- Ссылка на тренировку, где был установлен рекорд
  weight DECIMAL(10, 2), -- Вес в кг
  reps INTEGER, -- Количество повторений
  duration INTEGER, -- Длительность в секундах
  achieved_at TIMESTAMPTZ DEFAULT NOW(), -- Дата достижения рекорда
  notes TEXT, -- Заметки о достижении
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска и сортировки по дате
CREATE INDEX idx_exercise_record_history_user ON exercise_record_history(user_id);
CREATE INDEX idx_exercise_record_history_exercise ON exercise_record_history(exercise_id);
CREATE INDEX idx_exercise_record_history_achieved_at ON exercise_record_history(achieved_at DESC);
CREATE INDEX idx_exercise_record_history_user_exercise ON exercise_record_history(user_id, exercise_id, achieved_at DESC);

-- ============================================
-- ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ updated_at
-- ============================================

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для всех таблиц с updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_sets_updated_at BEFORE UPDATE ON workout_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_sessions_updated_at BEFORE UPDATE ON workout_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Включаем RLS для всех таблиц
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_record_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_set_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets_data ENABLE ROW LEVEL SECURITY;

-- Политики для users (каждый видит только свои данные)
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Политики для exercises (все упражнения публичны для чтения)
CREATE POLICY "Exercises are viewable by everyone" ON exercises
  FOR SELECT USING (true);

-- Политики для exercise_records (только свои рекорды)
CREATE POLICY "Users can view own records" ON exercise_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" ON exercise_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" ON exercise_records
  FOR UPDATE USING (auth.uid() = user_id);

-- Политики для exercise_record_history (только своя история рекордов)
CREATE POLICY "Users can view own record history" ON exercise_record_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own record history" ON exercise_record_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own record history" ON exercise_record_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own record history" ON exercise_record_history
  FOR DELETE USING (auth.uid() = user_id);

-- Политики для workout_sets (только свои шаблоны)
CREATE POLICY "Users can view own workout sets" ON workout_sets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sets" ON workout_sets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sets" ON workout_sets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sets" ON workout_sets
  FOR DELETE USING (auth.uid() = user_id);

-- Политики для workout_set_exercises
CREATE POLICY "Users can view exercises in own workout sets" ON workout_set_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_sets 
      WHERE workout_sets.id = workout_set_exercises.workout_set_id 
      AND workout_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert exercises in own workout sets" ON workout_set_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_sets 
      WHERE workout_sets.id = workout_set_exercises.workout_set_id 
      AND workout_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exercises in own workout sets" ON workout_set_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workout_sets 
      WHERE workout_sets.id = workout_set_exercises.workout_set_id 
      AND workout_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exercises from own workout sets" ON workout_set_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workout_sets 
      WHERE workout_sets.id = workout_set_exercises.workout_set_id 
      AND workout_sets.user_id = auth.uid()
    )
  );

-- Политики для workout_sessions (только свои сессии)
CREATE POLICY "Users can view own workout sessions" ON workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions" ON workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions" ON workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sessions" ON workout_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Политики для workout_session_exercises
CREATE POLICY "Users can view exercises in own sessions" ON workout_session_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_sessions 
      WHERE workout_sessions.id = workout_session_exercises.workout_session_id 
      AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert exercises in own sessions" ON workout_session_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_sessions 
      WHERE workout_sessions.id = workout_session_exercises.workout_session_id 
      AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exercises in own sessions" ON workout_session_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workout_sessions 
      WHERE workout_sessions.id = workout_session_exercises.workout_session_id 
      AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exercises from own sessions" ON workout_session_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workout_sessions 
      WHERE workout_sessions.id = workout_session_exercises.workout_session_id 
      AND workout_sessions.user_id = auth.uid()
    )
  );

-- Политики для workout_sets_data
CREATE POLICY "Users can view sets in own sessions" ON workout_sets_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_session_exercises wse
      JOIN workout_sessions ws ON ws.id = wse.workout_session_id
      WHERE wse.id = workout_sets_data.workout_session_exercise_id 
      AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sets in own sessions" ON workout_sets_data
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_session_exercises wse
      JOIN workout_sessions ws ON ws.id = wse.workout_session_id
      WHERE wse.id = workout_sets_data.workout_session_exercise_id 
      AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sets in own sessions" ON workout_sets_data
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workout_session_exercises wse
      JOIN workout_sessions ws ON ws.id = wse.workout_session_id
      WHERE wse.id = workout_sets_data.workout_session_exercise_id 
      AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sets from own sessions" ON workout_sets_data
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workout_session_exercises wse
      JOIN workout_sessions ws ON ws.id = wse.workout_session_id
      WHERE wse.id = workout_sets_data.workout_session_exercise_id 
      AND ws.user_id = auth.uid()
    )
  );