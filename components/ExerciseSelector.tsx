"use client"

import { useState } from "react"
import { X } from "lucide-react"

type Exercise = {
  id: string
  name: string
  instructions: string | null
  exercise_type: string
  movement_pattern: string
  muscle_group: string
}

type ExerciseSelectorProps = {
  exercises: Exercise[]
  isLoading?: boolean
  onSelectExercise: (exercise: Exercise) => void
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

export function ExerciseSelector({ exercises, isLoading, onSelectExercise }: ExerciseSelectorProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null)

  // Получаем уникальные типы упражнений
  const availableTypes = Array.from(new Set(exercises.map(ex => ex.exercise_type)))
    .filter(type => EXERCISE_TYPES[type as keyof typeof EXERCISE_TYPES])
    .sort()

  // Получаем уникальные группы мышц
  const availableMuscles = Array.from(new Set(exercises.map(ex => ex.muscle_group)))
    .filter(muscle => MUSCLE_GROUPS[muscle as keyof typeof MUSCLE_GROUPS])
    .sort()

  // Фильтруем упражнения
  const filteredExercises = exercises.filter((exercise) => {
    if (selectedType && exercise.exercise_type !== selectedType) return false
    if (selectedMuscle && exercise.muscle_group !== selectedMuscle) return false
    if (selectedPattern && exercise.movement_pattern !== selectedPattern) return false
    return true
  })

  const clearAllFilters = () => {
    setSelectedType(null)
    setSelectedMuscle(null)
    setSelectedPattern(null)
  }

  const activeFiltersCount = [selectedType, selectedMuscle, selectedPattern].filter(v => v !== null).length

  if (isLoading) {
    return (
      <div className="py-12 text-center text-[16px] leading-[140%] text-[rgba(0,0,0,0.5)] lowercase">
        loading...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Фильтры в одну строку */}
      <div className="p-6 pb-4 flex-shrink-0">
        <div className="flex items-center overflow-x-auto pb-2">
          {/* Reset button - красный крестик */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-[rgba(255,47,0,0.1)] transition-colors mr-[10px]"
              aria-label="Reset filters"
            >
              <X className="w-5 h-5 text-[#ff2f00]" />
            </button>
          )}

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

          {/* Spacer 10px */}
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

          {/* Spacer 10px */}
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

      {/* Список упражнений */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {filteredExercises.length === 0 ? (
          <div className="py-12 text-center text-[16px] leading-[140%] text-[rgba(0,0,0,0.5)] lowercase">
            no exercises found
          </div>
        ) : (
          <div className="space-y-2">
            {filteredExercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => onSelectExercise(exercise)}
                className="w-full bg-[#ffffff] text-left py-4 px-6 rounded-[20px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] hover:bg-[rgba(0,0,0,0.02)] lowercase transition-colors"
              >
                <div className="font-normal text-[#000000]">{exercise.name.toLowerCase()}</div>
                {exercise.instructions && (
                  <div className="text-[16px] text-[rgba(0,0,0,0.5)] mt-1 line-clamp-2 lowercase">
                    {exercise.instructions.toLowerCase()}
                  </div>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="px-2 py-1 bg-[rgba(0,0,0,0.05)] rounded-[8px] text-[14px] text-[rgba(0,0,0,0.6)] lowercase">
                    {MUSCLE_GROUPS[exercise.muscle_group as keyof typeof MUSCLE_GROUPS] || exercise.muscle_group}
                  </span>
                  <span className="px-2 py-1 bg-[rgba(0,0,0,0.05)] rounded-[8px] text-[14px] text-[rgba(0,0,0,0.6)] lowercase">
                    {exercise.movement_pattern}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

