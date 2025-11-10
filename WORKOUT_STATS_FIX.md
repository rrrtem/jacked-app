# Исправление статистики тренировок

## Проблема

После завершения тренировки на экране `finished` отображалась неактуальная статистика:
- `total_workouts` показывал на 1 меньше (в БД было 3, в UI показывалось 2)
- `total_weight_lifted` также не обновлялся в UI

При этом в базе данных значения сохранялись корректно.

## Причина

**Проблема 1:** Отсутствовало обновление статистики пользователя в таблице `users` после сохранения тренировки.

**Проблема 2:** Статистика загружалась на экран `finished` до того, как она обновлялась в базе данных.

### Последовательность событий (до исправления):
1. Пользователь завершает тренировку → переход на `stage = "finished"`
2. `useEffect` загружает статистику из БД (старые значения)
3. Отображается экран с устаревшей статистикой
4. `saveWorkoutToDatabase()` сохраняет тренировку
5. Статистика обновляется в БД, но UI уже отрисован со старыми данными

## Решение

### 1. Добавлена функция обновления статистики (`lib/supabase/queries.ts`)

```typescript
export async function updateUserStatsAfterWorkout(
  userId: string,
  totalVolume: number
)
```

Эта функция:
- Получает текущую статистику пользователя
- Увеличивает `total_workouts` на 1
- Добавляет объем тренировки к `total_weight_lifted`
- Возвращает обновлённые значения

### 2. Добавлена функция перезагрузки статистики в UI (`app/workout/[id]/page.tsx`)

```typescript
const reloadUserStats = async () => {
  // Загружает актуальную статистику из БД
  // Обновляет state компонента
}
```

### 3. Обновлен процесс сохранения тренировки

```typescript
const saveWorkoutToDatabase = async () => {
  // ... сохранение тренировки ...
  
  // Обновляем статистику в БД
  await updateUserStatsAfterWorkout(userId, totalVolume)
  
  // Сразу перезагружаем статистику на UI
  await reloadUserStats()
}
```

### Последовательность событий (после исправления):
1. Пользователь завершает тренировку → переход на `stage = "finished"`
2. `useEffect` загружает статистику из БД (старые значения, но быстро)
3. Отображается экран с временной статистикой
4. `saveWorkoutToDatabase()` сохраняет тренировку
5. `updateUserStatsAfterWorkout()` обновляет статистику в БД
6. `reloadUserStats()` перезагружает актуальную статистику
7. UI обновляется с правильными значениями

## Результат

Теперь статистика на экране `finished`:
- ✅ Быстро показывает временные значения (старые)
- ✅ Автоматически обновляется после сохранения в БД
- ✅ Отображает актуальные значения с учетом только что завершенной тренировки

## Отладка

Если проблема сохраняется, проверьте консоль браузера:

```javascript
// После завершения тренировки должны появиться логи:
"User stats updated: { total_workouts: X, total_weight_lifted: Y, volume_added: Z }"
"Stats reloaded: { total_workouts: X, total_weight_lifted: Y }"
"Workout saved successfully! Total volume: Z kg"
```

## Проверка в БД

Запрос для проверки статистики пользователя:

```sql
SELECT 
  id,
  email,
  total_workouts,
  total_weight_lifted,
  created_at,
  updated_at
FROM users
WHERE id = 'your-user-id';
```

Запрос для проверки всех тренировок:

```sql
SELECT 
  id,
  started_at,
  completed_at,
  duration,
  total_volume,
  notes
FROM workout_sessions
WHERE user_id = 'your-user-id'
ORDER BY started_at DESC;
```

## Связанные файлы

- `app/workout/[id]/page.tsx` - компонент воркаута
- `lib/supabase/queries.ts` - функции работы с БД
- `db/DATABASE_SCHEMA.md` - схема базы данных


