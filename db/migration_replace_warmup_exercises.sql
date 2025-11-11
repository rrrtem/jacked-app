-- ============================================
-- MIGRATION: Replace Warm-up Exercises
-- ============================================
-- This migration replaces all existing warm-up exercises
-- with a new comprehensive set of 60 simple warm-up exercises
-- Date: 2025-11-11
-- ============================================

-- STEP 1: Delete all existing warm-up exercises
-- Note: This will also cascade delete any references in workout sets and history
-- If you want to preserve workout history, remove CASCADE and handle references manually

DELETE FROM exercises WHERE exercise_type = 'warmup';

-- STEP 2: Insert 60 new warm-up exercises

-- Part 1: Basic Movements (1-20)
INSERT INTO exercises (name, instructions, exercise_type, movement_pattern, muscle_group) VALUES
  ('Head Turns', 'Slowly turn your head to the right, then to the left, like you''re looking over your shoulder. 10 times each side.', 'warmup', 'isolation', 'full_body'),
  ('Head Circles', 'Gently make circles with your head: tilt forward, to the side, back, and to the other side. 5 times each direction.', 'warmup', 'isolation', 'full_body'),
  ('Shoulder Shrugs', 'Lift your shoulders up toward your ears, hold for a second, and drop them down. 15 times.', 'warmup', 'isolation', 'shoulders'),
  ('Shoulder Circles', 'Make circular movements with your shoulders: first roll them forward, then backward. 10 times forward and 10 backward.', 'warmup', 'isolation', 'shoulders'),
  ('Arm Swings', 'Spread your arms to the sides and make small circles, like you''re drawing in the air. 20 times.', 'warmup', 'compound', 'shoulders'),
  ('Torso Twists', 'Stand straight with hands on your hips, turn your upper body right and left. 15 times each side.', 'warmup', 'compound', 'core'),
  ('Side Bends', 'Raise one arm overhead and lean to the opposite side, then switch arms. 10 times each side.', 'warmup', 'compound', 'core'),
  ('Forward Bends', 'Bend forward, trying to reach your hands to the floor or to your knees. 10 times.', 'warmup', 'compound', 'full_body'),
  ('Hip Circles', 'Put your hands on your hips and make circular movements with your hips, like you''re spinning a hula hoop. 10 times each direction.', 'warmup', 'compound', 'core'),
  ('Squats', 'Stand straight with feet shoulder-width apart, bend your knees and lower down like you''re sitting in a chair, then stand up. 15 times.', 'warmup', 'compound', 'legs'),
  ('Lunges in Place', 'Step one leg forward and bend both knees, lowering down, then return and switch legs. 10 times each leg.', 'warmup', 'compound', 'legs'),
  ('Heel Raises', 'Stand straight and rise up on your tiptoes, like you want to reach something high, then lower down. 20 times.', 'warmup', 'isolation', 'legs'),
  ('Jumping Jacks', 'Jump while spreading your legs to the sides and clapping your hands overhead, then return to starting position. 20 times.', 'warmup', 'compound', 'full_body'),
  ('Leg Swings Forward-Back', 'Hold onto a wall or chair, swing one leg forward and backward, then switch legs. 10 times each leg.', 'warmup', 'isolation', 'legs'),
  ('Knee Circles', 'Put your feet together, bend your knees slightly, place your hands on them, and make circular movements with your knees. 10 times each direction.', 'warmup', 'compound', 'legs'),
  ('Ankle Circles', 'Lift one leg and make circles with your foot, like you''re drawing a circle with your toes in the air. 10 times each foot in each direction.', 'warmup', 'isolation', 'legs'),
  ('Marching in Place', 'Step in place, lifting your knees high, like you''re marching in a parade. 30 seconds.', 'warmup', 'compound', 'legs'),
  ('Arms Behind Back Stretch', 'Clasp your hands behind your back and lift them up slightly, feeling a stretch in your shoulders. Hold 15 seconds.', 'warmup', 'isolation', 'shoulders'),
  ('Seated Toe Touch', 'Sit on the floor with straight legs and lean forward, trying to reach your toes. Hold 20 seconds.', 'warmup', 'compound', 'legs'),
  ('Shake Out Arms and Legs', 'Relax and shake your arms and legs, like you''re shaking water off them. 15 seconds.', 'warmup', 'compound', 'full_body'),

