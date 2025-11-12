/**
 * AI Suggested Workout Generator
 * Генерирует тренировки на основе правил, истории пользователя и упражнений из БД
 */

import type {
  LegacyWorkoutHistoryEntry,
  SuggestedWorkout,
  SuggestedExercise,
  MuscleGroup,
  WorkoutType,
  RecoveryStatus,
} from './types'
import type { DbExercise } from './prompt-builder'

// Время восстановления для каждой группы мышц (в днях)
const RECOVERY_TIMES: Record<MuscleGroup, number> = {
  chest: 2,      // 48 часов
  back: 2,       // 48 часов
  legs: 3,       // 72 часа
  shoulders: 2,  // 48 часов
  arms: 2,       // 48 часов
  core: 1,       // 24 часа
  full_body: 2,
}

// Big 5 - приоритетные упражнения по именам
const BIG_FIVE_NAMES = [
  'Back Squat',
  'Deadlift',
  'Bench Press',
  'Overhead Press',
  'Barbell Row'
]

/**
 * Главная функция генерации тренировки
 */
export function generateAISuggestedWorkout(
  workoutHistory: LegacyWorkoutHistoryEntry[],
  exercisesFromDB: DbExercise[]
): SuggestedWorkout {
  // 1. Анализируем историю
  const recoveryStatus = analyzeRecovery(workoutHistory)
  const recentExerciseIds = getRecentExerciseIds(workoutHistory, 2) // последние 2 тренировки
  
  // 2. Определяем тип тренировки
  const workoutType = determineWorkoutType(workoutHistory, recoveryStatus, exercisesFromDB)
  
  // 3. Подбираем упражнения (2 compound + 1 accessory)
  const exercises = selectExercises(
    workoutType,
    recentExerciseIds,
    recoveryStatus,
    exercisesFromDB
  )
  
  return {
    exercises,
    generatedAt: new Date(),
    basedOnWorkoutCount: workoutHistory.length,
  }
}

/**
 * Анализ восстановления мышечных групп
 */
