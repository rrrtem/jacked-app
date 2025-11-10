-- Миграция: переход от tags к структурированным категориям упражнений
-- Дата: 2025-11-10

-- 1. Добавляем новые колонки
ALTER TABLE exercises 
ADD COLUMN exercise_type TEXT,
ADD COLUMN movement_pattern TEXT,
ADD COLUMN muscle_group TEXT,
ADD COLUMN equipment TEXT;

-- 2. Создаем функцию для миграции существующих данных из tags
CREATE OR REPLACE FUNCTION migrate_exercise_tags() RETURNS void AS $$
DECLARE
  exercise_row RECORD;
  tag TEXT;
BEGIN
  FOR exercise_row IN SELECT id, tags FROM exercises WHERE tags IS NOT NULL LOOP
    -- Обрабатываем каждый тег
    FOREACH tag IN ARRAY exercise_row.tags LOOP
      -- Exercise types
      IF tag IN ('warmup', 'warm-up', 'warm up', 'warm') THEN
        UPDATE exercises SET exercise_type = 'warmup' WHERE id = exercise_row.id;
      ELSIF tag IN ('duration', 'time', 'timed') THEN
        UPDATE exercises SET exercise_type = 'duration' WHERE id = exercise_row.id;
      ELSIF tag IN ('weight', 'weights', 'strength') THEN
        UPDATE exercises SET exercise_type = 'weight' WHERE id = exercise_row.id;
      ELSIF tag IN ('mobility', 'flexibility') THEN
        UPDATE exercises SET exercise_type = 'mobility' WHERE id = exercise_row.id;
      ELSIF tag IN ('stretching', 'stretch') THEN
        UPDATE exercises SET exercise_type = 'stretching' WHERE id = exercise_row.id;
      END IF;
      
      -- Movement patterns
      IF tag IN ('compound', 'complex', 'full-body') THEN
        UPDATE exercises SET movement_pattern = 'complex' WHERE id = exercise_row.id;
      ELSIF tag IN ('isolation', 'isolated', 'iso') THEN
        UPDATE exercises SET movement_pattern = 'iso' WHERE id = exercise_row.id;
      END IF;
      
      -- Muscle groups
      IF tag IN ('chest', 'pecs') THEN
        UPDATE exercises SET muscle_group = 'chest' WHERE id = exercise_row.id;
      ELSIF tag IN ('back', 'lats') THEN
        UPDATE exercises SET muscle_group = 'back' WHERE id = exercise_row.id;
      ELSIF tag IN ('legs', 'quads', 'glutes', 'hamstrings') THEN
        UPDATE exercises SET muscle_group = 'legs' WHERE id = exercise_row.id;
      ELSIF tag IN ('shoulders', 'delts') THEN
        UPDATE exercises SET muscle_group = 'shoulders' WHERE id = exercise_row.id;
      ELSIF tag IN ('arms', 'biceps', 'triceps') THEN
        UPDATE exercises SET muscle_group = 'arms' WHERE id = exercise_row.id;
      ELSIF tag IN ('core', 'abs', 'obliques') THEN
        UPDATE exercises SET muscle_group = 'core' WHERE id = exercise_row.id;
      ELSIF tag IN ('full-body', 'full body') THEN
        UPDATE exercises SET muscle_group = 'full_body' WHERE id = exercise_row.id;
      END IF;
      
      -- Equipment
      IF tag IN ('bodyweight', 'calisthenics') THEN
        UPDATE exercises SET equipment = 'bodyweight' WHERE id = exercise_row.id;
      ELSIF tag IN ('barbell', 'bar') THEN
        UPDATE exercises SET equipment = 'barbell' WHERE id = exercise_row.id;
      ELSIF tag IN ('dumbbell', 'dumbbells', 'db') THEN
        UPDATE exercises SET equipment = 'dumbbell' WHERE id = exercise_row.id;
      ELSIF tag IN ('machine') THEN
        UPDATE exercises SET equipment = 'machine' WHERE id = exercise_row.id;
      ELSIF tag IN ('cable', 'cables') THEN
        UPDATE exercises SET equipment = 'cable' WHERE id = exercise_row.id;
      ELSIF tag IN ('kettlebell', 'kb') THEN
        UPDATE exercises SET equipment = 'kettlebell' WHERE id = exercise_row.id;
      ELSIF tag IN ('bands', 'band', 'resistance band') THEN
        UPDATE exercises SET equipment = 'bands' WHERE id = exercise_row.id;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Выполняем миграцию данных
