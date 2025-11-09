-- ============================================
-- RESET WORKOUT SETS FOR PRIMARY USER
-- ============================================

TRUNCATE TABLE workout_set_exercises RESTART IDENTITY CASCADE;
TRUNCATE TABLE workout_sets RESTART IDENTITY CASCADE;

WITH target_user AS (
  SELECT id
  FROM users
  ORDER BY created_at
  LIMIT 1
),
set_definitions AS (
  SELECT target_user.id AS user_id, data.set_name, data.description
  FROM target_user
  CROSS JOIN (
    VALUES
      ('d1', 'Upper body strength emphasis: overhead press, deadlift, barbell curl.'),
      ('d2', 'Horizontal push & pull pairing: bench press with barbell row.'),
      ('d3', 'Lower body plus vertical pulling skill: front squat, assisted pull-ups, handstand holds.')
  ) AS data(set_name, description)
),
inserted_sets AS (
  INSERT INTO workout_sets (user_id, name, description)
  SELECT user_id, set_name, description
  FROM set_definitions
  RETURNING id, name
),
exercise_lookup AS (
  SELECT name, id
  FROM exercises
  WHERE name IN (
    'Overhead Press',
    'Deadlift',
    'Barbell Curl',
    'Bench Press',
    'Barbell Row',
    'Front Squat',
    'Assisted Pull-Ups',
    'Handstand Hold'
  )
),
exercise_plan AS (
  SELECT *
  FROM (VALUES
    ('d1', 0, 'Overhead Press', 4, 6, NULL::DECIMAL, 120),
    ('d1', 1, 'Deadlift', 4, 5, NULL::DECIMAL, 180),
    ('d1', 2, 'Barbell Curl', 3, 10, NULL::DECIMAL, 90),
    ('d2', 0, 'Bench Press', 5, 5, NULL::DECIMAL, 150),
    ('d2', 1, 'Barbell Row', 4, 8, NULL::DECIMAL, 120),
    ('d3', 0, 'Front Squat', 4, 6, NULL::DECIMAL, 150),
    ('d3', 1, 'Assisted Pull-Ups', 3, 10, NULL::DECIMAL, 120),
    ('d3', 2, 'Handstand Hold', 3, NULL::INTEGER, NULL::DECIMAL, 90)
  ) AS t(set_name, order_index, exercise_name, target_sets, target_reps, target_weight, rest_duration)
)
INSERT INTO workout_set_exercises (
  workout_set_id,
  exercise_id,
  order_index,
  target_sets,
  target_reps,
  target_weight,
  rest_duration
)
SELECT
  s.id,
  e.id,
  plan.order_index,
  plan.target_sets,
  plan.target_reps,
  plan.target_weight,
  plan.rest_duration
FROM exercise_plan AS plan
JOIN inserted_sets AS s ON s.name = plan.set_name
JOIN exercise_lookup AS e ON e.name = plan.exercise_name;

