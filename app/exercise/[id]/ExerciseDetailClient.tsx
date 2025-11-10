"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Heart, TrendingUp } from "lucide-react"
import { addExerciseToFavorites, removeExerciseFromFavorites } from "@/lib/supabase/queries"
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
          <div className="flex flex-wrap gap-2 mb-6">
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
        <div className="bg-[#f7f7f7] rounded-[20px] p-6">
          <h2 className="text-[20px] leading-[120%] font-normal text-[#000000] mb-3 lowercase">
            instructions
          </h2>
          <p className="text-[16px] leading-[140%] text-[rgba(0,0,0,0.7)] lowercase">
            {exercise.instructions.toLowerCase()}
          </p>
        </div>
      )}

      {/* Personal Records */}
      <div>
        <h2 className="text-[24px] leading-[120%] font-normal text-[#000000] mb-4 lowercase">
          personal records
        </h2>
        {initialRecord ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {initialRecord.max_weight !== null && (
              <div className="bg-[#ffffff] border border-[rgba(0,0,0,0.1)] rounded-[20px] p-6">
                <div className="text-[14px] text-[rgba(0,0,0,0.5)] mb-2 lowercase">max weight</div>
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
              <div className="bg-[#ffffff] border border-[rgba(0,0,0,0.1)] rounded-[20px] p-6">
                <div className="text-[14px] text-[rgba(0,0,0,0.5)] mb-2 lowercase">max reps</div>
                <div className="text-[32px] leading-[120%] font-normal text-[#000000]">
                  {initialRecord.max_reps} <span className="text-[20px] text-[rgba(0,0,0,0.5)]">reps</span>
                </div>
              </div>
            )}
            {initialRecord.max_duration !== null && (
              <div className="bg-[#ffffff] border border-[rgba(0,0,0,0.1)] rounded-[20px] p-6">
                <div className="text-[14px] text-[rgba(0,0,0,0.5)] mb-2 lowercase">max duration</div>
                <div className="text-[32px] leading-[120%] font-normal text-[#000000]">
                  {initialRecord.max_duration} <span className="text-[20px] text-[rgba(0,0,0,0.5)]">sec</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#f7f7f7] rounded-[20px] p-6 text-center">
            <p className="text-[16px] leading-[140%] text-[rgba(0,0,0,0.5)] lowercase">
              no records yet. complete a workout with this exercise to set your first record!
            </p>
          </div>
        )}
      </div>

      {/* Progress Chart */}
      {chartData.length > 0 && (
        <div>
          <h2 className="text-[24px] leading-[120%] font-normal text-[#000000] mb-4 lowercase flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            progress
          </h2>
          <div className="bg-[#ffffff] border border-[rgba(0,0,0,0.1)] rounded-[20px] p-6">
            <div className="mb-4">
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
        </div>
      )}

      {/* History Table */}
      {history.length > 0 && (
        <div>
          <h2 className="text-[24px] leading-[120%] font-normal text-[#000000] mb-4 lowercase">
            history
          </h2>
          <div className="bg-[#ffffff] border border-[rgba(0,0,0,0.1)] rounded-[20px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f7f7f7] border-b border-[rgba(0,0,0,0.1)]">
                  <tr>
                    <th className="text-left px-6 py-4 text-[14px] text-[rgba(0,0,0,0.6)] font-normal lowercase">
                      date
                    </th>
                    {exercise.exercise_type === 'weight' || exercise.exercise_type === 'dumbbell' ? (
                      <>
                        <th className="text-left px-6 py-4 text-[14px] text-[rgba(0,0,0,0.6)] font-normal lowercase">
                          weight (kg)
                        </th>
                        <th className="text-left px-6 py-4 text-[14px] text-[rgba(0,0,0,0.6)] font-normal lowercase">
                          reps
                        </th>
                      </>
                    ) : exercise.exercise_type === 'duration' ? (
                      <th className="text-left px-6 py-4 text-[14px] text-[rgba(0,0,0,0.6)] font-normal lowercase">
                        duration (s)
                      </th>
                    ) : (
                      <th className="text-left px-6 py-4 text-[14px] text-[rgba(0,0,0,0.6)] font-normal lowercase">
                        reps
                      </th>
                    )}
                    <th className="text-left px-6 py-4 text-[14px] text-[rgba(0,0,0,0.6)] font-normal lowercase">
                      notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record, index) => (
                    <tr 
                      key={record.id}
                      className={index !== history.length - 1 ? 'border-b border-[rgba(0,0,0,0.05)]' : ''}
                    >
                      <td className="px-6 py-4 text-[14px] text-[#000000]">
                        {new Date(record.achieved_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      {exercise.exercise_type === 'weight' || exercise.exercise_type === 'dumbbell' ? (
                        <>
                          <td className="px-6 py-4 text-[14px] text-[#000000]">
                            {record.weight !== null ? record.weight : '—'}
                          </td>
                          <td className="px-6 py-4 text-[14px] text-[#000000]">
                            {record.reps !== null ? record.reps : '—'}
                          </td>
                        </>
                      ) : exercise.exercise_type === 'duration' ? (
                        <td className="px-6 py-4 text-[14px] text-[#000000]">
                          {record.duration !== null ? record.duration : '—'}
                        </td>
                      ) : (
                        <td className="px-6 py-4 text-[14px] text-[#000000]">
                          {record.reps !== null ? record.reps : '—'}
                        </td>
                      )}
                      <td className="px-6 py-4 text-[14px] text-[rgba(0,0,0,0.5)] lowercase">
                        {record.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

