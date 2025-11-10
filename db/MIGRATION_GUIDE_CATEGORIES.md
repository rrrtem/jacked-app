# Миграция системы тегов на структурированные категории

## Обзор изменений

Переход от одного поля `tags` (массив строк) к четырем отдельным полям с категориями упражнений.

### Было (старая схема)
```sql
exercises {
  id: UUID
  name: TEXT
  instructions: TEXT
  tags: TEXT[]  -- ["chest", "push", "barbell", "compound"]
}
```

### Стало (новая схема)
```sql
exercises {
  id: UUID
  name: TEXT
  instructions: TEXT
  exercise_type: TEXT      -- "weight", "duration", "warmup", "mobility", "stretching"
  movement_pattern: TEXT   -- "compound", "isolation"
  muscle_group: TEXT       -- "chest", "back", "legs", "shoulders", "arms", "core", "full_body"
  equipment: TEXT          -- "bodyweight", "barbell", "dumbbell", "machine", "cable", "kettlebell", "bands"
}
```

## Причины изменения

1. **Структурированность**: Каждая категория имеет четкое назначение
2. **Валидация**: Легче контролировать допустимые значения
3. **Фильтрация**: Удобнее строить многоуровневые фильтры
4. **Производительность**: Индексы на отдельные колонки работают быстрее
5. **UX**: Пользователь может фильтровать по нескольким измерениям одновременно

## Категории и значения

### 1. exercise_type (Тип упражнения)
Определяет характер измерения прогресса в упражнении:
- `weight` - упражнения с весом и повторениями (приседания, жим, подтягивания)
- `duration` - упражнения на время (планка, статические удержания)
- `warmup` - разминка
- `mobility` - мобильность/гибкость
- `stretching` - растяжка

### 2. movement_pattern (Паттерн движения)
Определяет сложность движения:
- `compound` - комплексное/многосуставное (приседания, становая)
- `isolation` - изолированное (сгибание на бицепс, разгибание на трицепс)

### 3. muscle_group (Группа мышц)
Основная целевая мышечная группа:
- `chest` - грудь
- `back` - спина
- `legs` - ноги
- `shoulders` - плечи
- `arms` - руки (бицепс/трицепс)
- `core` - пресс/кор
- `full_body` - все тело

### 4. equipment (Оборудование)
Необходимое оборудование:
- `bodyweight` - собственный вес
- `barbell` - штанга
- `dumbbell` - гантели
- `machine` - тренажер
- `cable` - кроссовер/блоки
- `kettlebell` - гиря
- `bands` - резинки/эспандеры

## Как применить миграцию

### Шаг 1: Резервная копия
```bash
# Создайте backup БД перед миграцией
pg_dump your_database > backup_before_migration.sql
```

### Шаг 2: Применение SQL миграции
```bash
# В Supabase Dashboard -> SQL Editor
# Выполните скрипт: db/migration_exercise_categories.sql
```

### Шаг 3: Проверка данных
```sql
-- Проверьте, что все упражнения получили новые значения
SELECT 
  id, 
  name,
  exercise_type,
  movement_pattern,
  muscle_group,
  equipment
FROM exercises
LIMIT 10;

-- Убедитесь, что нет NULL значений
SELECT COUNT(*) FROM exercises 
WHERE exercise_type IS NULL 
   OR movement_pattern IS NULL 
   OR muscle_group IS NULL 
   OR equipment IS NULL;
-- Должно вернуть 0
```

### Шаг 4: Обновление существующих упражнений
Если у вас есть специфические упражнения, обновите их вручную:

```sql
-- Пример: жим лежа
UPDATE exercises 
SET 
  exercise_type = 'weight',
  movement_pattern = 'compound',
  muscle_group = 'chest',
  equipment = 'barbell'
WHERE name ILIKE '%bench%press%';

-- Пример: сгибание на бицепс
UPDATE exercises 
SET 
  exercise_type = 'weight',
  movement_pattern = 'isolation',
  muscle_group = 'arms',
  equipment = 'dumbbell'
WHERE name ILIKE '%bicep%curl%';

-- Пример: планка (упражнение на время)
UPDATE exercises 
SET 
  exercise_type = 'duration',
  movement_pattern = 'compound',
  muscle_group = 'core',
  equipment = 'bodyweight'
WHERE name ILIKE '%plank%';
```

## Обновленные компоненты

### 1. TypeScript типы (`lib/types/database.ts`)
- Обновлен тип `Exercise` с новыми полями
- Удалено поле `tags`

