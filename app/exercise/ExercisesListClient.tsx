"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { X, Heart } from "lucide-react"
import { addExerciseToFavorites, removeExerciseFromFavorites } from "@/lib/supabase/queries"

type Exercise = {
  id: string
  name: string
  instructions: string | null
  exercise_type: string
  movement_pattern: string
  muscle_group: string
  is_favorite?: boolean
}

type ExercisesListClientProps = {
  exercises: Exercise[]
  userId: string
}

const EXERCISE_TYPES = {
  duration: 'duration',
  mobility: 'mobility',
  warmup: 'warmup',
  weight: 'weight',
  body: 'body',
  dumbbell: 'dumbbell',
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

export function ExercisesListClient({ exercises, userId }: ExercisesListClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const [exercisesData, setExercisesData] = useState(exercises)

  // Get unique types and muscles
  const availableTypes = Array.from(new Set(exercises.map(ex => ex.exercise_type)))
    .filter(type => EXERCISE_TYPES[type as keyof typeof EXERCISE_TYPES])
    .sort()

  const availableMuscles = Array.from(new Set(exercises.map(ex => ex.muscle_group)))
    .filter(muscle => MUSCLE_GROUPS[muscle as keyof typeof MUSCLE_GROUPS])
    .sort()

  // Filter exercises
  const filteredExercises = exercisesData.filter((exercise) => {
    if (showFavorites && !exercise.is_favorite) return false
    if (selectedType && exercise.exercise_type !== selectedType) return false
    if (selectedMuscle && exercise.muscle_group !== selectedMuscle) return false
    if (selectedPattern && exercise.movement_pattern !== selectedPattern) return false
    return true
  })

  const clearAllFilters = () => {
    setSelectedType(null)
    setSelectedMuscle(null)
    setSelectedPattern(null)
    setShowFavorites(false)
  }

  const activeFiltersCount = [selectedType, selectedMuscle, selectedPattern, showFavorites ? 'favorites' : null].filter(v => v !== null).length

  const handleToggleFavorite = async (exerciseId: string, currentFavorite: boolean) => {
    try {
      if (currentFavorite) {
        await removeExerciseFromFavorites(userId, exerciseId)
      } else {
        await addExerciseToFavorites(userId, exerciseId)
      }
      
      // Update local state
      setExercisesData(prev => 
        prev.map(ex => 
          ex.id === exerciseId 
            ? { ...ex, is_favorite: !currentFavorite }
            : ex
        )
      )
      
      // Refresh server data
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleExerciseClick = (exerciseId: string) => {
    router.push(`/exercise/${exerciseId}`)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">
      {/* Filters */}
      <div className="p-6 pb-4 flex-shrink-0 border-b border-[rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center overflow-x-auto pb-2">
            {/* Reset button */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-[rgba(255,47,0,0.1)] transition-colors mr-[10px]"
                aria-label="reset filters"
              >
                <X className="w-5 h-5 text-[#ff2f00]" />
              </button>
            )}

            {/* Favorites filter */}
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className={`flex-shrink-0 px-4 py-3 rounded-[16px] text-[16px] leading-[120%] transition-colors lowercase flex items-center gap-2 ${
                showFavorites
                  ? "bg-[#ff2f00] text-[#ffffff]"
                  : "bg-[#f7f7f7] text-[rgba(0,0,0,0.6)] hover:bg-[rgba(0,0,0,0.1)]"
              }`}
            >
              <Heart className={`w-4 h-4 ${showFavorites ? 'fill-current' : ''}`} />
              favorites
            </button>

            <div className="flex-shrink-0 w-[10px]" />

            {/* Type buttons */}
            <div className="flex items-center gap-[5px]">
              {availableTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(selectedType === type ? null : type)}
                  className={`flex-shrink-0 px-4 py-3 rounded-[16px] text-[16px] leading-[120%] transition-colors lowercase ${
                    selectedType === type
                      ? "bg-[#000000] text-[#ffffff]"
                      : "bg-[#f7f7f7] text-[rgba(0,0,0,0.6)] hover:bg-[rgba(0,0,0,0.1)]"
                  }`}
                >
                  {EXERCISE_TYPES[type as keyof typeof EXERCISE_TYPES] || type}
                </button>
              ))}
            </div>

            <div className="flex-shrink-0 w-[10px]" />

            {/* Muscle Select */}
            <div className="flex-shrink-0 w-[180px]">
              <select
                value={selectedMuscle || ''}
                onChange={(e) => setSelectedMuscle(e.target.value || null)}
                className="w-full px-4 py-3 bg-[#f7f7f7] rounded-[16px] text-[16px] leading-[120%] lowercase border-none outline-none appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '36px',
                }}
              >
                <option value="">all muscles</option>
                {availableMuscles.map(muscle => (
                  <option key={muscle} value={muscle}>
                    {MUSCLE_GROUPS[muscle as keyof typeof MUSCLE_GROUPS] || muscle}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-shrink-0 w-[10px]" />

            {/* Pattern Select */}
            <div className="flex-shrink-0 w-[150px]">
              <select
                value={selectedPattern || ''}
                onChange={(e) => setSelectedPattern(e.target.value || null)}
                className="w-full px-4 py-3 bg-[#f7f7f7] rounded-[16px] text-[16px] leading-[120%] lowercase border-none outline-none appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '36px',
                }}
              >
                <option value="">all patterns</option>
                <option value="complex">complex</option>
                <option value="iso">iso</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="max-w-7xl mx-auto pt-6">
          {filteredExercises.length === 0 ? (
            <div className="py-12 text-center text-[16px] leading-[140%] text-[rgba(0,0,0,0.5)] lowercase">
              no exercises found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="bg-[#ffffff] rounded-[20px] border border-[rgba(0,0,0,0.1)] hover:border-[rgba(0,0,0,0.2)] transition-all overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <button
                        onClick={() => handleExerciseClick(exercise.id)}
                        className="flex-1 text-left"
                      >
                        <h3 className="text-[20px] leading-[120%] font-normal text-[#000000] lowercase hover:text-[rgba(0,0,0,0.7)] transition-colors">
                          {exercise.name.toLowerCase()}
                        </h3>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleFavorite(exercise.id, exercise.is_favorite || false)
                        }}
                        className="flex-shrink-0 ml-3 p-2 hover:bg-[rgba(255,47,0,0.1)] rounded-full transition-colors"
                        aria-label={exercise.is_favorite ? 'remove from favorites' : 'add to favorites'}
                      >
                        <Heart 
                          className={`w-5 h-5 transition-colors ${
                            exercise.is_favorite 
                              ? 'fill-[#ff2f00] text-[#ff2f00]' 
                              : 'text-[rgba(0,0,0,0.3)]'
                          }`}
                        />
                      </button>
                    </div>
                    
                    {exercise.instructions && (
                      <p className="text-[14px] leading-[140%] text-[rgba(0,0,0,0.5)] mb-3 line-clamp-2 lowercase">
                        {exercise.instructions.toLowerCase()}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-1 bg-[rgba(0,0,0,0.05)] rounded-[8px] text-[12px] text-[rgba(0,0,0,0.6)] lowercase">
                        {MUSCLE_GROUPS[exercise.muscle_group as keyof typeof MUSCLE_GROUPS] || exercise.muscle_group}
                      </span>
                      <span className="px-2 py-1 bg-[rgba(0,0,0,0.05)] rounded-[8px] text-[12px] text-[rgba(0,0,0,0.6)] lowercase">
                        {exercise.movement_pattern}
                      </span>
                      <span className="px-2 py-1 bg-[rgba(0,0,0,0.05)] rounded-[8px] text-[12px] text-[rgba(0,0,0,0.6)] lowercase">
                        {EXERCISE_TYPES[exercise.exercise_type as keyof typeof EXERCISE_TYPES] || exercise.exercise_type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

