-- ============================================
-- ТЕСТОВЫЕ ДАННЫЕ ДЛЯ РАЗРАБОТКИ
-- ============================================
-- Этот файл содержит дополнительные тестовые данные
-- для удобной разработки и тестирования приложения
-- ============================================

-- Очистка существующих тестовых данных (опционально)
-- ВНИМАНИЕ: раскомментируйте только если хотите начать с чистого листа
-- TRUNCATE workout_sets_data, workout_session_exercises, workout_sessions, 
--          workout_set_exercises, workout_sets, exercise_records CASCADE;

-- ============================================
-- 1. ДОПОЛНИТЕЛЬНЫЕ УПРАЖНЕНИЯ
-- ============================================

INSERT INTO exercises (name, instructions, tags) VALUES 
  -- Грудь
  ('Incline Bench Press', 'Жим штанги на наклонной скамье. Угол наклона 30-45 градусов.', ARRAY['push', 'chest', 'upper-chest', 'barbell']),
  ('Dumbbell Flyes', 'Разведение гантелей лёжа. Контролируйте движение, растягивайте грудные.', ARRAY['push', 'chest', 'dumbbell']),
  ('Cable Crossover', 'Сведение рук в кроссовере. Хорошо для изоляции груди.', ARRAY['push', 'chest', 'cable']),
  
  -- Спина
  ('Lat Pulldown', 'Вертикальная тяга в тренажёре. Тяните к груди, не к затылку.', ARRAY['pull', 'back', 'lats', 'cable']),
  ('T-Bar Row', 'Тяга Т-грифа. Держите спину прямой, тяните к животу.', ARRAY['pull', 'back', 'barbell']),
  ('Face Pulls', 'Тяга канатной рукояти к лицу. Отличное упражнение для задних дельт.', ARRAY['pull', 'shoulders', 'rear-delts', 'cable']),
  
  -- Ноги
  ('Romanian Deadlift', 'Румынская тяга. Акцент на заднюю поверхность бедра.', ARRAY['pull', 'legs', 'hamstrings', 'barbell']),
  ('Leg Press', 'Жим ногами в тренажёре. Ставьте ноги выше для ягодиц.', ARRAY['push', 'legs', 'machine']),
  ('Bulgarian Split Squat', 'Болгарские выпады. Одна нога на возвышении сзади.', ARRAY['legs', 'unilateral', 'dumbbell']),
  ('Calf Raises', 'Подъёмы на носки. Можно стоя или сидя.', ARRAY['legs', 'calves', 'bodyweight']),
  
  -- Плечи
  ('Lateral Raises', 'Махи гантелями в стороны. Не поднимайте выше плеч.', ARRAY['push', 'shoulders', 'side-delts', 'dumbbell']),
  ('Front Raises', 'Подъёмы гантелей перед собой. Для передних дельт.', ARRAY['push', 'shoulders', 'front-delts', 'dumbbell']),
  
  -- Руки
  ('Barbell Curl', 'Подъём штанги на бицепс. Не раскачивайтесь.', ARRAY['pull', 'biceps', 'barbell']),
  ('Hammer Curl', 'Молотковые подъёмы. Нейтральный хват гантелей.', ARRAY['pull', 'biceps', 'forearms', 'dumbbell']),
  ('Tricep Pushdown', 'Разгибания на трицепс в кроссовере. Локти прижаты к корпусу.', ARRAY['push', 'triceps', 'cable']),
  ('Skull Crushers', 'Французский жим лёжа. Опускайте штангу ко лбу или за голову.', ARRAY['push', 'triceps', 'barbell']),
  
  -- Кор
  ('Hanging Leg Raises', 'Подъёмы ног в висе. Поднимайте колени к груди или ноги прямо.', ARRAY['core', 'abs', 'bodyweight']),
  ('Ab Wheel Rollout', 'Раскатка с роликом для пресса. Держите кор напряжённым.', ARRAY['core', 'abs', 'full-body', 'bodyweight']),
  ('Russian Twist', 'Русские скручивания. Поворачивайте корпус в стороны.', ARRAY['core', 'abs', 'obliques', 'bodyweight']),
  
  -- Кардио
  ('Running', 'Бег на беговой дорожке или на улице.', ARRAY['cardio', 'legs']),
  ('Rowing Machine', 'Гребной тренажёр. Отличное кардио для всего тела.', ARRAY['cardio', 'full-body', 'machine']),
  ('Jump Rope', 'Прыжки на скакалке. Эффективное кардио.', ARRAY['cardio', 'bodyweight']),
  ('Burpees', 'Бёрпи. Комплексное упражнение на всё тело.', ARRAY['cardio', 'full-body', 'bodyweight', 'complex'])

ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. ДОПОЛНИТЕЛЬНЫЕ ШАБЛОНЫ ТРЕНИРОВОК
-- ============================================

