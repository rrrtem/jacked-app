# API Reference - Работа с базой данных

Краткая справка по функциям для работы с Supabase из `lib/supabase/queries.ts`

## 🏋️ Упражнения (Exercises)

### Получить все упражнения

```typescript
import { getAllExercises } from '@/lib/supabase/queries'

const exercises = await getAllExercises()
// => Exercise[]
```

### Получить упражнение по ID

```typescript
import { getExerciseById } from '@/lib/supabase/queries'

const exercise = await getExerciseById('exercise-uuid')
// => Exercise | null
```

### Получить упражнения по тегам

```typescript
import { getExercisesByTags } from '@/lib/supabase/queries'

const exercises = await getExercisesByTags(['chest', 'push'])
// => Exercise[]
```

### Получить упражнения с личными рекордами

```typescript
import { getExercisesWithRecords } from '@/lib/supabase/queries'

const exercises = await getExercisesWithRecords(userId)
// => ExerciseWithRecords[]
```

## 🏆 Личные рекорды (Exercise Records)

### Получить рекорд по упражнению

```typescript
import { getExerciseRecord } from '@/lib/supabase/queries'

const record = await getExerciseRecord(userId, exerciseId)
// => ExerciseRecord | null
```

### Обновить рекорд

```typescript
import { updateExerciseRecord } from '@/lib/supabase/queries'

const record = await updateExerciseRecord(userId, exerciseId, {
  max_weight: 100,
  max_reps: 10,
  max_duration: 300
})
// => ExerciseRecord
```

### Получить все рекорды пользователя

```typescript
import { getAllUserRecords } from '@/lib/supabase/queries'

const records = await getAllUserRecords(userId)
// => Array<ExerciseRecord & { exercise: Exercise }>
```

## 📋 Шаблоны тренировок (Workout Sets)

### Получить все шаблоны пользователя

```typescript
import { getWorkoutSets } from '@/lib/supabase/queries'

const sets = await getWorkoutSets(userId)
// => WorkoutSet[]
```

### Получить шаблон с упражнениями

```typescript
import { getWorkoutSetWithExercises } from '@/lib/supabase/queries'

const set = await getWorkoutSetWithExercises(setId)
// => WorkoutSetWithExercises | null
// Включает массив exercises с деталями каждого упражнения
```

### Создать новый шаблон

```typescript
import { createWorkoutSet } from '@/lib/supabase/queries'

const set = await createWorkoutSet(
  userId,
  'Full Body Workout',
  'Базовая тренировка на всё тело'
)
// => WorkoutSet
```

### Добавить упражнение в шаблон

```typescript
import { addExerciseToWorkoutSet } from '@/lib/supabase/queries'

const workoutSetExercise = await addExerciseToWorkoutSet(
  workoutSetId,
  exerciseId,
  0, // order_index
  {
    target_sets: 3,
    target_reps: 10,
    target_weight: 50,
    rest_duration: 90
  }
)
// => WorkoutSetExercise
```

## 🎯 Тренировочные сессии (Workout Sessions)

### Создать новую сессию

```typescript
import { createWorkoutSession } from '@/lib/supabase/queries'

const session = await createWorkoutSession(userId, {
  workout_set_id: 'set-uuid', // опционально
  exercises: [
    { exercise_id: 'ex1-uuid', order_index: 0 },
    { exercise_id: 'ex2-uuid', order_index: 1 },
    { exercise_id: 'ex3-uuid', order_index: 2 }
  ]
})
// => WorkoutSession
```

### Получить активную сессию

```typescript
import { getActiveWorkoutSession } from '@/lib/supabase/queries'

const session = await getActiveWorkoutSession(userId)
// => WorkoutSessionWithDetails | null
// Включает упражнения и подходы
```

### Завершить тренировку

```typescript
import { completeWorkoutSession } from '@/lib/supabase/queries'

const session = await completeWorkoutSession(sessionId)
// => WorkoutSession
// Автоматически рассчитывает длительность
```

### Сохранить подход

```typescript
import { saveWorkoutSet } from '@/lib/supabase/queries'

const setData = await saveWorkoutSet({
  workout_session_exercise_id: 'wse-uuid',
  set_number: 1,
  weight: 50,
  reps: 10,
  completed: true
})
// => WorkoutSetData
```

### Отметить разминку завершенной

```typescript
import { markWarmupCompleted } from '@/lib/supabase/queries'

await markWarmupCompleted(workoutSessionExerciseId)
// => WorkoutSessionExercise
```

