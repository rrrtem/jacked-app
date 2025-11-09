# Система логики прогрессии (Progression Logic System)

Система автоматического расчета рекомендаций для подходов в упражнениях на основе личных рекордов пользователя.

## Обзор

Система прогрессии автоматически подсказывает пользователю оптимальные значения веса, количества повторений или длительности для каждого подхода, основываясь на его личных рекордах и типе упражнения.

## Типы логик прогрессии

### 1. Linear Load Progression (Линейная прогрессия веса)

**Для упражнений с весом** (штанга, гантели)

Логика:
- **Подход 1**: Пустой гриф (20 кг) × 10 повторений (разминка)
- **Подход 2**: 40% от максимального веса × 10 повторений
- **Подход 3**: 60% от максимального веса × 10 повторений
- **Подход 4**: 80% от максимального веса × рекордное количество повторений
- **Подход 5+**: 100% от максимального веса × рекордное количество повторений

**Пример 1:**
Если у пользователя рекорд: 100 кг × 8 повторений

| Подход | Вес | Повторения | Заметка |
|--------|-----|------------|---------|
| 1 | 20 кг | 10 | Warm-up (empty bar) |
| 2 | 40 кг | 10 | Warm-up (40% of max) |
| 3 | 60 кг | 10 | Warm-up (60% of max) |
| 4 | 80 кг | 8 | Working set (80% of max) |
| 5 | 100 кг | 8 | Working set (100% of max) |

**Пример 2 (малый рекорд):**
Если у пользователя рекорд: 30 кг × 10 повторений

| Подход | Вес | Повторения | Заметка |
|--------|-----|------------|---------|
| 1 | 20 кг | 10 | Warm-up (empty bar) |
| 2 | 20 кг | 10 | Warm-up (40% = 12 кг → 20 кг минимум) |
| 3 | 20 кг | 10 | Warm-up (60% = 18 кг → 20 кг минимум) |
| 4 | 24 кг | 10 | Working set (80% of max) |
| 5 | 30 кг | 10 | Working set (100% of max) |

> **Важно:** Вес не может быть меньше веса пустого грифа (по умолчанию 20 кг). Если расчетный процент дает значение меньше 20 кг, система автоматически устанавливает минимум 20 кг.

### 2. Percentage-Based Progression (Процентная прогрессия)

**Для упражнений без веса** (подтягивания, отжимания, приседания с собственным весом)

Логика:
- **Подход 1**: 30% от максимального количества повторений
- **Подход 2**: 60% от максимального количества повторений
- **Подход 3+**: 100% от максимального количества повторений (максимальное усилие)

**Пример:**
Если у пользователя рекорд: 20 повторений

| Подход | Повторения | Заметка |
|--------|------------|---------|
| 1 | 6 | Warm-up (30% of max reps) |
| 2 | 12 | Working set (60% of max reps) |
| 3 | 20 | Max effort (100% of max reps) |

### 3. Duration-Based Progression (Прогрессия по длительности)

**Для упражнений на время** (планки, удержания)

Логика:
- **Подход 1**: 50% от максимального времени
- **Подход 2**: 75% от максимального времени
- **Подход 3+**: 100% от максимального времени

**Пример:**
Если у пользователя рекорд: 60 секунд

| Подход | Длительность | Заметка |
|--------|--------------|---------|
| 1 | 30 сек | Warm-up (50% of max duration) |
| 2 | 45 сек | Working set (75% of max duration) |
| 3 | 60 сек | Max effort (100% of max duration) |

## Использование

### В компонентах React