-- Шаблон: Push Day (Грудь, Плечи, Трицепс)
DO $$
DECLARE
  push_set_id UUID;
BEGIN
  INSERT INTO workout_sets (user_id, name, description) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Push Day', 'Тренировка толкающих мышц: грудь, плечи, трицепс')
  RETURNING id INTO push_set_id;

  INSERT INTO workout_set_exercises (workout_set_id, exercise_id, order_index, target_sets, target_reps, rest_duration)
  SELECT push_set_id, e.id, row_number() OVER () - 1, 4, 8, 120
  FROM exercises e
  WHERE e.name IN ('Bench Press', 'Overhead Press', 'Incline Bench Press', 'Lateral Raises', 'Tricep Pushdown');
END $$;

-- Шаблон: Pull Day (Спина, Бицепс)
DO $$
DECLARE
  pull_set_id UUID;
BEGIN
  INSERT INTO workout_sets (user_id, name, description) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Pull Day', 'Тренировка тянущих мышц: спина, бицепс')
  RETURNING id INTO pull_set_id;

  INSERT INTO workout_set_exercises (workout_set_id, exercise_id, order_index, target_sets, target_reps, rest_duration)
  SELECT pull_set_id, e.id, row_number() OVER () - 1, 4, 8, 120
  FROM exercises e
  WHERE e.name IN ('Deadlift', 'Pull-ups', 'Barbell Row', 'Lat Pulldown', 'Barbell Curl');
END $$;

-- Шаблон: Leg Day (Ноги)
DO $$
DECLARE
  leg_set_id UUID;
BEGIN
  INSERT INTO workout_sets (user_id, name, description) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Leg Day', 'День ног: квадрицепсы, бицепс бедра, икры')
  RETURNING id INTO leg_set_id;

  INSERT INTO workout_set_exercises (workout_set_id, exercise_id, order_index, target_sets, target_reps, rest_duration)
  SELECT leg_set_id, e.id, row_number() OVER () - 1, 4, 10, 180
  FROM exercises e
  WHERE e.name IN ('Squats', 'Romanian Deadlift', 'Leg Press', 'Bulgarian Split Squat', 'Calf Raises');
END $$;

-- Шаблон: Upper Body
DO $$
DECLARE
  upper_set_id UUID;
BEGIN
  INSERT INTO workout_sets (user_id, name, description) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Upper Body', 'Верх тела: грудь, спина, плечи, руки')
  RETURNING id INTO upper_set_id;

  INSERT INTO workout_set_exercises (workout_set_id, exercise_id, order_index, target_sets, target_reps, rest_duration)
  SELECT upper_set_id, e.id, row_number() OVER () - 1, 3, 10, 90
  FROM exercises e
  WHERE e.name IN ('Bench Press', 'Barbell Row', 'Overhead Press', 'Pull-ups', 'Dips');
END $$;

-- Шаблон: Quick HIIT
DO $$
DECLARE
  hiit_set_id UUID;
BEGIN
  INSERT INTO workout_sets (user_id, name, description) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Quick HIIT', 'Быстрая высокоинтенсивная тренировка 20 минут')
  RETURNING id INTO hiit_set_id;

  INSERT INTO workout_set_exercises (workout_set_id, exercise_id, order_index, target_sets, target_reps, rest_duration)
  SELECT hiit_set_id, e.id, row_number() OVER () - 1, 3, 15, 30
  FROM exercises e
  WHERE e.name IN ('Burpees', 'Push-ups', 'Squats', 'Jump Rope', 'Plank');
END $$;

