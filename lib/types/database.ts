/**
 * TypeScript типы для базы данных Supabase
 * Автоматически сгенерированы на основе схемы БД
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          name: string
          instructions: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          instructions?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          instructions?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      exercise_records: {
        Row: {
          id: string
          user_id: string
          exercise_id: string
          max_weight: number | null
          max_reps: number | null
          max_duration: number | null
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_id: string
          max_weight?: number | null
          max_reps?: number | null
          max_duration?: number | null
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_id?: string
          max_weight?: number | null
          max_reps?: number | null
          max_duration?: number | null
          last_updated?: string
          created_at?: string
        }
      }
      exercise_record_history: {
        Row: {
          id: string
          user_id: string
          exercise_id: string
          workout_session_id: string | null
          weight: number | null
          reps: number | null
          duration: number | null
          achieved_at: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_id: string
          workout_session_id?: string | null
          weight?: number | null
          reps?: number | null
          duration?: number | null
          achieved_at?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_id?: string
          workout_session_id?: string | null
          weight?: number | null
          reps?: number | null
          duration?: number | null
          achieved_at?: string
          notes?: string | null
          created_at?: string
        }
      }
      workout_sets: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workout_set_exercises: {
        Row: {
          id: string
          workout_set_id: string
          exercise_id: string
          order_index: number
          target_sets: number | null
          target_reps: number | null
          target_weight: number | null
          rest_duration: number | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_set_id: string
          exercise_id: string
          order_index?: number
          target_sets?: number | null
          target_reps?: number | null
          target_weight?: number | null
          rest_duration?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_set_id?: string
          exercise_id?: string
          order_index?: number
          target_sets?: number | null
          target_reps?: number | null
          target_weight?: number | null
          rest_duration?: number | null
          created_at?: string
        }
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          workout_set_id: string | null
          started_at: string
          completed_at: string | null
          duration: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workout_set_id?: string | null
          started_at?: string
          completed_at?: string | null
          duration?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workout_set_id?: string | null
          started_at?: string
          completed_at?: string | null
          duration?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workout_session_exercises: {
        Row: {
          id: string
          workout_session_id: string
          exercise_id: string
          order_index: number
          warmup_completed: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_session_id: string
          exercise_id: string
          order_index?: number
          warmup_completed?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_session_id?: string
          exercise_id?: string
          order_index?: number
          warmup_completed?: boolean | null
          created_at?: string
        }
      }
      workout_sets_data: {
        Row: {
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
        Insert: {
          id?: string
          workout_session_exercise_id: string
          set_number: number
          weight?: number | null
          reps?: number | null
          duration?: number | null
          completed?: boolean | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_session_exercise_id?: string
          set_number?: number
          weight?: number | null
          reps?: number | null
          duration?: number | null
          completed?: boolean | null
          notes?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Удобные типы для использования в приложении
export type User = Database['public']['Tables']['users']['Row']
export type Exercise = Database['public']['Tables']['exercises']['Row']
export type ExerciseRecord = Database['public']['Tables']['exercise_records']['Row']
export type ExerciseRecordHistory = Database['public']['Tables']['exercise_record_history']['Row']
export type WorkoutSet = Database['public']['Tables']['workout_sets']['Row']
export type WorkoutSetExercise = Database['public']['Tables']['workout_set_exercises']['Row']
export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row']
export type WorkoutSessionExercise = Database['public']['Tables']['workout_session_exercises']['Row']
export type WorkoutSetData = Database['public']['Tables']['workout_sets_data']['Row']

// Типы для вставки (Insert)
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type ExerciseInsert = Database['public']['Tables']['exercises']['Insert']
export type ExerciseRecordInsert = Database['public']['Tables']['exercise_records']['Insert']
export type ExerciseRecordHistoryInsert = Database['public']['Tables']['exercise_record_history']['Insert']
export type WorkoutSetInsert = Database['public']['Tables']['workout_sets']['Insert']
export type WorkoutSetExerciseInsert = Database['public']['Tables']['workout_set_exercises']['Insert']
export type WorkoutSessionInsert = Database['public']['Tables']['workout_sessions']['Insert']
export type WorkoutSessionExerciseInsert = Database['public']['Tables']['workout_session_exercises']['Insert']
export type WorkoutSetDataInsert = Database['public']['Tables']['workout_sets_data']['Insert']

// Типы для обновления (Update)
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type ExerciseUpdate = Database['public']['Tables']['exercises']['Update']
export type ExerciseRecordUpdate = Database['public']['Tables']['exercise_records']['Update']
export type ExerciseRecordHistoryUpdate = Database['public']['Tables']['exercise_record_history']['Update']
export type WorkoutSetUpdate = Database['public']['Tables']['workout_sets']['Update']
export type WorkoutSetExerciseUpdate = Database['public']['Tables']['workout_set_exercises']['Update']
export type WorkoutSessionUpdate = Database['public']['Tables']['workout_sessions']['Update']
export type WorkoutSessionExerciseUpdate = Database['public']['Tables']['workout_session_exercises']['Update']
export type WorkoutSetDataUpdate = Database['public']['Tables']['workout_sets_data']['Update']

// Расширенные типы с JOIN данными

/**
 * Упражнение с личными рекордами пользователя
 */
export type ExerciseWithRecords = Exercise & {
  record?: ExerciseRecord
}

/**
 * Шаблон тренировки с упражнениями
 */
export type WorkoutSetWithExercises = WorkoutSet & {
  exercises: (WorkoutSetExercise & {
    exercise: Exercise
  })[]
}

/**
 * Сессия тренировки с упражнениями и подходами
 */
export type WorkoutSessionWithDetails = WorkoutSession & {
  exercises: (WorkoutSessionExercise & {
    exercise: Exercise
    sets: WorkoutSetData[]
  })[]
}

/**
 * Данные для создания новой тренировочной сессии
 */
export interface CreateWorkoutSessionData {
  workout_set_id?: string
  exercises: {
    exercise_id: string
    order_index: number
    target_sets?: number
    target_reps?: number
    target_weight?: number
  }[]
}

/**
 * Данные для сохранения подхода
 */
export interface SaveSetData {
  workout_session_exercise_id: string
  set_number: number
  weight?: number
  reps?: number
  duration?: number
  completed?: boolean
  notes?: string
}

/**
 * Статистика тренировки
 */
export interface WorkoutStats {
  total_duration: number
  total_exercises: number
  total_sets: number
  total_reps: number
  total_volume: number // Общий объем (вес × повторы)
}

/**
 * Фильтры для получения истории тренировок
 */
export interface WorkoutHistoryFilters {
  user_id: string
  date_from?: string
  date_to?: string
  workout_set_id?: string
  limit?: number
  offset?: number
}

