export type WorkoutStage = "warmup" | "exercise-warmup" | "working-set" | "rest" | "add-exercise-prompt" | "finished"

export type ExerciseData = {
  id: string
  exerciseId?: string | null
  workoutEntryId?: string | null
  name: string
  sets: number | null
  instructions?: string
  exercise_type?: string
  movement_pattern?: string
  muscle_group?: string
}

export type DbExercise = {
  id: string
  name: string
  instructions: string | null
  exercise_type: string
  movement_pattern: string
  muscle_group: string
}

export type CompletedSet = {
  set: number
  weight?: string | null
  reps?: string | null
  duration?: string | null
}

export type NewRecord = {
  exerciseId: string
  exerciseName: string
  recordType: string
  value: string
}

export type WorkoutState = {
  workoutId: string
  stage: WorkoutStage
  currentExercise: number
  currentSet: number
  totalTime: number
  warmupTime: number
  restTime: number
  isWorkoutActive: boolean
  weight: string
  reps: string
  duration: string
  completedSets: Record<string, CompletedSet[]>
  exercises: ExerciseData[]
  startTime: number
  showExerciseList: boolean
  availableExercises: DbExercise[]
}

