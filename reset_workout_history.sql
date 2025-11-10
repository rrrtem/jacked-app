-- ============================================
-- СКРИПТ ДЛЯ ОЧИСТКИ ИСТОРИИ ТРЕНИРОВОК
-- И ДОБАВЛЕНИЯ НОВЫХ ДАННЫХ
-- ============================================
-- Удаляет всю историю тренировок, но оставляет:
-- - упражнения (exercises)
-- - шаблоны тренировок (workout_sets, workout_set_exercises)
-- - личные рекорды (exercise_records)
-- ============================================

-- ============================================
-- 1. ОЧИСТКА ИСТОРИИ ТРЕНИРОВОК
-- ============================================
-- Удаляем все записи тренировок
-- Связанные данные из workout_session_exercises и workout_sets_data
-- удалятся автоматически через CASCADE
DELETE FROM workout_sessions;

-- ============================================
-- 2. ТРЕНИРОВКА 1 НОЯБРЯ 2025
-- ============================================
DO $$
DECLARE
  session_id UUID;
  wse_deadlift_id UUID;
  wse_overhead_id UUID;
BEGIN
  -- Создаём сессию тренировки на 1 ноября 2025
  INSERT INTO workout_sessions (
    user_id, 
    started_at, 
    completed_at, 
    duration, 
    notes
  ) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '2025-11-01 10:00:00+00'::TIMESTAMPTZ,
    '2025-11-01 11:00:00+00'::TIMESTAMPTZ,
    3600, -- 60 минут
    'Становая тяга и жим над головой'
  )
  RETURNING id INTO session_id;

  -- ============================================
  -- DEADLIFT (Становая тяга)
  -- ============================================
  INSERT INTO workout_session_exercises (
    workout_session_id, 
    exercise_id, 
    order_index, 
    warmup_completed
  )
  SELECT 
    session_id, 
    e.id, 
    0, 
    true 
  FROM exercises e 
  WHERE e.name = 'Deadlift'
  RETURNING id INTO wse_deadlift_id;

  -- Подходы для становой тяги
  INSERT INTO workout_sets_data (
    workout_session_exercise_id, 
    set_number, 
    weight, 
    reps, 
    completed
  ) VALUES
    (wse_deadlift_id, 1, 20, 8, true),  -- Пустой гриф
    (wse_deadlift_id, 2, 30, 8, true),  -- 30 кг
    (wse_deadlift_id, 3, 35, 8, true);  -- 35 кг

  -- ============================================
  -- OVERHEAD PRESS (Жим над головой)
  -- ============================================
  INSERT INTO workout_session_exercises (
    workout_session_id, 
    exercise_id, 
    order_index, 
    warmup_completed
  )
  SELECT 
    session_id, 
    e.id, 
    1, 
    true 
  FROM exercises e 
  WHERE e.name = 'Overhead Press'
  RETURNING id INTO wse_overhead_id;

  -- Подходы для жима над головой
  INSERT INTO workout_sets_data (
    workout_session_exercise_id, 
    set_number, 
    weight, 
    reps, 
    completed
  ) VALUES
    (wse_overhead_id, 1, 20, 8, true),  -- Пустой гриф
    (wse_overhead_id, 2, 20, 8, true),  -- 20 кг
    (wse_overhead_id, 3, 30, 8, true);  -- 30 кг

  RAISE NOTICE 'Тренировка 1 ноября создана успешно (ID: %)', session_id;
END $$;

-- ============================================
-- 3. ТРЕНИРОВКА 4 НОЯБРЯ 2025
-- ============================================
DO $$
DECLARE
  session_id UUID;
  wse_bench_id UUID;
  wse_squat_id UUID;
BEGIN
  -- Создаём сессию тренировки на 4 ноября 2025
  INSERT INTO workout_sessions (
    user_id, 
    started_at, 
    completed_at, 
    duration, 
    notes
  ) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '2025-11-04 10:00:00+00'::TIMESTAMPTZ,
    '2025-11-04 11:00:00+00'::TIMESTAMPTZ,
    3600, -- 60 минут
    'Жим лёжа и приседания'
  )
  RETURNING id INTO session_id;

  -- ============================================
  -- BENCH PRESS (Жим лёжа)
  -- ============================================
  INSERT INTO workout_session_exercises (
    workout_session_id, 
    exercise_id, 
    order_index, 
    warmup_completed
  )
  SELECT 
    session_id, 
    e.id, 
    0, 
    true 
  FROM exercises e 
  WHERE e.name = 'Bench Press'
  RETURNING id INTO wse_bench_id;

  -- Подходы для жима лёжа
  INSERT INTO workout_sets_data (
    workout_session_exercise_id, 
    set_number, 
    weight, 
    reps, 
    completed
  ) VALUES
    (wse_bench_id, 1, 20, 8, true),  -- Пустой гриф
    (wse_bench_id, 2, 25, 8, true),  -- 25 кг
    (wse_bench_id, 3, 30, 8, true);  -- 30 кг

  -- ============================================
  -- SQUATS (Приседания со штангой)
  -- ============================================
  INSERT INTO workout_session_exercises (
    workout_session_id, 
    exercise_id, 
    order_index, 
    warmup_completed
  )
  SELECT 
    session_id, 
    e.id, 
    1, 
    true 
  FROM exercises e 
  WHERE e.name = 'Squats'
  RETURNING id INTO wse_squat_id;

  -- Подходы для приседаний
  -- Добавляю 4 подхода (как упоминалось в описании)
  INSERT INTO workout_sets_data (
    workout_session_exercise_id, 
    set_number, 
    weight, 
    reps, 
    completed
  ) VALUES
    (wse_squat_id, 1, 20, 8, true),  -- 20 кг
    (wse_squat_id, 2, 30, 8, true),  -- 30 кг
    (wse_squat_id, 3, 35, 8, true),  -- 35 кг
    (wse_squat_id, 4, 35, 8, true);  -- 35 кг (4-й подход)

  RAISE NOTICE 'Тренировка 4 ноября создана успешно (ID: %)', session_id;
END $$;

-- ============================================
-- 4. ПРОВЕРКА РЕЗУЛЬТАТОВ
-- ============================================

-- Показываем созданные тренировки
SELECT 
  ws.started_at::date as "Дата",
  ws.duration / 60 as "Длительность (мин)",
  ws.notes as "Заметки",
  COUNT(wse.id) as "Упражнений"
FROM workout_sessions ws
LEFT JOIN workout_session_exercises wse ON wse.workout_session_id = ws.id
GROUP BY ws.id, ws.started_at, ws.duration, ws.notes
ORDER BY ws.started_at;

-- Показываем детальную информацию о подходах
SELECT 
  ws.started_at::date as "Дата",
  e.name as "Упражнение",
  wsd.set_number as "Подход",
  wsd.weight as "Вес (кг)",
  wsd.reps as "Повторения"
FROM workout_sessions ws
JOIN workout_session_exercises wse ON wse.workout_session_id = ws.id
JOIN exercises e ON e.id = wse.exercise_id
JOIN workout_sets_data wsd ON wsd.workout_session_exercise_id = wse.id
ORDER BY ws.started_at, wse.order_index, wsd.set_number;

-- Итоговая статистика
SELECT 
  'Всего тренировок:' as "Статистика", 
  COUNT(*)::TEXT as "Значение"
FROM workout_sessions
UNION ALL
SELECT 
  'Всего упражнений:', 
  COUNT(*)::TEXT
FROM workout_session_exercises
UNION ALL
SELECT 
  'Всего подходов:', 
  COUNT(*)::TEXT
FROM workout_sets_data;