### 2. ExerciseSelector (`components/ExerciseSelector.tsx`)
**Новые возможности:**
- Четыре категории фильтров вместо одного списка тегов
- Переключение между категориями (тип, мышцы, оборудование, паттерн)
- Множественная фильтрация (можно комбинировать фильтры)
- Кнопка "Сбросить все" с счетчиком активных фильтров
- Локализация на русский язык

**UI/UX улучшения:**
- Двухуровневая фильтрация (выбор категории → выбор значения)
- Отображение выбранных фильтров
- Показ категорий упражнения в карточке (мышцы, оборудование, паттерн)

### 3. Start Page (`app/start/page.tsx`)
- Обновлены типы `Exercise` и `DbExercise`
- Изменен SELECT запрос для загрузки упражнений
- Обновлена логика маппинга данных из БД
- Обновлен код сохранения в localStorage

## Примеры использования в коде

### Загрузка упражнений
```typescript
const { data, error } = await supabase
  .from("exercises")
  .select("id, name, instructions, exercise_type, movement_pattern, muscle_group, equipment")
  .order("name")
```

### Фильтрация по категории
```typescript
// Все упражнения на грудь
const chestExercises = exercises.filter(ex => ex.muscle_group === 'chest')

// Все базовые упражнения
const compoundExercises = exercises.filter(ex => ex.movement_pattern === 'compound')

// Комбинированная фильтрация: упражнения с весом на грудь со штангой
const benchPresses = exercises.filter(ex => 
  ex.exercise_type === 'weight' &&
  ex.muscle_group === 'chest' &&
  ex.equipment === 'barbell'
)

// Упражнения на время для кора
const coreDuration = exercises.filter(ex =>
  ex.exercise_type === 'duration' &&
  ex.muscle_group === 'core'
)
```

### Создание нового упражнения
```typescript
const newExercise = {
  name: 'Bench Press',
  instructions: 'Lie on bench...',
  exercise_type: 'weight',
  movement_pattern: 'compound',
  muscle_group: 'chest',
  equipment: 'barbell'
}

const { data, error } = await supabase
  .from('exercises')
  .insert(newExercise)
```

## Откат миграции (если нужно)

Если нужно вернуться к старой схеме:

```sql
-- 1. Добавляем обратно поле tags
ALTER TABLE exercises ADD COLUMN tags TEXT[];

-- 2. Конвертируем категории обратно в теги
UPDATE exercises 
SET tags = ARRAY[exercise_type, movement_pattern, muscle_group, equipment];

-- 3. Удаляем новые колонки
ALTER TABLE exercises 
DROP COLUMN exercise_type,
DROP COLUMN movement_pattern,
DROP COLUMN muscle_group,
DROP COLUMN equipment;
```

## Проверка работоспособности

После миграции проверьте:

1. ✅ Загрузка страницы `/start` без ошибок
2. ✅ Открытие модального окна выбора упражнений
3. ✅ Переключение между категориями фильтров
4. ✅ Применение фильтров и отображение результатов
5. ✅ Добавление упражнения в preset
6. ✅ Запуск тренировки с новыми упражнениями
7. ✅ Отсутствие TypeScript ошибок при сборке (`pnpm build`)

## Troubleshooting

### Проблема: TypeScript ошибки про отсутствующее поле `tags`
**Решение**: Убедитесь, что обновили все файлы:
- `lib/types/database.ts`
- `components/ExerciseSelector.tsx`
- `app/start/page.tsx`

### Проблема: Упражнения не загружаются
**Решение**: Проверьте SELECT запрос - должны быть новые поля вместо `tags`:
```typescript
.select("id, name, instructions, exercise_type, movement_pattern, muscle_group, equipment")
```

### Проблема: NULL значения в новых полях
**Решение**: Выполните UPDATE для установки значений по умолчанию:
```sql
UPDATE exercises 
SET 
  exercise_type = COALESCE(exercise_type, 'strength'),
  movement_pattern = COALESCE(movement_pattern, 'compound'),
  muscle_group = COALESCE(muscle_group, 'full_body'),
  equipment = COALESCE(equipment, 'bodyweight');
```

## Следующие шаги

После успешной миграции можно:

1. Добавить валидацию на уровне БД через CHECK constraints
2. Создать справочные таблицы для категорий
3. Добавить поддержку нескольких мышечных групп (например, жим лежа = грудь + плечи + трицепс)
4. Реализовать умные рекомендации упражнений на основе категорий
5. Добавить аналитику по типам тренировок

## Вопросы?

Если возникли проблемы при миграции, проверьте логи:
- Supabase Dashboard -> Logs
- Browser Console (F12)
- Terminal с `pnpm dev`