function analyzeRecovery(history: LegacyWorkoutHistoryEntry[]): RecoveryStatus[] {
  const today = new Date()
  const statuses: RecoveryStatus[] = []
  
  const muscleGroups: MuscleGroup[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body']
  
  for (const muscle of muscleGroups) {
    const lastWorkout = findLastWorkoutForMuscle(muscle, history)
    
    if (!lastWorkout) {
      // Никогда не тренировали эту группу
      statuses.push({
        muscleGroup: muscle,
        daysSinceLastWorkout: 999,
        isRecovered: true,
        recoveryTime: RECOVERY_TIMES[muscle],
      })
      continue
    }
    
    const daysSince = daysBetween(lastWorkout.date, today)
    const recoveryTime = RECOVERY_TIMES[muscle]
    
    statuses.push({
      muscleGroup: muscle,
      daysSinceLastWorkout: daysSince,
      isRecovered: daysSince >= recoveryTime,
      recoveryTime,
    })
  }
  
  return statuses
}

/**
 * Определяем тип тренировки на основе истории и восстановления
 */
function determineWorkoutType(
  history: LegacyWorkoutHistoryEntry[],
  recovery: RecoveryStatus[],
  exercisesFromDB: DbExercise[]
): WorkoutType {
  // Если нет истории - делаем full body
  if (history.length === 0) {
    return 'full_body'
  }
  
  const lastWorkouts = history.slice(0, 3)
  const last = lastWorkouts[0]
  
  // Проверяем, что ноги давно не тренировали
  const legsStatus = recovery.find(r => r.muscleGroup === 'legs')
  if (legsStatus && legsStatus.daysSinceLastWorkout >= 4) {
    return 'legs'
  }
  
  // Определяем паттерн последних тренировок по названиям
  const lastExerciseNames = last.exercises.map(e => e.name.toLowerCase())
  
  // Если последняя тренировка была push (жимы)
  if (lastExerciseNames.some(name => 
    name.includes('bench') || name.includes('press') && !name.includes('leg')
  )) {
    return 'pull' // Делаем тягу
  }
  
  // Если последняя тренировка была pull (тяги)
  if (lastExerciseNames.some(name => 
    name.includes('deadlift') || name.includes('row') || name.includes('pull')
  )) {
    // Проверяем ноги
    if (legsStatus?.isRecovered) {
      return 'legs'
    }
    return 'push' // Иначе жимы
  }
  
  // Если последняя была ноги
  if (lastExerciseNames.some(name => 
    name.includes('squat') || name.includes('lunge')
  )) {
    return 'push' // Делаем верх
  }
  
  // По умолчанию чередуем push/pull
  return 'push'
}

/**
 * Подбираем упражнения: 2 compound + 1 accessory
 */
function selectExercises(
  workoutType: WorkoutType,
  recentExerciseIds: string[],
  recovery: RecoveryStatus[],
  exercisesFromDB: DbExercise[]
): SuggestedExercise[] {
  const selected: SuggestedExercise[] = []
  
  // Шаг 1: Выбираем главное упражнение (compound barbell)
  const mainExercise = selectMainExercise(workoutType, recentExerciseIds, exercisesFromDB)
  if (mainExercise) {
    selected.push(createSuggestedExercise(mainExercise, 'main'))
  }
  
  // Шаг 2: Выбираем второе compound упражнение
  const secondaryExercise = selectSecondaryExercise(
    workoutType,
    [...recentExerciseIds, mainExercise?.id || ''],
    recovery,
    exercisesFromDB
  )
  if (secondaryExercise) {
    selected.push(createSuggestedExercise(secondaryExercise, 'secondary'))
  }
  
  // Шаг 3: Выбираем дополнительное упражнение
  const accessoryExercise = selectAccessoryExercise(
    workoutType,
    [...recentExerciseIds, mainExercise?.id || '', secondaryExercise?.id || ''],
    exercisesFromDB
  )
  if (accessoryExercise) {
    selected.push(createSuggestedExercise(accessoryExercise, 'accessory'))
  }
  
  return selected
}

/**
 * Выбираем главное упражнение
 */
function selectMainExercise(
  workoutType: WorkoutType,
  recentExercises: string[],
  exercisesFromDB: DbExercise[]
): DbExercise | null {
  // Фильтруем compound упражнения (вес + комплексные движения)
  const compounds = exercisesFromDB.filter(ex => 
    ex.exercise_type === 'weight' && ex.movement_pattern === 'complex'
  )
  
  let candidates: DbExercise[] = []
  
  switch (workoutType) {
    case 'legs':
      candidates = compounds.filter(ex => ex.muscle_group === 'legs')
      break
    case 'push':
      candidates = compounds.filter(ex => 
        ex.muscle_group === 'chest' || ex.muscle_group === 'shoulders'
      )
      break
    case 'pull':
      candidates = compounds.filter(ex => ex.muscle_group === 'back')
      break
    case 'upper':
      candidates = compounds.filter(ex => 
        ex.muscle_group === 'chest' || ex.muscle_group === 'back' || ex.muscle_group === 'shoulders'
      )
      break
    case 'full_body':
      candidates = compounds
      break
    default:
      candidates = compounds
  }
  
  // Фильтруем недавно использованные
  const filtered = candidates.filter(ex => !recentExercises.includes(ex.id))
  
  // Если все использовались - берем самое давнее
  if (filtered.length === 0 && candidates.length > 0) {
    return candidates[0]
  }
  
  // Приоритет Big 5
  const bigFiveCandidate = filtered.find(ex => 
    BIG_FIVE_NAMES.some(bigName => ex.name.includes(bigName))
  )
  if (bigFiveCandidate) {
    return bigFiveCandidate
  }
  
  return filtered[0] || candidates[0] || null
}

/**
 * Выбираем второе compound упражнение
 */
function selectSecondaryExercise(
  workoutType: WorkoutType,
  excludeExercises: string[],
  recovery: RecoveryStatus[],
  exercisesFromDB: DbExercise[]
): DbExercise | null {
  const compounds = exercisesFromDB.filter(ex => 
    ex.exercise_type === 'weight' && ex.movement_pattern === 'complex'
  )
  
  let candidates = compounds
    .filter(ex => !excludeExercises.includes(ex.id))
    .filter(ex => {
      // Проверяем, что мышцы восстановились
      const muscleGroup = ex.muscle_group as MuscleGroup
      const status = recovery.find(r => r.muscleGroup === muscleGroup)
      return status?.isRecovered ?? true
    })
  
  // Фильтруем по типу тренировки
  if (workoutType === 'legs') {
    candidates = candidates.filter(ex => ex.muscle_group === 'legs')
  } else if (workoutType === 'push') {
    candidates = candidates.filter(ex => 
      ex.muscle_group === 'chest' || ex.muscle_group === 'shoulders'
    )
  } else if (workoutType === 'pull') {
    candidates = candidates.filter(ex => ex.muscle_group === 'back')
  }
  
  return candidates[0] || null
}

/**
 * Выбираем дополнительное упражнение
 */
function selectAccessoryExercise(
  workoutType: WorkoutType,
  excludeExercises: string[],
  exercisesFromDB: DbExercise[]
): DbExercise | null {
  // Accessory = bodyweight complex ИЛИ weight iso
  const accessories = exercisesFromDB.filter(ex => 
    (ex.exercise_type === 'body' && ex.movement_pattern === 'complex') ||
    (ex.exercise_type === 'weight' && ex.movement_pattern === 'iso')
  )
  
  let candidates = accessories.filter(ex => !excludeExercises.includes(ex.id))
  
  // Фильтруем по типу тренировки
  if (workoutType === 'legs') {
    candidates = candidates.filter(ex => ex.muscle_group === 'legs')
  } else if (workoutType === 'push') {
    candidates = candidates.filter(ex => 
      ex.muscle_group === 'chest' || ex.muscle_group === 'shoulders' || ex.muscle_group === 'arms'
    )
  } else if (workoutType === 'pull') {
    candidates = candidates.filter(ex => 
      ex.muscle_group === 'back' || ex.muscle_group === 'arms'
    )
  }
  
  // Приоритет подтягиваниям и отжиманиям на брусьях
  const bodyweightCandidate = candidates.find(ex => 
    ex.name.toLowerCase().includes('pull-up') || ex.name.toLowerCase().includes('dip')
  )
  if (bodyweightCandidate) {
    return bodyweightCandidate
  }
  
  return candidates[0] || null
}

/**
 * Создаем объект SuggestedExercise с параметрами
 */
function createSuggestedExercise(
  exercise: DbExercise,
  role: 'main' | 'secondary' | 'accessory'
): SuggestedExercise {
  // Параметры в зависимости от роли
  let sets = 3
  let reps = '5'
  let rest = 180 // 3 минуты
  
  if (role === 'main') {
    sets = 4
    reps = '5'
    rest = 180
  } else if (role === 'secondary') {
    sets = 3
    reps = '8'
    rest = 120
  } else {
    sets = 3
    reps = '10-12'
    rest = 90
  }
  
  return {
    exerciseId: exercise.id,
    name: exercise.name,
    type: exercise.exercise_type === 'weight' ? 'compound_barbell' : 'compound_other',
    suggestedSets: sets,
    suggestedReps: reps,
    suggestedRest: rest,
  }
}

/**
 * Вспомогательные функции
 */

function findLastWorkoutForMuscle(
  muscle: MuscleGroup,
  history: LegacyWorkoutHistoryEntry[]
): LegacyWorkoutHistoryEntry | null {
  for (const workout of history) {
    const hasMuscle = workout.exercises.some(ex =>
      ex.primaryMuscles.includes(muscle)
    )
    if (hasMuscle) {
      return workout
    }
  }
  return null
}

function getRecentExerciseIds(
  history: LegacyWorkoutHistoryEntry[],
  numWorkouts: number
): string[] {
  const recent = history.slice(0, numWorkouts)
  const ids: string[] = []
  
  for (const workout of recent) {
    for (const exercise of workout.exercises) {
      ids.push(exercise.exerciseId)
    }
  }
  
  return ids
}

function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000
  return Math.floor((date2.getTime() - date1.getTime()) / oneDay)
}