-- Part 2: Twists, Yoga & Wrists (21-40)
  ('Wrist Circles', 'Extend your arms forward and make circular movements with your wrists, like you''re drawing circles in the air. 10 times each direction.', 'warmup', 'isolation', 'arms'),
  ('Wrist Flexion', 'Extend one arm forward palm down, gently pull your fingers down with the other hand, then up. 15 times.', 'warmup', 'isolation', 'arms'),
  ('Cat-Cow Pose', 'Get on hands and knees, arch your back up like an angry cat, then dip it down like a cow. 10 times.', 'warmup', 'compound', 'core'),
  ('Child''s Pose', 'Sit on your heels, lean forward and stretch your arms in front of you, forehead touching the floor. Hold 20 seconds.', 'warmup', 'compound', 'back'),
  ('Seated Twist', 'Sit with a straight back, turn your torso to the right, grab your right knee with your left hand, then switch sides. 15 seconds each side.', 'warmup', 'compound', 'core'),
  ('Lying Twist', 'Lie on your back, bend your knees and drop them to the right while spreading your arms to the sides, then switch sides. 20 seconds each side.', 'warmup', 'compound', 'core'),
  ('Downward Dog', 'Get on hands and knees, lift your hips up so your body forms a hill shape, heels reaching toward the floor. Hold 15 seconds.', 'warmup', 'compound', 'full_body'),
  ('Cobra Pose', 'Lie on your stomach, press your hands into the floor and lift your chest up, arching your back. Hold 15 seconds.', 'warmup', 'compound', 'back'),
  ('Mountain Pose', 'Stand straight with feet together, arms by your sides or overhead, reach up like a tall mountain. Hold 20 seconds.', 'warmup', 'compound', 'full_body'),
  ('Tree Pose', 'Stand on one leg, press the other foot against your inner thigh or calf, bring hands together in front of your chest. 15 seconds each leg.', 'warmup', 'compound', 'legs'),
  ('Single Leg Forward Bend', 'Sit with straight legs, bend one leg, lean toward the straight leg, trying to reach your toes. 15 seconds each leg.', 'warmup', 'compound', 'legs'),
  ('Standing Twist with Arms', 'Stand straight, bend your arms in front of your chest, turn your torso right and left, arms move with your body. 15 times each side.', 'warmup', 'compound', 'core'),
  ('Prayer Hands', 'Press your palms together in front of your chest, like you''re praying, and gently press palms against each other. Hold 15 seconds.', 'warmup', 'isolation', 'arms'),
  ('Interlaced Wrist Stretch', 'Clasp your hands together in front of you and turn palms away from you, straightening your arms forward. 10 times.', 'warmup', 'isolation', 'arms'),
  ('Warrior 1 Pose', 'Step one leg forward and bend it, keep the back leg straight, raise your arms up. 15 seconds each leg.', 'warmup', 'compound', 'legs'),
  ('Easy Side Plank', 'Lie on your side, lean on your elbow and lift your hips, keep your body straight like a board. 10 seconds each side.', 'warmup', 'compound', 'core'),
  ('Twist on Hands and Knees', 'Get on hands and knees, thread one arm under the other, turning your torso and lowering your shoulder to the floor. 10 times each side.', 'warmup', 'compound', 'core'),
  ('Butterfly Sitting', 'Sit with the soles of your feet together in front of you, knees spread to the sides, hold your feet with your hands. Hold 20 seconds.', 'warmup', 'compound', 'legs'),
  ('Shake Out Wrists', 'Raise your arms and quickly shake your wrists, like you''re shaking water drops off them. 15 seconds.', 'warmup', 'isolation', 'arms'),
  ('Happy Baby Pose', 'Lie on your back, pull your knees to your chest, grab your feet from the outside with your hands and gently rock. Hold 20 seconds.', 'warmup', 'compound', 'full_body'),

