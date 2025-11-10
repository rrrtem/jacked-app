# AI Suggested Workout Generator

Система генерации тренировок на основе правил и истории пользователя.

## 📁 Структура

```
lib/ai-suggest/
├── types.ts              # TypeScript типы
├── exercise-database.ts  # База упражнений
├── generator.ts          # Логика генерации
├── cache.ts             # Кеширование
├── index.ts             # Главный экспорт
└── README.md            # Документация
```

## 🚀 Как использовать

### 1. Импорт

```typescript
import { getAISuggestedWorkout } from '@/lib/ai-suggest'
import type { WorkoutHistoryEntry, SuggestedWorkout } from '@/lib/ai-suggest'
```

### 2. Подготовка истории тренировок

```typescript
// Получаем последние 14 дней тренировок из БД
const workoutHistory: WorkoutHistoryEntry[] = await getWorkoutHistory(userId, 14)

// Преобразуем в нужный формат
const history: WorkoutHistoryEntry[] = workoutHistory.map(w => ({
  id: w.id,
  date: new Date(w.started_at),
  exercises: w.exercises.map(ex => ({
    exerciseId: ex.exercise.id,
    name: ex.exercise.name,
    primaryMuscles: getMuscleGroupsFromExercise(ex.exercise)
  }))
}))
```

### 3. Генерация тренировки

```typescript
// Функция автоматически проверит кеш
// Если была новая тренировка - сгенерирует заново
// Если нет - вернет из кеша
const suggested = getAISuggestedWorkout(history)

console.log(suggested.exercises)      // 3 упражнения
console.log(suggested.explanation)    // Объяснение
```

### 4. Результат

```typescript
{
  exercises: [
    {
      exerciseId: 'bench_press',
      name: 'Bench Press',
      type: 'compound_barbell',
      suggestedSets: 4,
      suggestedReps: '5',
      suggestedRest: 180
    },
    {
      exerciseId: 'barbell_row',
      name: 'Barbell Row',
      type: 'compound_barbell',
      suggestedSets: 3,
      suggestedReps: '8',
      suggestedRest: 120
    },
    {
      exerciseId: 'pull_ups',
      name: 'Pull-ups',
      type: 'compound_other',
      suggestedSets: 3,
      suggestedReps: '10-12',
      suggestedRest: 90
    }
  ],
  explanation: 'focusing on push movements to balance with recent pull work',
  generatedAt: Date,
  basedOnWorkoutCount: 5
}
```

## 🎯 Логика работы

### Алгоритм

1. **Анализ восстановления**
   - Определяем, какие группы мышц восстановились
   - Грудь/Спина: 48 часов
   - Ноги: 72 часа
   - Руки/Плечи: 48 часов

2. **Определение типа тренировки**
   - Если ноги давно не тренировали (>4 дней) → Legs
   - Если последняя была Push → Pull
   - Если последняя была Pull → Push или Legs
   - Если последняя была Legs → Push

3. **Выбор упражнений (2 + 1)**
   - **Первое:** Главное compound со штангой (Big 5 приоритет)
   - **Второе:** Вспомогательное compound со штангой
   - **Третье:** Дополнительное (подтягивания, отжимания на брусьях, изоляция)

4. **Исключение повторов**
   - Не повторяем упражнения из последних 2 тренировок

### Параметры упражнений

| Роль | Подходы | Повторы | Отдых |
|------|---------|---------|-------|
| Главное | 4 | 5 | 3 мин |
| Вспомогательное | 3 | 8 | 2 мин |
| Дополнительное | 3 | 10-12 | 1.5 мин |

### Кеширование

- Генерация происходит только при изменении `workoutHistory.length`
- Кеш хранится в localStorage
- Автоматически инвалидируется через 7 дней

## 📊 База упражнений

### Compound Barbell (Big 5)
1. **Squat** - Ноги, Кор, Спина
2. **Deadlift** - Спина, Ноги, Хват
3. **Bench Press** - Грудь, Плечи, Руки
4. **Overhead Press** - Плечи, Руки, Кор
5. **Barbell Row** - Спина, Руки, Кор

### Дополнительные Compound
- Front Squat
- Romanian Deadlift
- Incline Bench Press

### Accessory
- Pull-ups (приоритет!)
- Dips (приоритет!)
- Bicep Curl
- Lateral Raise
- Leg Curl/Extension
- Face Pull

## 🔧 Debugging

```typescript
import { clearAISuggestedCache } from '@/lib/ai-suggest'

// Очистить кеш
clearAISuggestedCache()
```

## 🎨 Пример интеграции в UI

```typescript
// В компоненте start/page.tsx

const [aiSuggestedExercises, setAiSuggestedExercises] = useState<Exercise[]>([])
const [aiExplanation, setAiExplanation] = useState<string>('')

useEffect(() => {
  if (activePreset === 'ai-suggested') {
    loadAISuggested()
  }
}, [activePreset])

async function loadAISuggested() {
  try {
    // 1. Получаем историю из БД
    const history = await fetchWorkoutHistory(userId, 14)
    
    // 2. Генерируем рекомендации
    const suggested = getAISuggestedWorkout(history)
    
    // 3. Преобразуем в формат Exercise для UI
    const exercises = suggested.exercises.map(ex => ({
      id: `ai-${ex.exerciseId}`,
      exerciseId: ex.exerciseId,
      name: ex.name,
      sets: ex.suggestedSets,
      // ... другие поля
    }))
    
    setAiSuggestedExercises(exercises)
    setAiExplanation(suggested.explanation)
  } catch (error) {
    console.error('Error loading AI suggested:', error)
  }
}
```

## ⚡ Производительность

- ✅ Генерация ~5-10ms
- ✅ Кеш в localStorage
- ✅ Нет сетевых запросов для генерации
- ✅ Работает офлайн

## 🚀 Будущие улучшения

1. **Машинное обучение**
   - Учитывать, какие упражнения пользователь пропускает
   - Адаптировать сложность под прогресс

2. **Персонализация**
   - Учет доступного оборудования
   - Учет травм/ограничений
   - Учет целей (сила/масса/выносливость)

3. **Умная прогрессия**
   - Подсказки по увеличению весов
   - Автоматический расчет рабочих весов

4. **Вариативность**
   - Опция "сгенерировать другую тренировку"
   - Разные стили (volume/intensity/mixed)

## 📝 Changelog

**v1.0.0** - Первая версия
- Алгоритм на правилах
- 2 compound + 1 accessory
- Кеширование с проверкой изменений
- Объяснение рекомендаций

