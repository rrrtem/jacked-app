-- Исправление категорий упражнений
-- Дата: 2025-11-10

-- 1. Barbell Curl - изолированное на бицепс
UPDATE exercises SET 
  exercise_type = 'weight',
  movement_pattern = 'iso',
  muscle_group = 'arms'
WHERE id = 'f9cb731e-a689-452f-bc8a-8ee59cfa4d7c';

-- 2. Barbell Overhead Squat - комплексное, ноги (не core)
UPDATE exercises SET 
  exercise_type = 'weight',
  movement_pattern = 'complex',
  muscle_group = 'legs'
WHERE id = 'ff51f8b3-5801-4996-a307-97ef9da22e1d';

-- 3. Overhead Press - комплексное, плечи (не arms)
UPDATE exercises SET 
  exercise_type = 'weight',
  movement_pattern = 'complex',
  muscle_group = 'shoulders'
WHERE id = 'e50525e4-373b-48c3-be3f-940da9d301e7';

-- 4. Push Press - OK, но движение комплекс
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = 'a8c2894e-ef43-48e7-b6e6-0f7d1a40bce9';

-- 5. Front Squat - ноги (не core)
UPDATE exercises SET 
  exercise_type = 'weight',
  movement_pattern = 'complex',
  muscle_group = 'legs'
WHERE id = '18d419f9-9e37-46ca-b232-46031ffa1d45';

-- 6. Back Squat - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = '6f9c6f0d-f2e5-4196-998e-36249f7081a8';

-- 7. Barbell Lunge - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = '8a3a0633-964f-4012-a9a3-0716db6b0eab';

-- 8. Barbell Split Squat - ноги (не core)
UPDATE exercises SET 
  exercise_type = 'weight',
  movement_pattern = 'complex',
  muscle_group = 'legs'
WHERE id = '9548afc6-dc49-48a1-89a7-d1b552499343';

-- 9. Barbell Row - спина (не arms)
UPDATE exercises SET 
  exercise_type = 'weight',
  movement_pattern = 'complex',
  muscle_group = 'back'
WHERE id = 'a2b18789-bdb4-4ff0-9adb-30f5dae48a9d';

-- 10. Barbell Pendlay Row - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = '37c390d2-b1e1-4493-80a3-676a8c1d1a3c';

-- 11. Barbell Hip Thrust - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = '58895311-75c4-4169-8861-07682aa324ca';

-- 12. Barbell Good Morning - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = 'c6b66445-c4e3-47b2-ac24-77de6850aebb';

-- 13. Barbell Clean - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = 'e7690673-9361-4671-bd34-da1f95bec780';

-- 14. Barbell Thruster - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = 'f4534674-4b13-4089-9206-8cd513229b66';

-- 15. Dips - свой вес, грудь/трицепс
UPDATE exercises SET 
  movement_pattern = 'complex',
  muscle_group = 'chest'
WHERE id = 'b3a6dd77-22d5-4a29-b443-e9c6c48c926a';

-- 16. Wall Walk - свой вес, плечи
UPDATE exercises SET 
  movement_pattern = 'complex',
  muscle_group = 'shoulders'
WHERE id = '29a8d2ea-e79b-4d84-86c2-799d8f4fa576';

-- 17. Barbell Shrug - изолированное, спина/трапеции
UPDATE exercises SET 
  exercise_type = 'weight',
  movement_pattern = 'iso',
  muscle_group = 'back'
WHERE id = 'd13bf925-69fd-4a73-bf55-c16366160778';

-- 18. Jumping Jacks - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = 'b5a889d7-fb27-40e9-b9b8-06bbfdc7e77e';

-- 19. Inchworm Walkouts - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = '63d6ea5e-9800-40ef-9abe-cb9840a81ad4';

-- 20. World's Greatest Stretch - растяжка
UPDATE exercises SET 
  exercise_type = 'stretching',
  movement_pattern = 'complex'
WHERE id = '5f5bdb1d-a57c-4793-987d-1e3c7c6d7e08';

-- 21. High Knees - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = '2498e5af-92f6-43ee-b623-e062146b0fed';

-- 22. Butt Kicks - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = '4a06947a-5e8a-4968-8ee2-521d8771f6a7';

-- 23. Arm Circles - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = '76e9c6b7-b05e-425a-a183-5cbb8bdda1c4';

-- 24. Leg Swings - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = '22cfc589-3473-4b67-bcd8-22fad38b3e03';

-- 25. Regular Push-Ups - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = '7e2f6df3-bdfd-4831-addd-dcafcbb9a4e7';

-- 26. Glute Bridge March - ноги/ягодицы
UPDATE exercises SET 
  movement_pattern = 'complex',
  muscle_group = 'legs'
WHERE id = 'c198aa83-8f51-4e5c-aec8-470f7db78f28';

-- 27. Monster Walks - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = '7705611a-85e6-487f-ab8e-0c5b6355cbeb';

-- 28. PVC Pass-Throughs - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = 'e71c2434-ce08-4d26-89a4-ce8a62bdf9a9';

-- 29. Hip Circles - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = 'c8f4ec8e-88f4-4d61-b5c9-01b66ed01593';

-- 30. Cat-Cow Stretch - растяжка, кор
UPDATE exercises SET 
  exercise_type = 'stretching',
  movement_pattern = 'complex',
  muscle_group = 'core'
WHERE id = 'abc024cb-aaa8-4808-a6d3-6ca2002a02d7';

-- 31. Ankle Bounces - mobility, ноги
UPDATE exercises SET 
  movement_pattern = 'complex',
  muscle_group = 'legs'
WHERE id = '18e96dd3-7a79-47d4-9d23-1166ba2fc6d7';

-- 32. Bench Press - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = '821f9f62-f622-4565-87ee-d9a999e0204f';

-- 33. Incline Bench Press - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = 'e15fbb89-4a41-4fde-a5b9-92766aade032';

-- 34. Deadlift - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = '60a423bb-3499-4205-96a4-38e76f8a2ff1';

-- 35. Romanian Deadlift - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = '424cdc4e-8e9f-477f-a4f5-578ea07cde65';

-- 36. Sumo Deadlift - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = '3ca9c290-0fcc-4bb0-ab34-d9ae5eb928e9';

-- 37. Handstand Hold - плечи
UPDATE exercises SET 
  movement_pattern = 'complex',
  muscle_group = 'shoulders'
WHERE id = '5ac33af5-a588-4071-b4e7-64eac17b256b';

-- 38. Narrow Push-Ups - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = 'd6d20ff7-1e38-4375-a44a-4d288d621990';

-- 39. Wide Push-Ups - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = '406b0553-b6f1-41f1-b2dd-41fe11e4d137';

-- 40. Scapular Push-Ups - изолированное на лопатки/спину
UPDATE exercises SET 
  movement_pattern = 'iso',
  muscle_group = 'back'
WHERE id = '43e55da3-b922-41ac-89a1-20284aa5c383';

-- 41. Assisted Pull-Ups - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = '08f36d9e-82d4-47c5-bab4-074bef13adaf';

-- 42. Pull-Ups - OK
UPDATE exercises SET 
  movement_pattern = 'complex'
WHERE id = 'c487a313-17ce-4e37-bd4f-23452232f6d0';

-- Готово! Все упражнения обновлены.

