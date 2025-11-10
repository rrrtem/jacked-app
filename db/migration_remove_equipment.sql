-- Миграция: удаление поля equipment и обновление exercise_type
-- Дата: 2025-11-10

-- 1. Переносим значения equipment в exercise_type где это имеет смысл
UPDATE exercises 
SET exercise_type = 'body'
WHERE equipment = 'bodyweight' AND exercise_type = 'weight';

UPDATE exercises 
SET exercise_type = 'dumbbell'
WHERE equipment = 'dumbbell' AND exercise_type = 'weight';

-- 2. Удаляем индекс на equipment
DROP INDEX IF EXISTS idx_exercises_equipment;

-- 3. Удаляем колонку equipment
ALTER TABLE exercises DROP COLUMN IF EXISTS equipment;

-- 4. Обновляем комментарий к exercise_type
COMMENT ON COLUMN exercises.exercise_type IS 'Тип упражнения: weight (со штангой/весом), body (собственный вес), dumbbell (гантели), duration (на время), warmup, mobility, stretching';

-- Готово! Поле equipment удалено