```typescript
import { calculateSetSuggestion } from '@/lib/progression'
import { getExerciseRecord } from '@/lib/supabase/queries'

// Получить рекомендацию для текущего подхода
const exercise = { id: 'exercise-id', tags: ['weight', 'push'] }
const setNumber = 3
const userId = 'user-id'

// Загрузить рекорд пользователя
const record = await getExerciseRecord(userId, exercise.id)

// Рассчитать рекомендацию
const suggestion = calculateSetSuggestion({
  exerciseId: exercise.id,
  exerciseTags: exercise.tags,
  setNumber,
  record,
})

console.log(suggestion)
// { weight: 60, reps: 10, note: "Warm-up (60% of max)" }
```

### Прямое использование отдельных логик

```typescript
import { 
  calculateLinearLoadSuggestion,
  calculatePercentageBasedSuggestion,
  calculateDurationBasedSuggestion,
} from '@/lib/progression'

// Linear Load для упражнения с весом
const weightSuggestion = calculateLinearLoadSuggestion(
  3, // setNumber
  record, // ExerciseRecord
  {
    type: 'linear-load',
    emptyBarWeight: 20,
    warmupReps: 10,
    percentages: [40, 60, 80, 100],
  }
)

// Percentage-Based для упражнения без веса
const repsSuggestion = calculatePercentageBasedSuggestion(
  2, // setNumber
  record,
  {
    type: 'percentage-based',
    percentages: [30, 60, 100],
  }
)

// Duration-Based для упражнения на время
const durationSuggestion = calculateDurationBasedSuggestion(
  1, // setNumber
  record
)
```

## Определение типа упражнения

Система автоматически определяет, какую логику прогрессии использовать, на основе тегов упражнения:

| Теги | Логика прогрессии |
|------|-------------------|
| `duration` | Duration-Based Progression |
| `weight` | Linear Load Progression |
| Без специальных тегов | Percentage-Based Progression |

**Примеры:**
- `['weight', 'push', 'chest']` → Linear Load
- `['pull', 'back']` → Percentage-Based
- `['duration', 'core']` → Duration-Based

## Обработка отсутствующих рекордов

Если у пользователя нет рекорда по упражнению, система использует консервативные значения:

- **Linear Load**: 20, 30, 40, 50, 60 кг
- **Percentage-Based**: 5, 10, 15 повторений
- **Duration-Based**: 15, 30, 45 секунд

## Настройка

Вы можете изменить конфигурацию по умолчанию:

```typescript
import { DEFAULT_LINEAR_LOAD_CONFIG } from '@/lib/progression/linear-load'

// Изменить вес пустого грифа
DEFAULT_LINEAR_LOAD_CONFIG.emptyBarWeight = 15

// Изменить проценты для разминки
DEFAULT_LINEAR_LOAD_CONFIG.percentages = [30, 50, 70, 90, 100]
```

## Расширение системы

Чтобы добавить новую логику прогрессии:

1. Создайте файл в `lib/progression/`
2. Реализуйте функцию расчета suggestion
3. Добавьте новый тип в `lib/types/progression.ts`
4. Обновите функцию `calculateSetSuggestion` в `lib/progression/index.ts`

Пример:

```typescript
// lib/progression/pyramid.ts
export function calculatePyramidSuggestion(
  setNumber: number,
  record: ExerciseRecord | null
): SetSuggestion {
  // Ваша логика
  return { weight: 50, reps: 10 }
}
```

## Интеграция с воркаутом

Система автоматически интегрирована в компонент воркаута (`app/workout/[id]/page.tsx`):

- Suggestions загружаются при переходе к новому упражнению
- Suggestions обновляются при переходе к новому подходу
- Значения автоматически подставляются в инпуты веса/повторений/длительности
- Пользователь всегда может вручную изменить значения

## Будущие улучшения

- [ ] Добавить логику Reverse Pyramid (от тяжелого к легкому)
- [ ] Добавить логику Wave Loading (волнообразная нагрузка)
- [ ] Добавить логику Cluster Sets (кластерные подходы)
- [ ] Персонализация процентов на основе истории тренировок
- [ ] Учет усталости (снижение весов в конце тренировки)
- [ ] A/B тестирование разных логик прогрессии