-- ============================================
-- 3. ТЕСТОВАЯ ИСТОРИЯ ТРЕНИРОВОК
-- ============================================

-- Тренировка 1 (3 дня назад)
DO $$
DECLARE
  session_id UUID;
  wse_id UUID;
BEGIN
  -- Создаём сессию
  INSERT INTO workout_sessions (user_id, started_at, completed_at, duration, notes) VALUES 
    ('00000000-0000-0000-0000-000000000001', 
     NOW() - INTERVAL '3 days', 
     NOW() - INTERVAL '3 days' + INTERVAL '45 minutes',
     2700, -- 45 минут
     'Отличная тренировка, чувствую прогресс!')
  RETURNING id INTO session_id;

  -- Push-ups
  INSERT INTO workout_session_exercises (workout_session_id, exercise_id, order_index, warmup_completed)
  SELECT session_id, e.id, 0, true FROM exercises e WHERE e.name = 'Push-ups'
  RETURNING id INTO wse_id;

  INSERT INTO workout_sets_data (workout_session_exercise_id, set_number, reps, completed) VALUES
    (wse_id, 1, 20, true),
    (wse_id, 2, 18, true),
    (wse_id, 3, 15, true);

  -- Squats
  INSERT INTO workout_session_exercises (workout_session_id, exercise_id, order_index, warmup_completed)
  SELECT session_id, e.id, 1, true FROM exercises e WHERE e.name = 'Squats'
  RETURNING id INTO wse_id;

  INSERT INTO workout_sets_data (workout_session_exercise_id, set_number, weight, reps, completed) VALUES
    (wse_id, 1, 60, 12, true),
    (wse_id, 2, 60, 10, true),
    (wse_id, 3, 60, 10, true);

  -- Pull-ups
  INSERT INTO workout_session_exercises (workout_session_id, exercise_id, order_index, warmup_completed)
  SELECT session_id, e.id, 2, true FROM exercises e WHERE e.name = 'Pull-ups'
  RETURNING id INTO wse_id;

  INSERT INTO workout_sets_data (workout_session_exercise_id, set_number, reps, completed) VALUES
    (wse_id, 1, 8, true),
    (wse_id, 2, 7, true),
    (wse_id, 3, 6, true);
END $$;

-- Тренировка 2 (вчера)
DO $$
DECLARE
  session_id UUID;
  wse_id UUID;
BEGIN
  INSERT INTO workout_sessions (user_id, started_at, completed_at, duration, notes) VALUES 
    ('00000000-0000-0000-0000-000000000001', 
     NOW() - INTERVAL '1 day', 
     NOW() - INTERVAL '1 day' + INTERVAL '50 minutes',
     3000,
     'Немного устал, но закончил!')
  RETURNING id INTO session_id;

  -- Bench Press
  INSERT INTO workout_session_exercises (workout_session_id, exercise_id, order_index, warmup_completed)
  SELECT session_id, e.id, 0, true FROM exercises e WHERE e.name = 'Bench Press'
  RETURNING id INTO wse_id;

  INSERT INTO workout_sets_data (workout_session_exercise_id, set_number, weight, reps, completed) VALUES
    (wse_id, 1, 60, 10, true),
    (wse_id, 2, 70, 8, true),
    (wse_id, 3, 80, 6, true),
    (wse_id, 4, 80, 5, true);

  -- Overhead Press
  INSERT INTO workout_session_exercises (workout_session_id, exercise_id, order_index, warmup_completed)
  SELECT session_id, e.id, 1, true FROM exercises e WHERE e.name = 'Overhead Press'
  RETURNING id INTO wse_id;

  INSERT INTO workout_sets_data (workout_session_exercise_id, set_number, weight, reps, completed) VALUES
    (wse_id, 1, 40, 10, true),
    (wse_id, 2, 45, 8, true),
    (wse_id, 3, 50, 6, true);

  -- Dips
  INSERT INTO workout_session_exercises (workout_session_id, exercise_id, order_index, warmup_completed)
  SELECT session_id, e.id, 2, true FROM exercises e WHERE e.name = 'Dips'
  RETURNING id INTO wse_id;

  INSERT INTO workout_sets_data (workout_session_exercise_id, set_number, reps, completed) VALUES
    (wse_id, 1, 15, true),
    (wse_id, 2, 12, true),
    (wse_id, 3, 10, true);