## 📅 История тренировок

### Получить историю с фильтрами

```typescript
import { getWorkoutHistory } from '@/lib/supabase/queries'

const sessions = await getWorkoutHistory({
  user_id: userId,
  date_from: '2025-01-01',
  date_to: '2025-12-31',
  limit: 10,
  offset: 0
})
// => WorkoutSession[]
```

### Получить детали тренировки

```typescript
import { getWorkoutSessionById } from '@/lib/supabase/queries'

const session = await getWorkoutSessionById(sessionId)
// => WorkoutSessionWithDetails | null
// Полная информация: упражнения, подходы, веса, повторы
```

### Получить тренировки за дату

```typescript
import { getWorkoutsByDate } from '@/lib/supabase/queries'

const sessions = await getWorkoutsByDate(userId, '2025-11-08')
// => WorkoutSession[]
```

### Получить календарь тренировок

```typescript
import { getWorkoutCalendar } from '@/lib/supabase/queries'

const calendar = await getWorkoutCalendar(userId, 2025, 11)
// => Map<string, WorkoutSession[]>
// Ключ - дата в формате YYYY-MM-DD
// Значение - массив тренировок за этот день
```

## 📊 Типы данных

### Exercise

```typescript
{
  id: string
  name: string
  instructions: string | null
  tags: string[] // ['chest', 'push', 'barbell']
  created_at: string
  updated_at: string
}
```

### ExerciseRecord

```typescript
{
  id: string
  user_id: string
  exercise_id: string
  max_weight: number | null
  max_reps: number | null
  max_duration: number | null
  last_updated: string
  created_at: string
}
```

### WorkoutSession

```typescript
{
  id: string
  user_id: string
  workout_set_id: string | null
  started_at: string
  completed_at: string | null
  duration: number | null // в секундах
  notes: string | null
  created_at: string
  updated_at: string
}
```

### WorkoutSetData

```typescript
{
  id: string
  workout_session_exercise_id: string
  set_number: number
  weight: number | null
  reps: number | null
  duration: number | null
  completed: boolean | null
  notes: string | null
  created_at: string
}
```

## 🔐 Безопасность

Все запросы автоматически защищены Row Level Security (RLS):

- ✅ Пользователь видит только свои данные
- ✅ Упражнения (`exercises`) доступны всем для чтения
- ✅ Нельзя получить чужие тренировки или рекорды
- ✅ Проверка `auth.uid()` встроена в политики БД

## 🎨 Примеры использования в компонентах

### Server Component

```typescript
// app/exercises/page.tsx
import { getAllExercises } from '@/lib/supabase/queries'

export default async function ExercisesPage() {
  const exercises = await getAllExercises()
  
  return (
    <div>
      {exercises.map(ex => (
        <div key={ex.id}>{ex.name}</div>
      ))}
    </div>
  )
}
```

### Client Component

```typescript
'use client'

import { useState, useEffect } from 'react'
import { getActiveWorkoutSession } from '@/lib/supabase/queries'

export default function ActiveWorkout({ userId }: { userId: string }) {
  const [session, setSession] = useState(null)
  
  useEffect(() => {
    getActiveWorkoutSession(userId).then(setSession)
  }, [userId])
  
  if (!session) return <div>Нет активной тренировки</div>
  
  return <div>Тренировка началась {session.started_at}</div>
}
```

### Server Action

```typescript
// server/actions/workout.ts
'use server'

import { createWorkoutSession } from '@/lib/supabase/queries'

export async function startWorkout(userId: string, exerciseIds: string[]) {
  const session = await createWorkoutSession(userId, {
    exercises: exerciseIds.map((id, idx) => ({
      exercise_id: id,
      order_index: idx
    }))
  })
  
  return session
}
```

## 🛠️ Обработка ошибок

Все функции могут выбросить ошибку. Рекомендуется использовать try-catch:

```typescript
try {
  const exercises = await getAllExercises()
  // ...
} catch (error) {
  console.error('Ошибка загрузки упражнений:', error)
  // Показать уведомление пользователю
}
```

## 📚 Дополнительные ресурсы

- Полная схема БД: `DATABASE_SCHEMA.md`
- Типы TypeScript: `lib/types/database.ts`
- Настройка Supabase: `SUPABASE_SETUP.md`
- SQL скрипт: `supabase_schema.sql`