-- Part 3: More Movements (41-60)
  ('Arm Crossovers', 'Swing your arms across your chest, alternating which arm crosses on top, like you''re giving yourself a hug. 20 times.', 'warmup', 'compound', 'shoulders'),
  ('High Knees', 'Run in place while lifting your knees as high as you can toward your chest. 30 seconds.', 'warmup', 'compound', 'legs'),
  ('Butt Kicks', 'Run in place while kicking your heels up behind you, trying to touch your bottom. 30 seconds.', 'warmup', 'compound', 'legs'),
  ('Side Steps', 'Step sideways to the right for several steps, then step sideways back to the left. 10 times each direction.', 'warmup', 'compound', 'legs'),
  ('Arm Circles Forward', 'Extend your arms straight out to the sides and make big circles forward, like windmills. 15 times.', 'warmup', 'compound', 'shoulders'),
  ('Arm Circles Backward', 'Extend your arms straight out to the sides and make big circles backward. 15 times.', 'warmup', 'compound', 'shoulders'),
  ('Toe Touches Alternating', 'Stand with legs wide, bend down and touch your right hand to your left toe, then left hand to right toe. 20 times.', 'warmup', 'compound', 'full_body'),
  ('Wall Push-ups', 'Stand facing a wall, place your hands on it, lean in by bending your elbows, then push back. 10 times.', 'warmup', 'compound', 'chest'),
  ('Calf Stretches', 'Step one foot back, keep it straight with heel on the ground, bend the front knee and lean forward. 15 seconds each leg.', 'warmup', 'isolation', 'legs'),
  ('Quad Stretch', 'Stand on one leg, bend the other knee behind you, grab your ankle and gently pull toward your bottom. 15 seconds each leg.', 'warmup', 'isolation', 'legs'),
  ('Neck Side Stretch', 'Tilt your head toward one shoulder, gently press with your hand on the same side, then switch. 15 seconds each side.', 'warmup', 'isolation', 'full_body'),
  ('Finger Spreads', 'Spread all your fingers wide apart, then squeeze them into a fist, like you''re making stars and then balls. 10 times.', 'warmup', 'isolation', 'arms'),
  ('Elbow Circles', 'Put your hands on your shoulders and make circles with your elbows. 10 times each direction.', 'warmup', 'compound', 'shoulders'),
  ('Standing Side Leg Lifts', 'Stand straight and lift one leg out to the side, then lower it, then switch legs. 10 times each leg.', 'warmup', 'isolation', 'legs'),
  ('Chest Opener Stretch', 'Stand in a doorway, place your forearms on the doorframe and gently lean forward to stretch your chest. Hold 20 seconds.', 'warmup', 'compound', 'chest'),
  ('Figure 4 Hip Stretch', 'Sit in a chair, place one ankle on the opposite knee, gently press down on the raised knee. 15 seconds each side.', 'warmup', 'compound', 'legs'),
  ('Spinal Rolls', 'Stand with feet hip-width apart, slowly roll down one vertebra at a time toward the floor, then roll back up. 5 times.', 'warmup', 'compound', 'back'),
  ('Wrist Prayer Stretch', 'Press your palms together in front of your chest, then lower them toward your waist while keeping palms together. Hold 15 seconds.', 'warmup', 'isolation', 'arms'),
  ('Ankle Pumps', 'Sit or lie down, point your toes forward then flex them back toward you, like you''re pumping a pedal. 20 times.', 'warmup', 'isolation', 'legs'),
  ('Full Body Stretch', 'Stand or lie down, reach your arms overhead and point your toes, stretch your whole body like you''re waking up in the morning. Hold 20 seconds.', 'warmup', 'compound', 'full_body');

-- STEP 3: Verify the migration
SELECT 'Migration completed. New warm-up exercises count:' as info, COUNT(*) as count 
FROM exercises 
WHERE exercise_type = 'warmup';

-- Show all new warm-up exercises
SELECT name, muscle_group, movement_pattern 
FROM exercises 
WHERE exercise_type = 'warmup'
ORDER BY name;

