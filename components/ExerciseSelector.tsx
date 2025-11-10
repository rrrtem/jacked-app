"use client"

import { useState } from "react"

type Exercise = {
  id: string
  name: string
  instructions?: string | null
  tags?: string[] | null
}

type ExerciseSelectorProps = {
  exercises: Exercise[]
  isLoading?: boolean
  onSelectExercise: (exercise: Exercise) => void
}

export function ExerciseSelector({ exercises, isLoading, onSelectExercise }: ExerciseSelectorProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Получаем все уникальные теги
  const allTags = Array.from(
    new Set(
      exercises
        .flatMap((ex) => ex.tags || [])
        .filter((tag) => tag)
    )
  )

  // Фильтруем упражнения по выбранному тегу
  const filteredExercises = selectedTag
    ? exercises.filter((exercise) => exercise.tags && exercise.tags.includes(selectedTag))
    : exercises

  if (isLoading) {
    return (
      <div className="py-12 text-center text-[16px] leading-[140%] text-[rgba(0,0,0,0.5)] lowercase">
        loading...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Фильтр по тегам */}
      <div className="p-6 pb-4 flex-shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedTag(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-[60px] text-[16px] leading-[120%] transition-colors lowercase ${
              selectedTag === null
                ? "bg-[#000000] text-[#ffffff]"
                : "bg-[rgba(0,0,0,0.05)] text-[#000000] hover:bg-[rgba(0,0,0,0.1)]"
            }`}
          >
            all
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`flex-shrink-0 px-4 py-2 rounded-[60px] text-[16px] leading-[120%] transition-colors lowercase ${
                selectedTag === tag
                  ? "bg-[#000000] text-[#ffffff]"
                  : "bg-[rgba(0,0,0,0.05)] text-[#000000] hover:bg-[rgba(0,0,0,0.1)]"
              }`}
            >
              {tag.toLowerCase()}
            </button>
          ))}
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
                className="w-full bg-[#ffffff] text-left py-4 px-6 rounded-[20px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] hover:bg-[rgba(0,0,0,0.02)] lowercase"
              >
                <div className="font-normal text-[#000000]">{exercise.name.toLowerCase()}</div>
                {exercise.instructions && (
                  <div className="text-[16px] text-[rgba(0,0,0,0.5)] mt-1 line-clamp-2 lowercase">
                    {exercise.instructions.toLowerCase()}
                  </div>
                )}
                {exercise.tags && exercise.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {exercise.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-[rgba(0,0,0,0.05)] rounded-[8px] text-[14px] text-[rgba(0,0,0,0.6)] lowercase"
                      >
                        {tag.toLowerCase()}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

