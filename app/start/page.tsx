"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { X, Mic, Trash2, Plus, Sparkles } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import type { WorkoutSetWithExercises } from "@/lib/types/database"
import { ExerciseSelector } from "@/components/ExerciseSelector"
import { 
  addExerciseToWorkoutSet, 
  removeExerciseFromWorkoutSet,
  createWorkoutSet
} from "@/lib/supabase/queries"
// Legacy AI suggest imports (not used in new LLM-based system)
// import {
//   getAISuggestedWorkout,
//   mapSupabaseToAIHistory,
// } from "@/lib/ai-suggest"

type Exercise = {
  id: string
  exerciseId: string | null
  name: string
  sets: number | null
  warmupTime?: string
  instructions?: string
  exercise_type?: string
  movement_pattern?: string
  muscle_group?: string
}

type Preset = {
  id: string
  label: string
  exercises: Exercise[]
}

type DbExercise = {
  id: string
  name: string
  instructions: string | null
  exercise_type: string
  movement_pattern: string
  muscle_group: string
}

export default function StartWorkout() {
  const [showAdjustOverlay, setShowAdjustOverlay] = useState(false)
  const [inputText, setInputText] = useState("")
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [swipedExerciseId, setSwipedExerciseId] = useState<string | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [swipeDistance, setSwipeDistance] = useState(0)
  const [editingWarmupId, setEditingWarmupId] = useState<string | null>(null)
  const [warmupInputValue, setWarmupInputValue] = useState<string>("")
  const warmupInputRef = useRef<HTMLInputElement | null>(null)
  
  // Состояния для добавления упражнений
  const [showExerciseList, setShowExerciseList] = useState(false)
  const [availableExercises, setAvailableExercises] = useState<DbExercise[]>([])
  const [loadingExercises, setLoadingExercises] = useState(false)
  const [modalTouchStart, setModalTouchStart] = useState<number | null>(null)
  const [modalSwipeDistance, setModalSwipeDistance] = useState(0)
  
  // Состояния для создания нового сета
  const [showCreateSetModal, setShowCreateSetModal] = useState(false)
  const [newSetName, setNewSetName] = useState("")
  const [creatingSet, setCreatingSet] = useState(false)
  
  // Состояния для редактирования названия сета
  const [editingSetId, setEditingSetId] = useState<string | null>(null)
  const [editingSetName, setEditingSetName] = useState("")
  const setNameInputRef = useRef<HTMLInputElement | null>(null)
  
  // Упражнения для AI suggested preset (не сохраняются в БД пока)
  const [aiSuggestedExercises, setAiSuggestedExercises] = useState<Exercise[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiLocalContext, setAiLocalContext] = useState("")
  const [aiOverallReasoning, setAiOverallReasoning] = useState("")
  const [aiAdjustmentContext, setAiAdjustmentContext] = useState("")
  
  // User preferences modal
  const [showPreferencesModal, setShowPreferencesModal] = useState(false)
  const [userPreferences, setUserPreferences] = useState("")
  const [savingPreferences, setSavingPreferences] = useState(false)

  const supabaseClientRef = useRef(createClient())

  // Очистка старого кеша при первой загрузке (одноразово)
  useEffect(() => {
    // Проверяем старый формат кеша и очищаем если нужно
    try {
      const cached = localStorage.getItem('ai-suggested-workout-cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        // Если есть старое поле lastWorkoutCount - очищаем кеш
        if ('lastWorkoutCount' in parsed) {
          console.log('🗑️ Clearing old AI cache format')
          localStorage.removeItem('ai-suggested-workout-cache')
        }
      }
    } catch (error) {
      console.error('Error checking cache:', error)
    }
  }, [])

  useEffect(() => {
    const supabase = supabaseClientRef.current
    let isMounted = true

    const mapWorkoutSets = (sets: WorkoutSetWithExercises[]): Preset[] => {
      return sets.map((preset) => {
        const sortedExercises = (preset.exercises || [])
          .slice()
          .sort((a, b) => a.order_index - b.order_index)
          .map((item) => {
            const exerciseName = item.exercise?.name ?? "Exercise"
            const normalizedName = exerciseName.trim().toLowerCase()
            const isWarmup =
              normalizedName === "workout" ||
              normalizedName.includes("warm")
            const displayName = normalizedName === "workout" ? "warm up" : exerciseName

            return {
              id: item.id,
              exerciseId: item.exercise?.id ?? null,
              name: displayName,
              sets: item.target_sets ?? null,
              warmupTime: isWarmup ? "10:00" : undefined,
              exercise_type: item.exercise?.exercise_type,
              movement_pattern: item.exercise?.movement_pattern,
              muscle_group: item.exercise?.muscle_group,
            }
          })

        const hasWarmupRow = sortedExercises.some((exercise) => exercise.warmupTime !== undefined)

        const exercises = hasWarmupRow
          ? sortedExercises
          : [
              {
                id: `warmup-${preset.id}`,
                exerciseId: null,
                name: "warm up",
                sets: null,
                warmupTime: "10:00",
                exercise_type: 'warmup',
                movement_pattern: 'complex',
                muscle_group: 'full_body',
              },
              ...sortedExercises,
            ]

        return {
          id: preset.id,
          label: preset.name,
          exercises,
        }
      })
    }

    const loadSetsForUser = async (userId: string) => {
      const { data, error: setsError } = await supabase
        .from("workout_sets")
        .select(
          `
            *,
            exercises:workout_set_exercises(
              *,
              exercise:exercises(*)
            )
          `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: true })

      if (setsError) {
        throw setsError
      }

      const typedData = (data ?? []) as unknown as WorkoutSetWithExercises[]
      const mappedPresets = mapWorkoutSets(typedData)

      if (isMounted) {
        setPresets(mappedPresets)
        setActivePreset((prev) => {
          if (prev && mappedPresets.some((preset) => preset.id === prev)) {
            return prev
          }
          return mappedPresets.length > 0 ? mappedPresets[0].id : null
        })
        setError(null)
      }
    }

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (!session?.user) {
          if (isMounted) {
            setPresets([])
            setActivePreset(null)
            setError("Please sign in to see your templates.")
          }
          return
        }

        await loadSetsForUser(session.user.id)
      } catch (err) {
        console.error(err)
        if (isMounted) {
          setError("Failed to load workout templates. Please try again later.")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    const {
      data: authSubscription,
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return

      if (!session?.user) {
        setPresets([])
        setActivePreset(null)
        setError("Please sign in to see your templates.")
        setLoading(false)
        return
      }

      setLoading(true)
      loadSetsForUser(session.user.id)
        .catch((err) => {
          console.error(err)
          setError("Failed to load workout templates. Please try again later.")
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false)
          }
        })
    })

    return () => {
      isMounted = false
      authSubscription?.subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    setEditingWarmupId(null)
    setWarmupInputValue("")
    setSwipedExerciseId(null)
    setSwipeDistance(0)
    
    // Load user preferences when switching to AI suggested tab
    if (activePreset === 'ai-suggested') {
      loadUserPreferences()
    }
  }, [activePreset])

  // Специальная обработка для AI suggested preset
  const isAISuggested = activePreset === 'ai-suggested'
  const activePresetData = isAISuggested 
    ? {
        id: 'ai-suggested',
        label: 'ai suggested',
        exercises: aiSuggestedExercises.length > 0 
          ? [
              {
                id: 'warmup-ai',
                exerciseId: null,
                name: "warm up",
                sets: null,
                warmupTime: "10:00",
                exercise_type: 'warmup' as const,
                movement_pattern: 'complex' as const,
                muscle_group: 'full_body' as const,
              },
              ...aiSuggestedExercises
            ]
          : [] // No warmup if not generated yet
      }
    : activePreset ? presets.find((p) => p.id === activePreset) : undefined
  
  const isStartDisabled = !activePresetData || activePresetData.exercises.length === 0

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!activePreset) return
    
    // Для AI suggested - удаляем из отдельного state
    if (isAISuggested) {
      setAiSuggestedExercises(prev => prev.filter(ex => ex.id !== exerciseId))
      setSwipedExerciseId(null)
      setSwipeDistance(0)
      return
    }
    
    const activePresetData = presets.find(p => p.id === activePreset)
    const exerciseToDelete = activePresetData?.exercises.find(ex => ex.id === exerciseId)
    
    // Удаляем из UI сразу для быстрого отклика
    setPresets((prev) =>
      prev.map((preset) =>
        preset.id === activePreset
          ? {
              ...preset,
              exercises: preset.exercises.filter((ex) => ex.id !== exerciseId),
            }
          : preset,
      ),
    )
    setSwipedExerciseId(null)
    setSwipeDistance(0)
    
    // Если это не warm up и не временное упражнение, удаляем из БД
    if (exerciseToDelete && !exerciseToDelete.id.startsWith('warmup-') && !exerciseToDelete.id.startsWith('temp-')) {
      try {
        await removeExerciseFromWorkoutSet(exerciseId)
      } catch (err) {
        console.error("Error deleting exercise from DB:", err)
        // Можно добавить toast уведомление об ошибке
      }
    }
  }

  const handleTouchStart = (e: React.TouchEvent, exerciseId: string, isWarmup: boolean) => {
    if (isWarmup) return // Не даем свайпать warm up
    setTouchStart(e.touches[0].clientX)
    setSwipedExerciseId(exerciseId)
  }

  const handleTouchMove = (e: React.TouchEvent, exerciseId: string, isWarmup: boolean) => {
    if (isWarmup || touchStart === null) return

    const touchCurrent = e.touches[0].clientX
    const diff = touchStart - touchCurrent

    // Only allow left swipe (positive diff), max 100px
    if (diff > 0) {
      setSwipeDistance(Math.min(diff, 100))
    } else if (diff < 0) {
      // Allow swipe back to close
      setSwipeDistance(Math.max(0, swipeDistance + diff * 0.5))
    }
  }

  const handleTouchEnd = (e: React.TouchEvent, exerciseId: string, isWarmup: boolean) => {
    if (isWarmup || touchStart === null) return

    // If swiped more than 80px (fully revealed), delete
    if (swipeDistance >= 80) {
      handleDeleteExercise(exerciseId)
    } else {
      // Otherwise reset with animation
      setSwipeDistance(0)
      setSwipedExerciseId(null)
    }

    setTouchStart(null)
  }
  
  // Загрузка списка всех упражнений
  const loadAvailableExercises = async () => {
    if (loadingExercises) return
    
    setLoadingExercises(true)
    try {
      const supabase = supabaseClientRef.current
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, instructions, exercise_type, movement_pattern, muscle_group")
        .order("name")
      
      if (error) throw error
      
      setAvailableExercises((data || []) as DbExercise[])
      setShowExerciseList(true)
    } catch (err) {
      console.error("Error loading exercises:", err)
    } finally {
      setLoadingExercises(false)
    }
  }
  
  // Добавление упражнения в текущий preset
  const handleAddExercise = async (exercise: DbExercise) => {
    if (!activePreset) return
    
    const newExercise: Exercise = {
      id: `temp-${Date.now()}`,
      exerciseId: exercise.id,
      name: exercise.name,
      sets: null,
      exercise_type: exercise.exercise_type,
      movement_pattern: exercise.movement_pattern,
      muscle_group: exercise.muscle_group,
    }
    
    // Для AI suggested - добавляем в отдельный state
    if (isAISuggested) {
      setAiSuggestedExercises(prev => [...prev, newExercise])
      setShowExerciseList(false)
      setModalSwipeDistance(0)
      setModalTouchStart(null)
      return
    }
    
    const activePresetData = presets.find(p => p.id === activePreset)
    const nextOrderIndex = activePresetData?.exercises.length || 0
    const tempId = newExercise.id
    
    // Добавляем в UI сразу для быстрого отклика
    setPresets((prev) =>
      prev.map((preset) =>
        preset.id === activePreset
          ? {
              ...preset,
              exercises: [...preset.exercises, newExercise],
            }
          : preset,
      ),
    )
    
    setShowExerciseList(false)
    setModalSwipeDistance(0)
    setModalTouchStart(null)
    
    // Сохраняем в БД
    try {
      const savedExercise = await addExerciseToWorkoutSet(
        activePreset,
        exercise.id,
        nextOrderIndex,
        { target_sets: 3 }
      )
      
      // Обновляем ID с временного на реальный
      setPresets((prev) =>
        prev.map((preset) =>
          preset.id === activePreset
            ? {
                ...preset,
                exercises: preset.exercises.map((ex) =>
                  ex.id === tempId ? { ...ex, id: savedExercise.id } : ex
                ),
              }
            : preset,
        ),
      )
    } catch (err) {
      console.error("Error adding exercise to DB:", err)
      // В случае ошибки удаляем упражнение из UI
      setPresets((prev) =>
        prev.map((preset) =>
          preset.id === activePreset
            ? {
                ...preset,
                exercises: preset.exercises.filter((ex) => ex.id !== tempId),
              }
            : preset,
        ),
      )
    }
  }

  const handleWarmupFocus = (exerciseId: string, currentTime: string) => {
    setEditingWarmupId(exerciseId)
    // Извлекаем минуты из формата MM:SS
    const minutes = currentTime.split(":")[0]
    setWarmupInputValue(minutes)
    // Select all при фокусе
    setTimeout(() => {
      warmupInputRef.current?.select()
    }, 0)
  }

  const handleWarmupBlur = (exerciseId: string) => {
    setEditingWarmupId(null)
    // Форматируем введенное значение в MM:SS
    const minutes = warmupInputValue || "10"
    const formattedTime = `${minutes.padStart(2, "0")}:00`
    
    // AI suggested preset не сохраняем в БД, просто в state
    // (пока что не обновляем для AI, так как warmup статичный)
    
    setPresets((prev) =>
      prev.map((preset) =>
        preset.id === activePreset
          ? {
              ...preset,
              exercises: preset.exercises.map((ex) =>
                ex.id === exerciseId ? { ...ex, warmupTime: formattedTime } : ex,
              ),
            }
          : preset,
      ),
    )
    setWarmupInputValue("")
  }

  const handleWarmupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Только цифры
    const value = e.target.value.replace(/\D/g, "")
    setWarmupInputValue(value)
  }

  const handleModalTouchStart = (e: React.TouchEvent) => {
    setModalTouchStart(e.touches[0].clientY)
  }

  const handleModalTouchMove = (e: React.TouchEvent) => {
    if (modalTouchStart === null) return

    const touchCurrent = e.touches[0].clientY
    const diff = touchCurrent - modalTouchStart

    // Only allow downward swipe (positive diff)
    if (diff > 0) {
      setModalSwipeDistance(diff)
    }
  }

  const handleModalTouchEnd = () => {
    if (modalTouchStart === null) return

    // If swiped more than 150px, close modal
    if (modalSwipeDistance > 150) {
      setShowExerciseList(false)
      setModalSwipeDistance(0)
    } else {
      // Otherwise reset with animation
      setModalSwipeDistance(0)
    }

    setModalTouchStart(null)
  }
  
  // Загрузка AI Suggested упражнений
  // Load user preferences from database
  const loadUserPreferences = async () => {
    try {
      const supabase = supabaseClientRef.current
      const {
        data: { session },
      } = await supabase.auth.getSession()
      
      if (!session?.user) return
      
      const { data } = await supabase
        .from('users')
        .select('training_preferences')
        .eq('id', session.user.id)
        .single()
      
      if (data?.training_preferences) {
        setUserPreferences(data.training_preferences)
      }
    } catch (error) {
      console.error('Error loading user preferences:', error)
    }
  }
  
  // Save user preferences to database
  const handleSavePreferences = async () => {
    setSavingPreferences(true)
    try {
      const supabase = supabaseClientRef.current
      const {
        data: { session },
      } = await supabase.auth.getSession()
      
      if (!session?.user) {
        console.error('No user session')
        return
      }
      
      const { error } = await supabase
        .from('users')
        .update({ training_preferences: userPreferences || null })
        .eq('id', session.user.id)
      
      if (error) {
        console.error('Error saving preferences:', error)
        return
      }
      
      setShowPreferencesModal(false)
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setSavingPreferences(false)
    }
  }
  
  // Generate workout using LLM
  const handleGenerateWorkout = async (adjustmentContext?: string) => {
    setAiLoading(true)
    setAiSuggestedExercises([]) // Clear previous results
    setAiOverallReasoning("")
    
    // Combine contexts if adjusting
    const contextToSend = adjustmentContext 
      ? `${aiLocalContext}\n\nAdjustment: ${adjustmentContext}`
      : aiLocalContext
    
    try {
      const response = await fetch('/api/ai-generate-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          localContext: contextToSend,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate workout')
      }
      
      const result = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response from server')
      }
      
      // Transform result to Exercise format for UI
      const exercises: Exercise[] = result.data.exercises.map((ex: {
        exerciseId: string
        name: string
        reasoning: string
        suggestedSets: number
        suggestedReps: string
        suggestedRestSeconds: number
      }, idx: number) => ({
        id: `ai-${idx}-${Date.now()}`,
        exerciseId: ex.exerciseId,
        name: ex.name,
        sets: ex.suggestedSets,
        exercise_type: 'weight',
        movement_pattern: 'complex',
        muscle_group: 'chest',
      }))
      
      setAiSuggestedExercises(exercises)
      setAiOverallReasoning(result.data.overallReasoning)
      setAiAdjustmentContext("") // Clear adjustment input after successful generation
      
      console.log('✅ AI workout generated:', {
        exercises: exercises.length,
        reasoning: result.data.overallReasoning
      })
    } catch (error) {
      console.error('Error generating workout:', error)
      
      // Show detailed error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to generate workout. Please try again.'
      
      // Create a more user-friendly error display
      const errorDetails = error instanceof Error && error.message.includes('GEMINI_API_KEY')
        ? '\n\nPlease add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file.\nSee ENV_SETUP_INSTRUCTIONS.md for details.'
        : ''
      
      alert(errorMessage + errorDetails)
    } finally {
      setAiLoading(false)
    }
  }
  
  // Создание нового сета
  const handleCreateNewSet = async () => {
    if (!newSetName.trim() || creatingSet) return
    
    setCreatingSet(true)
    try {
      const supabase = supabaseClientRef.current
      const {
        data: { session },
      } = await supabase.auth.getSession()
      
      if (!session?.user) {
        alert("Please sign in to create a set")
        return
      }
      
      const newSet = await createWorkoutSet(
        session.user.id,
        newSetName.trim(),
        "Custom workout set"
      )
      
      // Добавляем новый сет в список
      const newPreset: Preset = {
        id: newSet.id,
        label: newSet.name,
        exercises: [
          {
            id: `warmup-${newSet.id}`,
            exerciseId: null,
            name: "warm up",
            sets: null,
            warmupTime: "10:00",
            exercise_type: 'warmup',
            movement_pattern: 'complex',
            muscle_group: 'full_body',
          }
        ],
      }
      
      setPresets(prev => [...prev, newPreset])
      setActivePreset(newSet.id)
      setShowCreateSetModal(false)
      setNewSetName("")
    } catch (err) {
      console.error("Error creating set:", err)
      alert("Failed to create set. Please try again.")
    } finally {
      setCreatingSet(false)
    }
  }
  
  // Начать редактирование названия сета
  const handleStartEditingSetName = (setId: string, currentName: string) => {
    // Не даем редактировать AI suggested
    if (setId === 'ai-suggested') return
    
    setEditingSetId(setId)
    setEditingSetName(currentName)
    setTimeout(() => {
      setNameInputRef.current?.select()
    }, 0)
  }
  
  // Сохранить новое название сета
  const handleSaveSetName = async (setId: string) => {
    const newName = editingSetName.trim()
    if (!newName || newName === presets.find(p => p.id === setId)?.label) {
      setEditingSetId(null)
      setEditingSetName("")
      return
    }
    
    // Обновляем в UI сразу
    setPresets(prev => 
      prev.map(p => p.id === setId ? { ...p, label: newName } : p)
    )
    setEditingSetId(null)
    setEditingSetName("")
    
    // Сохраняем в БД
    try {
      const supabase = supabaseClientRef.current
      await supabase
        .from('workout_sets')
        .update({ name: newName })
        .eq('id', setId)
    } catch (err) {
      console.error("Error updating set name:", err)
      // В случае ошибки можно вернуть старое название
    }
  }


  return (
    <div className="min-h-screen bg-[#ffffff] flex justify-center p-[10px] relative">
      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[32px] leading-[120%] font-normal text-[#000000]">new workout</h1>
          <Link href="/">
            <button className="p-2" aria-label="Close">
              <X className="w-6 h-6 text-[#000000]" />
            </button>
          </Link>
        </div>

        {/* Preset Icons */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
          {/* AI Suggested Set */}
          <button
            onClick={() => setActivePreset('ai-suggested')}
            className={`
              flex-shrink-0 h-14 rounded-full flex items-center justify-center px-5 min-w-[56px] transition-all
              ${activePreset === 'ai-suggested' ? "bg-[#000000] text-[#ffffff]" : "bg-[#f7f7f7] text-[#000000]"}
              hover:opacity-80
            `}
            title="AI suggested workout"
          >
            <Sparkles className="w-6 h-6" />
          </button>
          
          {/* Existing presets */}
          {presets.map((preset) => {
            const isEditing = editingSetId === preset.id
            const label = preset.label.toLowerCase()
            
            return (
              <div
                key={preset.id}
                className="relative flex-shrink-0"
              >
                <div
                  className={`
                    h-14 rounded-full flex items-center justify-center px-5 min-w-[56px] transition-all
                    ${preset.id === activePreset ? "bg-[#000000] text-[#ffffff]" : "bg-[#f7f7f7] text-[#000000]"}
                    ${!isEditing && "hover:opacity-80 cursor-pointer"}
                  `}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        ref={setNameInputRef}
                        type="text"
                        value={editingSetName}
                        onChange={(e) => setEditingSetName(e.target.value)}
                        onBlur={() => handleSaveSetName(preset.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveSetName(preset.id)
                          } else if (e.key === 'Escape') {
                            setEditingSetId(null)
                            setEditingSetName("")
                          }
                        }}
                        className={`
                          bg-transparent outline-none text-[20px] leading-[120%] text-center px-1
                          ${preset.id === activePreset ? "text-[#ffffff]" : "text-[#000000]"}
                        `}
                        style={{ width: '80px' }}
                      />
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault() // Предотвращаем blur на input
                        }}
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (confirm(`delete "${preset.label}" set?`)) {
                            try {
                              const supabase = supabaseClientRef.current
                              await supabase
                                .from('workout_sets')
                                .delete()
                                .eq('id', preset.id)
                              
                              setPresets(prev => prev.filter(p => p.id !== preset.id))
                              setEditingSetId(null)
                              setEditingSetName("")
                              
                              // Если удалили активный - переключаемся на первый
                              if (activePreset === preset.id) {
                                const remaining = presets.filter(p => p.id !== preset.id)
                                setActivePreset(remaining.length > 0 ? remaining[0].id : null)
                              }
                            } catch (err) {
                              console.error('Error deleting set:', err)
                              alert('failed to delete set')
                            }
                          }
                        }}
                        className="p-1 hover:opacity-70"
                        title="Delete set"
                      >
                        <Trash2 className="w-4 h-4 text-[#ff2f00]" />
                      </button>
                    </div>
                  ) : (
                    <span
                      onClick={() => setActivePreset(preset.id)}
                      onDoubleClick={() => handleStartEditingSetName(preset.id, preset.label)}
                      className="text-[20px] leading-[120%] lowercase select-none"
                    >
                      {label}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
          
          {/* Add New Set Button */}
          <button
            onClick={() => setShowCreateSetModal(true)}
            className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center bg-[#f7f7f7] text-[#000000] hover:bg-[#e0e0e0] transition-colors"
            title="Create new set"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Exercise List */}
        <div className={`space-y-0 mb-[200px] ${!isAISuggested && "border-t border-[rgba(0,0,0,0.1)]"}`}>
          {/* AI Suggested - no content at top, everything is at bottom */}
          
          {/* AI Loading State */}
          {isAISuggested && aiLoading && (
            <div className="py-12 text-center text-[16px] leading-[140%] text-[rgba(0,0,0,0.4)]">
              <div className="animate-pulse">generating workout...</div>
              <div className="text-[12px] mt-2">analyzing your training data</div>
            </div>
          )}
          
          {/* AI Generated Exercises + Reasoning */}
          {isAISuggested && aiSuggestedExercises.length > 0 && !aiLoading && (
            <div className="py-4">
              {/* Overall Reasoning - minimal styling */}
              {aiOverallReasoning && (
                <div className="mb-4">
                  <div className="text-[12px] leading-[140%] text-[rgba(0,0,0,0.5)] mb-1">
                    today
                  </div>
                  <div className="text-[14px] leading-[140%] text-[#000000]">
                    {aiOverallReasoning}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {loading ? (
            <div className="py-12 text-center text-[16px] leading-[140%] text-[rgba(0,0,0,0.4)]">
              Loading templates...
            </div>
          ) : error ? (
            <div className="py-12 text-center text-[16px] leading-[140%] text-[#ff2f00]">
              {error}
            </div>
          ) : !activePresetData ? (
            <div className="py-12 text-center text-[16px] leading-[140%] text-[rgba(0,0,0,0.4)]">
              No templates found. Create a new set in the app.
            </div>
          ) : activePresetData.exercises.length === 0 ? (
            <>
              {/* Don't show empty state for AI suggested before generation */}
              {!isAISuggested && (
                <>
                  <div className="py-12 text-center text-[16px] leading-[140%] text-[rgba(0,0,0,0.4)]">
                    No exercises in this template yet.
                  </div>
                  
                  {/* Кнопка добавления упражнения */}
                  <button
                    onClick={loadAvailableExercises}
                    disabled={loadingExercises}
                    className="flex items-center justify-between py-5 border-b border-[rgba(0,0,0,0.1)] bg-[#ffffff] w-full text-left hover:bg-[#f7f7f7] transition-colors disabled:opacity-50"
                  >
                    <span className="text-[20px] leading-[120%] text-[rgba(0,0,0,0.5)]">
                      {loadingExercises ? "Loading..." : "+ add exercise"}
                    </span>
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {activePresetData.exercises.map((exercise) => {
                const isWarmup = exercise.warmupTime !== undefined
                const currentSwipe = swipedExerciseId === exercise.id ? swipeDistance : 0
                
                return (
                  <div
                    key={exercise.id}
                    className="relative overflow-hidden border-b border-[rgba(0,0,0,0.1)] group"
                    onTouchStart={(e) => handleTouchStart(e, exercise.id, isWarmup)}
                    onTouchMove={(e) => handleTouchMove(e, exercise.id, isWarmup)}
                    onTouchEnd={(e) => handleTouchEnd(e, exercise.id, isWarmup)}
                  >
                    {/* Красная кнопка удаления позади (swipe на мобиле) */}
                    {!isWarmup && (
                      <div 
                        className="absolute right-0 top-0 h-full bg-[#ff2f00] flex items-center justify-center transition-all"
                        style={{
                          width: `${currentSwipe}px`,
                          opacity: Math.min(currentSwipe / 80, 1),
                        }}
                      >
                        <Trash2 
                          className="w-6 h-6 text-[#ffffff]"
                          style={{
                            opacity: Math.min(currentSwipe / 60, 1),
                            transform: `scale(${Math.min(currentSwipe / 80, 1)})`,
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Строка упражнения */}
                    <div
                      className="flex items-center justify-between py-5 bg-[#ffffff] relative z-10"
                      style={{
                        transform: `translateX(-${currentSwipe}px)`,
                        transition: touchStart === null ? 'transform 0.3s ease-out' : 'none',
                      }}
                    >
                      <span className="text-[20px] leading-[120%] text-[#000000]">{exercise.name}</span>
                      
                      <div className="flex items-center gap-3">
                        {isWarmup ? (
                          <input
                            ref={warmupInputRef}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={editingWarmupId === exercise.id ? warmupInputValue : exercise.warmupTime || "10:00"}
                            onChange={handleWarmupChange}
                            onFocus={() => handleWarmupFocus(exercise.id, exercise.warmupTime || "10:00")}
                            onBlur={() => handleWarmupBlur(exercise.id)}
                            className="text-[20px] leading-[120%] text-[#000000] bg-transparent outline-none text-right w-[80px]"
                          />
                        ) : (
                          /* Иконка удаления по hover на десктопе */
                          <button
                            onClick={() => handleDeleteExercise(exercise.id)}
                            className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-[rgba(255,47,0,0.1)] rounded-lg"
                            aria-label="Delete exercise"
                          >
                            <Trash2 className="w-5 h-5 text-[#ff2f00]" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {/* Кнопка добавления упражнения - show after AI generation */}
              {(!isAISuggested || (isAISuggested && aiSuggestedExercises.length > 0)) && (
                <button
                  onClick={loadAvailableExercises}
                  disabled={loadingExercises}
                  className="flex items-center justify-between py-5 border-b border-[rgba(0,0,0,0.1)] bg-[#ffffff] w-full text-left hover:bg-[#f7f7f7] transition-colors disabled:opacity-50"
                >
                  <span className="text-[20px] leading-[120%] text-[rgba(0,0,0,0.5)]">
                    {loadingExercises ? "Loading..." : "+ add exercise"}
                  </span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Fixed Bottom Button Area */}
        <div className="fixed bottom-[10px] left-0 right-0 flex justify-center pointer-events-none z-50">
          <div className="w-full max-w-md px-[10px] pointer-events-auto">
            <div
              className="absolute inset-x-0 bottom-0 h-[200px] -z-10"
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                maskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
              }}
            />

            <div className="space-y-3">
              {/* AI Input + Generate Button (shown when no workout generated yet) */}
              {isAISuggested && aiSuggestedExercises.length === 0 && !aiLoading && (
                <>
                  {/* User Preferences Link above input, aligned right */}
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => setShowPreferencesModal(true)}
                      className="text-[14px] leading-[140%] text-[rgba(0,0,0,0.6)] underline hover:text-[#000000] transition-colors"
                    >
                      edit preferences
                    </button>
                  </div>
                  
                  {/* Local Context Input */}
                  <textarea
                    value={aiLocalContext}
                    onChange={(e) => setAiLocalContext(e.target.value)}
                    placeholder="tell me how you're feeling today, what's coming up, or any context i should know - and i'll help you plan your workout"
                    className="w-full min-h-[160px] px-4 py-3 bg-[#f7f7f7] rounded-[20px] text-[16px] leading-[140%] text-[#000000] placeholder:text-[rgba(0,0,0,0.3)] outline-none resize-none"
                  />
                  
                  <button
                    onClick={() => handleGenerateWorkout()}
                    disabled={aiLoading}
                    className="w-full text-[#000000] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal hover:opacity-90 transition-opacity disabled:opacity-40"
                    style={{
                      background: 'linear-gradient(135deg, #ff0080 0%, #ff0000 10%, #ff8c00 20%, #ffd700 30%, #00ff00 40%, #00ffff 50%, #0080ff 60%, #8000ff 70%, #ff00ff 80%, #ff0080 90%, #ff0000 100%)',
                      backgroundSize: '300% 300%',
                    }}
                  >
                    generate workout
                  </button>
                </>
              )}
              
              {/* Adjust Workout Input (shown after AI generation, above Start button) */}
              {isAISuggested && aiSuggestedExercises.length > 0 && (
                <div className="relative w-full">
                  <input
                    type="text"
                    value={aiAdjustmentContext}
                    onChange={(e) => setAiAdjustmentContext(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && aiAdjustmentContext.trim()) {
                        handleGenerateWorkout(aiAdjustmentContext)
                      }
                    }}
                    placeholder="type to adjust your workout"
                    className="w-full bg-[#ffffff] text-[#000000] py-4 pl-4 pr-12 rounded-[60px] text-[16px] leading-[120%] font-normal border-2 border-[#000000] outline-none focus:bg-[#f7f7f7] transition-colors placeholder:text-[rgba(0,0,0,0.3)]"
                  />
                  <button
                    onClick={() => {
                      if (aiAdjustmentContext.trim()) {
                        handleGenerateWorkout(aiAdjustmentContext)
                      }
                    }}
                    disabled={!aiAdjustmentContext.trim()}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(0,0,0,0.3)] hover:text-[#000000] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Adjust workout"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </div>
              )}
              
              {/* Start Button (hidden when AI not generated yet) */}
              {(!isAISuggested || aiSuggestedExercises.length > 0) && (
                <button
                  onClick={() => {
                    if (isStartDisabled) return
                  
                  // Генерируем уникальный ID для тренировки (timestamp + random)
                  const workoutId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                  
                  // Очищаем предыдущее состояние тренировки
                  localStorage.removeItem("workoutState")
                  
                  // Подготавливаем данные для тренировки
                  const warmupExercise = activePresetData?.exercises.find((ex) => ex.warmupTime !== undefined)
                  const warmupMinutes = warmupExercise?.warmupTime
                    ? parseInt(warmupExercise.warmupTime.split(":")[0])
                    : 10
                  localStorage.setItem("workoutWarmupMinutes", warmupMinutes.toString())
                  
                  // Сохраняем выбранные упражнения (без warm up)
                  const selectedExercises = activePresetData.exercises
                    .filter((ex) => ex.warmupTime === undefined)
                    .map((ex) => ({
                      id: ex.exerciseId ?? ex.id,
                      exerciseId: ex.exerciseId ?? null,
                      workoutEntryId: ex.id,
                      name: ex.name,
                      sets: ex.sets,
                      instructions: ex.instructions,
                      exercise_type: ex.exercise_type,
                      movement_pattern: ex.movement_pattern,
                      muscle_group: ex.muscle_group,
                    }))
                  
                  localStorage.setItem("workoutExercises", JSON.stringify(selectedExercises))
                  localStorage.setItem("workoutSetId", activePreset || "")
                  
                  // Сохраняем ID тренировки
                  localStorage.setItem("currentWorkoutId", workoutId)
                  
                  // Переходим на страницу тренировки с уникальным ID
                  window.location.href = `/workout/${workoutId}`
                }}
                  disabled={isStartDisabled}
                  className={`w-full bg-[#000000] text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal transition-opacity ${
                    isStartDisabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-90"
                  }`}
                >
                  start
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Модальное окно со списком упражнений */}
        {showExerciseList && (
          <>
            <div 
              className="fixed inset-0 bg-[rgba(0,0,0,0.3)] z-[60]" 
              onClick={() => {
                setShowExerciseList(false)
                setModalSwipeDistance(0)
              }} 
            />
            <div 
              className="fixed bottom-0 left-0 right-0 z-[70] bg-[#ffffff] rounded-t-[30px] shadow-2xl animate-slide-up max-h-[80vh] flex flex-col overflow-hidden"
              style={{
                transform: `translateY(${modalSwipeDistance}px)`,
                transition: modalTouchStart === null ? 'transform 0.3s ease-out' : 'none',
              }}
              onTouchStart={handleModalTouchStart}
              onTouchMove={handleModalTouchMove}
              onTouchEnd={handleModalTouchEnd}
            >
              <div className="w-full max-w-md mx-auto flex-1 flex flex-col overflow-hidden">
                <ExerciseSelector
                  exercises={availableExercises}
                  isLoading={loadingExercises}
                  onSelectExercise={handleAddExercise}
                />
              </div>
            </div>
          </>
        )}

        {showAdjustOverlay && (
          <>
            <div className="fixed inset-0 bg-[rgba(0,0,0,0.3)] z-[60]" onClick={() => setShowAdjustOverlay(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-[70] bg-[#ffffff] rounded-t-[30px] shadow-2xl animate-slide-up">
              <div className="w-full max-w-md mx-auto p-6">
                <div className="flex items-center gap-2 mb-6 bg-[#f7f7f7] rounded-[20px] px-4 py-3">
                  <span className="text-[#000000] text-[16px]">+</span>
                  <input
                    type="text"
                    placeholder="adjust workout"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    autoFocus
                    className="flex-1 bg-transparent outline-none text-[16px] leading-[120%] text-[#000000] placeholder:text-[rgba(0,0,0,0.3)]"
                  />
                  <button className="p-1">
                    <Mic className="w-5 h-5 text-[rgba(0,0,0,0.5)]" />
                  </button>
                </div>

                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setShowAdjustOverlay(false)}
                    className="px-6 py-3 bg-[#000000] text-[#ffffff] rounded-[60px] text-[16px] leading-[120%]"
                  >
                    done
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Модальное окно создания нового сета */}
        {showCreateSetModal && (
          <>
            <div 
              className="fixed inset-0 bg-[rgba(0,0,0,0.3)] z-[60]" 
              onClick={() => {
                setShowCreateSetModal(false)
                setNewSetName("")
              }} 
            />
            <div className="fixed bottom-0 left-0 right-0 z-[70] bg-[#ffffff] rounded-t-[30px] shadow-2xl animate-slide-up">
              <div className="w-full max-w-md mx-auto p-6">
                <h2 className="text-[24px] leading-[120%] font-normal text-[#000000] mb-6">
                  create new set
                </h2>
                
                <div className="mb-6">
                  <label className="block text-[14px] leading-[140%] text-[rgba(0,0,0,0.6)] mb-2">
                    set name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. upper body, legs, full body..."
                    value={newSetName}
                    onChange={(e) => setNewSetName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSetName.trim()) {
                        handleCreateNewSet()
                      }
                    }}
                    autoFocus
                    className="w-full bg-[#f7f7f7] rounded-[12px] px-4 py-3 text-[16px] leading-[120%] text-[#000000] placeholder:text-[rgba(0,0,0,0.3)] outline-none focus:ring-2 focus:ring-[#000000] lowercase"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCreateSetModal(false)
                      setNewSetName("")
                    }}
                    className="flex-1 px-6 py-3 bg-[#f7f7f7] text-[#000000] rounded-[60px] text-[16px] leading-[120%] hover:bg-[#e0e0e0] transition-colors"
                  >
                    cancel
                  </button>
                  <button
                    onClick={handleCreateNewSet}
                    disabled={!newSetName.trim() || creatingSet}
                    className="flex-1 px-6 py-3 bg-[#000000] text-[#ffffff] rounded-[60px] text-[16px] leading-[120%] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {creatingSet ? "creating..." : "create"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Модальное окно редактирования preferences */}
        {showPreferencesModal && (
          <>
            <div 
              className="fixed inset-0 bg-[rgba(0,0,0,0.3)] z-[60]" 
              onClick={() => setShowPreferencesModal(false)} 
            />
            <div className="fixed bottom-0 left-0 right-0 z-[70] bg-[#ffffff] rounded-t-[30px] shadow-2xl animate-slide-up max-h-[80vh] flex flex-col">
              <div className="w-full max-w-md mx-auto p-6 flex-1 flex flex-col">
                <h2 className="text-[24px] leading-[120%] font-normal text-[#000000] mb-2">
                  training preferences
                </h2>
                
                <p className="text-[14px] leading-[140%] text-[rgba(0,0,0,0.6)] mb-6">
                  describe your permanent training preferences, goals, limitations, or any context the ai should always consider
                </p>
                
                <div className="mb-6 flex-1">
                  <textarea
                    value={userPreferences}
                    onChange={(e) => setUserPreferences(e.target.value)}
                    placeholder="e.g. focus on strength training, avoid exercises with heavy shoulder load due to past injury, prefer compound movements..."
                    className="w-full min-h-[200px] bg-[#f7f7f7] rounded-[12px] px-4 py-3 text-[16px] leading-[140%] text-[#000000] placeholder:text-[rgba(0,0,0,0.3)] outline-none focus:ring-2 focus:ring-[#000000] resize-none"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPreferencesModal(false)}
                    className="flex-1 px-6 py-3 bg-[#f7f7f7] text-[#000000] rounded-[60px] text-[16px] leading-[120%] hover:bg-[#e0e0e0] transition-colors"
                  >
                    cancel
                  </button>
                  <button
                    onClick={handleSavePreferences}
                    disabled={savingPreferences}
                    className="flex-1 px-6 py-3 bg-[#000000] text-[#ffffff] rounded-[60px] text-[16px] leading-[120%] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {savingPreferences ? "saving..." : "save"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