END $$;

-- ============================================
-- 4. ЛИЧНЫЕ РЕКОРДЫ
-- ============================================

INSERT INTO exercise_records (user_id, exercise_id, max_weight, max_reps, max_duration, last_updated)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  e.id,
  CASE e.name
    WHEN 'Bench Press' THEN 100
    WHEN 'Squats' THEN 120
    WHEN 'Deadlift' THEN 140
    WHEN 'Overhead Press' THEN 60
    WHEN 'Barbell Row' THEN 80
    ELSE NULL
  END,
  CASE e.name
    WHEN 'Push-ups' THEN 50
    WHEN 'Pull-ups' THEN 15
    WHEN 'Dips' THEN 30
    ELSE NULL
  END,
  CASE e.name
    WHEN 'Plank' THEN 180
    WHEN 'Running' THEN 1800
    ELSE NULL
  END,
  NOW()
FROM exercises e
WHERE e.name IN ('Bench Press', 'Squats', 'Deadlift', 'Overhead Press', 'Barbell Row', 
                  'Push-ups', 'Pull-ups', 'Dips', 'Plank', 'Running')
ON CONFLICT (user_id, exercise_id) DO UPDATE
SET 
  max_weight = EXCLUDED.max_weight,
  max_reps = EXCLUDED.max_reps,
  max_duration = EXCLUDED.max_duration,
  last_updated = NOW();

-- ============================================
-- 5. ДОПОЛНИТЕЛЬНАЯ ИСТОРИЯ (последние 30 дней)
-- ============================================

-- Генерируем случайные тренировки за последний месяц
DO $$
DECLARE
  i INTEGER;
  session_id UUID;
  wse_id UUID;
  workout_date TIMESTAMPTZ;
  exercise_names TEXT[] := ARRAY['Push-ups', 'Squats', 'Pull-ups'];
  exercise_name TEXT;
BEGIN
  FOR i IN 1..10 LOOP
    workout_date := NOW() - (random() * INTERVAL '30 days');
    
    -- Создаём сессию
    INSERT INTO workout_sessions (user_id, started_at, completed_at, duration) VALUES 
      ('00000000-0000-0000-0000-000000000001', 
       workout_date,
       workout_date + INTERVAL '40 minutes',
       2400)
    RETURNING id INTO session_id;

    -- Добавляем случайные упражнения
    FOREACH exercise_name IN ARRAY exercise_names LOOP
      INSERT INTO workout_session_exercises (workout_session_id, exercise_id, order_index, warmup_completed)
      SELECT session_id, e.id, array_position(exercise_names, exercise_name) - 1, true 
      FROM exercises e WHERE e.name = exercise_name
      RETURNING id INTO wse_id;

      -- Добавляем 3 подхода
      INSERT INTO workout_sets_data (workout_session_exercise_id, set_number, weight, reps, completed) VALUES
        (wse_id, 1, 50 + (random() * 20)::INTEGER, 8 + (random() * 5)::INTEGER, true),
        (wse_id, 2, 50 + (random() * 20)::INTEGER, 8 + (random() * 5)::INTEGER, true),
        (wse_id, 3, 50 + (random() * 20)::INTEGER, 8 + (random() * 5)::INTEGER, true);
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- ПРОВЕРКА ДАННЫХ
-- ============================================

-- Проверяем количество упражнений
SELECT 'Всего упражнений:' as info, COUNT(*) as count FROM exercises;

-- Проверяем количество шаблонов
SELECT 'Всего шаблонов:' as info, COUNT(*) as count FROM workout_sets;

-- Проверяем количество завершённых тренировок
SELECT 'Завершённых тренировок:' as info, COUNT(*) as count 
FROM workout_sessions WHERE completed_at IS NOT NULL;

-- Проверяем количество рекордов
SELECT 'Личных рекордов:' as info, COUNT(*) as count FROM exercise_records;

-- Последние 5 тренировок
SELECT 
  started_at::date as date,
  duration / 60 as duration_minutes,
  notes
FROM workout_sessions 
WHERE completed_at IS NOT NULL
ORDER BY started_at DESC
LIMIT 5;

