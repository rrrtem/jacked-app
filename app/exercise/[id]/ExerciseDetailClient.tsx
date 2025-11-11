"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Heart, TrendingUp, Trash2 } from "lucide-react"
import { addExerciseToFavorites, removeExerciseFromFavorites, deleteRecordFromHistory } from "@/lib/supabase/queries"
import type { Exercise, ExerciseRecord, ExerciseRecordHistory } from "@/lib/types/database"

type ExerciseDetailClientProps = {
  exercise: Exercise
  record: ExerciseRecord | null
  history: ExerciseRecordHistory[]
  isFavorite: boolean
  userId: string
}

const MUSCLE_GROUPS = {
  chest: 'chest',
  back: 'back',
  legs: 'legs',
  shoulders: 'shoulders',
  arms: 'arms',
  core: 'core',
  full_body: 'full body',
}

export function ExerciseDetailClient({ 
  exercise, 
  record: initialRecord,
  history,
  isFavorite: initialIsFavorite,
  userId
}: ExerciseDetailClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null)

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        await removeExerciseFromFavorites(userId, exercise.id)
      } else {
        await addExerciseToFavorites(userId, exercise.id)
      }
      
      setIsFavorite(!isFavorite)
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('delete this record?')) return
    
    try {
      setDeletingRecordId(recordId)
      await deleteRecordFromHistory(recordId)
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Error deleting record:', error)
      alert('failed to delete record. please try again.')
    } finally {
      setDeletingRecordId(null)
    }
  }

  // Prepare chart data
  const chartData = history
    .filter(h => {
      // Filter based on exercise type
      if (exercise.exercise_type === 'duration') {
        return h.duration !== null
      } else if (exercise.exercise_type === 'weight' || exercise.exercise_type === 'dumbbell') {
        return h.weight !== null
      } else {
        return h.reps !== null
      }
    })
    .reverse() // Show oldest first for progression
    .slice(-10) // Last 10 records

  const getChartValue = (h: ExerciseRecordHistory) => {
    if (exercise.exercise_type === 'duration') {
      return h.duration || 0
    } else if (exercise.exercise_type === 'weight' || exercise.exercise_type === 'dumbbell') {
      return h.weight || 0
    } else {
      return h.reps || 0
    }
  }

  const getChartLabel = () => {
    if (exercise.exercise_type === 'duration') return 'duration (s)'
    if (exercise.exercise_type === 'weight' || exercise.exercise_type === 'dumbbell') return 'weight (kg)'
    return 'reps'
  }

  const maxValue = chartData.length > 0 
    ? Math.max(...chartData.map(getChartValue))
    : 0

  return (
    <div className="space-y-8">
      {/* Exercise Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-[48px] leading-[120%] font-normal text-[#000000] mb-4 lowercase">
            {exercise.name.toLowerCase()}
          </h1>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-2 bg-[rgba(0,0,0,0.05)] rounded-[12px] text-[14px] text-[rgba(0,0,0,0.6)] lowercase">
              {MUSCLE_GROUPS[exercise.muscle_group as keyof typeof MUSCLE_GROUPS] || exercise.muscle_group}
            </span>
            <span className="px-3 py-2 bg-[rgba(0,0,0,0.05)] rounded-[12px] text-[14px] text-[rgba(0,0,0,0.6)] lowercase">
              {exercise.movement_pattern}
            </span>
            <span className="px-3 py-2 bg-[rgba(0,0,0,0.05)] rounded-[12px] text-[14px] text-[rgba(0,0,0,0.6)] lowercase">
              {exercise.exercise_type}
            </span>
          </div>
        </div>
        <button
          onClick={handleToggleFavorite}
          disabled={isPending}
          className="flex-shrink-0 ml-6 p-4 hover:bg-[rgba(255,47,0,0.1)] rounded-full transition-colors disabled:opacity-50"
          aria-label={isFavorite ? 'remove from favorites' : 'add to favorites'}
        >
          <Heart 
            className={`w-7 h-7 transition-colors ${
              isFavorite 
                ? 'fill-[#ff2f00] text-[#ff2f00]' 
                : 'text-[rgba(0,0,0,0.3)]'
            }`}
          />
        </button>
      </div>

      {/* Instructions */}
      {exercise.instructions && (
        <div>
          <p className="text-[16px] leading-[140%] text-[rgba(0,0,0,0.7)] lowercase">
            {exercise.instructions.toLowerCase()}
          </p>
        </div>
      )}

      {/* Records Section */}
      {(initialRecord || history.length > 0) && (
        <div className="bg-[#ffffff] border border-[rgba(0,0,0,0.1)] rounded-[20px] p-6">
          {/* Current Records */}
          {initialRecord && (
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {initialRecord.max_weight !== null && (
                  <div className="bg-[#f7f7f7] rounded-[16px] p-5">
                    <div className="text-[32px] leading-[120%] font-normal text-[#000000]">
                      {initialRecord.max_weight} <span className="text-[20px] text-[rgba(0,0,0,0.5)]">kg</span>
                    </div>
                    {initialRecord.max_reps !== null && (
                      <div className="text-[14px] text-[rgba(0,0,0,0.5)] mt-1 lowercase">
                        × {initialRecord.max_reps} reps
                      </div>
                    )}
                  </div>
                )}
                {initialRecord.max_reps !== null && initialRecord.max_weight === null && (
                  <div className="bg-[#f7f7f7] rounded-[16px] p-5">
                    <div className="text-[32px] leading-[120%] font-normal text-[#000000]">
                      {initialRecord.max_reps} <span className="text-[20px] text-[rgba(0,0,0,0.5)]">reps</span>
                    </div>
                  </div>
                )}
                {initialRecord.max_duration !== null && (
                  <div className="bg-[#f7f7f7] rounded-[16px] p-5">
                    <div className="text-[32px] leading-[120%] font-normal text-[#000000]">
                      {initialRecord.max_duration} <span className="text-[20px] text-[rgba(0,0,0,0.5)]">sec</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress Chart */}
          {chartData.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[rgba(0,0,0,0.6)]" />
                <div className="text-[14px] text-[rgba(0,0,0,0.5)] lowercase">{getChartLabel()}</div>
              </div>
              
              {/* Simple bar chart */}
              <div className="relative h-[200px] flex items-end gap-2">
                {chartData.map((record, index) => {
                  const value = getChartValue(record)
                  const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0
                  const date = new Date(record.achieved_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })
                  
                  return (
                    <div key={record.id} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center justify-end h-full">
                        <div className="text-[12px] text-[rgba(0,0,0,0.5)] mb-1">
                          {value}
                        </div>
                        <div 
                          className="w-full bg-[#000000] rounded-t-[8px] transition-all hover:bg-[#ff2f00]"
                          style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                          title={`${date}: ${value}`}
                        />
                      </div>
                      <div className="text-[10px] text-[rgba(0,0,0,0.4)] lowercase whitespace-nowrap">
                        {date}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div>
              <div className="space-y-3">
                {history.map((record) => {
                  const recordText = exercise.exercise_type === 'weight' || exercise.exercise_type === 'dumbbell'
                    ? `${record.weight !== null ? `${record.weight} kg` : '—'}${record.reps !== null ? ` × ${record.reps} reps` : ''}`
                    : exercise.exercise_type === 'duration'
                    ? `${record.duration !== null ? `${record.duration} sec` : '—'}`
                    : `${record.reps !== null ? `${record.reps} reps` : '—'}`

                  return (
                    <div 
                      key={record.id}
                      className="flex items-center justify-between p-4 bg-[#f7f7f7] rounded-[12px] hover:bg-[rgba(0,0,0,0.05)] transition-colors"
                    >
                      <div className="flex-1">
                        <div className="text-[16px] text-[#000000] font-normal lowercase mb-1">
                          {recordText}
                        </div>
                        <div className="text-[13px] text-[rgba(0,0,0,0.5)]">
                          {new Date(record.achieved_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {record.notes && (
                          <div className="text-[13px] text-[rgba(0,0,0,0.4)] mt-1 lowercase">
                            {record.notes}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        disabled={deletingRecordId === record.id}
                        className="ml-4 p-2 hover:bg-[rgba(255,47,0,0.1)] rounded-[8px] transition-colors disabled:opacity-50"
                        aria-label="delete record"
                      >
                        <Trash2 className="w-4 h-4 text-[rgba(255,47,0,0.7)]" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