SELECT migrate_exercise_tags();

-- 4. Удаляем временную функцию
DROP FUNCTION migrate_exercise_tags();

-- 5. Устанавливаем значения по умолчанию для упражнений без категорий
UPDATE exercises 
SET exercise_type = 'weight' 
WHERE exercise_type IS NULL;

UPDATE exercises 
SET movement_pattern = 'complex' 
WHERE movement_pattern IS NULL;

UPDATE exercises 
SET muscle_group = 'full_body' 
WHERE muscle_group IS NULL;

UPDATE exercises 
SET equipment = 'bodyweight' 
WHERE equipment IS NULL;

-- 6. Делаем новые колонки обязательными
ALTER TABLE exercises 
ALTER COLUMN exercise_type SET NOT NULL,
ALTER COLUMN movement_pattern SET NOT NULL,
ALTER COLUMN muscle_group SET NOT NULL,
ALTER COLUMN equipment SET NOT NULL;

-- 7. Удаляем старую колонку tags
ALTER TABLE exercises DROP COLUMN tags;

-- 8. Создаем индексы для быстрого поиска
CREATE INDEX idx_exercises_exercise_type ON exercises(exercise_type);
CREATE INDEX idx_exercises_movement_pattern ON exercises(movement_pattern);
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX idx_exercises_equipment ON exercises(equipment);

-- 9. Добавляем комментарии к колонкам
COMMENT ON COLUMN exercises.exercise_type IS 'Тип упражнения: weight (упражнения с весом/повторениями), duration (упражнения на время), warmup (разминка), mobility, stretching';
COMMENT ON COLUMN exercises.movement_pattern IS 'Паттерн движения: complex (многосуставное), iso (изолированное)';
COMMENT ON COLUMN exercises.muscle_group IS 'Группа мышц: chest, back, legs, shoulders, arms, core, full_body';
COMMENT ON COLUMN exercises.equipment IS 'Оборудование: bodyweight, barbell, dumbbell, machine, cable, kettlebell, bands';

-- 10. Обновляем примеры упражнений (если они есть)
UPDATE exercises SET 
  exercise_type = 'weight',
  movement_pattern = 'compound',
  muscle_group = 'chest',
  equipment = 'bodyweight'
WHERE name ILIKE '%push%up%' OR name ILIKE '%push-up%';

UPDATE exercises SET 
  exercise_type = 'weight',
  movement_pattern = 'compound',
  muscle_group = 'back',
  equipment = 'bodyweight'
WHERE name ILIKE '%pull%up%' OR name ILIKE '%pull-up%';

UPDATE exercises SET 
  exercise_type = 'weight',
  movement_pattern = 'compound',
  muscle_group = 'legs',
  equipment = 'bodyweight'
WHERE name ILIKE '%squat%' AND equipment = 'bodyweight';

UPDATE exercises SET 
  exercise_type = 'weight',
  movement_pattern = 'compound',
  muscle_group = 'chest',
  equipment = 'barbell'
WHERE name ILIKE '%bench%press%';

UPDATE exercises SET 
  exercise_type = 'weight',
  movement_pattern = 'compound',
  muscle_group = 'back',
  equipment = 'barbell'
WHERE name ILIKE '%deadlift%' OR name ILIKE '%dead%lift%';

UPDATE exercises SET 
  exercise_type = 'warmup',
  movement_pattern = 'compound',
  muscle_group = 'full_body',
  equipment = 'bodyweight'
WHERE name ILIKE '%warm%' OR name ILIKE '%warmup%' OR name ILIKE '%warm-up%';

-- Упражнения на время (планка, статические упражнения)
UPDATE exercises SET 
  exercise_type = 'duration'
WHERE name ILIKE '%plank%' OR name ILIKE '%планка%' OR name ILIKE '%hold%';

-- Готово! Теперь exercises имеет структурированные категории

