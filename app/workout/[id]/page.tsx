"use client"

import { useState, useEffect, ChangeEvent, useRef, FocusEvent } from "react"
import Link from "next/link"
import { X } from "lucide-react"

type WorkoutStage = "warmup" | "exercise-warmup" | "working-set" | "rest" | "finished"

export default function WorkoutSession() {
  // Читаем время разминки из localStorage
  const getInitialWarmupTime = () => {
    if (typeof window === "undefined") return 599
    const savedMinutes = localStorage.getItem("workoutWarmupMinutes")
    return savedMinutes ? parseInt(savedMinutes) * 60 - 1 : 599
  }

  // Загружаем сохраненное состояние тренировки
  const loadWorkoutState = () => {
    if (typeof window === "undefined") return null
    const saved = localStorage.getItem("workoutState")
    return saved ? JSON.parse(saved) : null
  }

  const savedState = loadWorkoutState()

  const [stage, setStage] = useState<WorkoutStage>(savedState?.stage || "warmup")
  const [currentExercise, setCurrentExercise] = useState(savedState?.currentExercise || 0)
  const [currentSet, setCurrentSet] = useState(savedState?.currentSet || 1)
  const [totalTime, setTotalTime] = useState(savedState?.totalTime || 0)
  const [warmupTime, setWarmupTime] = useState(savedState?.warmupTime || getInitialWarmupTime())
  const [restTime, setRestTime] = useState(savedState?.restTime || 119)
  const [isWorkoutActive, setIsWorkoutActive] = useState(savedState?.isWorkoutActive ?? true)

  const [weight, setWeight] = useState(savedState?.weight || "30")
  const [reps, setReps] = useState(savedState?.reps || "10")
  const [isEditingWeight, setIsEditingWeight] = useState(false)
  const [isEditingReps, setIsEditingReps] = useState(false)
  
  // История выполненных подходов: { exerciseIndex: [{ set: 1, weight: "30", reps: "10" }, ...] }
  const [completedSets, setCompletedSets] = useState<Record<number, Array<{ set: number; weight: string; reps: string }>>>(
    savedState?.completedSets || {}
  )

  const weightInputRef = useRef<HTMLInputElement | null>(null)
  const repsInputRef = useRef<HTMLInputElement | null>(null)
  const lastScrollYRef = useRef<number | null>(null)

  // Сохраняем состояние тренировки при каждом изменении
  useEffect(() => {
    const workoutState = {
      stage,
      currentExercise,
      currentSet,
      totalTime,
      warmupTime,
      restTime,
      isWorkoutActive,
      weight,
      reps,
      completedSets,
    }
    localStorage.setItem("workoutState", JSON.stringify(workoutState))
  }, [stage, currentExercise, currentSet, totalTime, warmupTime, restTime, isWorkoutActive, weight, reps, completedSets])

  useEffect(() => {
    if (!isWorkoutActive) return

    const interval = setInterval(() => {
      setTotalTime((prev: number) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isWorkoutActive])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (stage === "warmup" && warmupTime > 0) {
      interval = setInterval(() => {
        setWarmupTime((prev: number) => prev - 1)
      }, 1000)
    }

    if (stage === "rest" && restTime > 0) {
      interval = setInterval(() => {
        setRestTime((prev: number) => prev - 1)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [stage, warmupTime, restTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleNumericInput =
    (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
      const cleanedValue = event.target.value.replace(/\D/g, "")
      setter(cleanedValue)
    }

  const ensureInputVisible = (input: HTMLInputElement | null) => {
    if (!input || typeof window === "undefined") return

    const visualViewport = window.visualViewport
    const viewportHeight = visualViewport?.height ?? window.innerHeight
    const viewportOffsetTop = visualViewport?.offsetTop ?? 0
    const keyboardPadding = 96
    const topPadding = 24

    const prefersCenteredScroll = Boolean(
      visualViewport && typeof visualViewport.height === "number" && visualViewport.height < window.innerHeight,
    )

    const rect = input.getBoundingClientRect()

    if (prefersCenteredScroll) {
      input.scrollIntoView({
        block: "center",
        behavior: "smooth",
      })
    } else if (rect.bottom > viewportHeight - keyboardPadding) {
      const offset = rect.bottom - (viewportHeight - keyboardPadding)
      window.scrollTo({
        top: window.scrollY + offset,
        behavior: "smooth",
      })
    } else if (rect.top < viewportOffsetTop + topPadding) {
      const offset = rect.top - (viewportOffsetTop + topPadding)
      window.scrollTo({
        top: window.scrollY + offset,
        behavior: "smooth",
      })
    }

    if (visualViewport) {
      const handleViewportChange = () => {
        input.scrollIntoView({
          block: "center",
          behavior: "smooth",
        })
      }

      visualViewport.addEventListener("resize", handleViewportChange, { once: true })
    }
  }

  const focusEditableInput = (input: HTMLInputElement | null) => {
    if (!input) return
    if (typeof window !== "undefined") {
      lastScrollYRef.current = window.scrollY
    }

    try {
      input.focus({ preventScroll: true })
    } catch {
      input.focus()
    }

    requestAnimationFrame(() => {
      input.select()
    })

    window.setTimeout(() => {
      ensureInputVisible(input)
    }, 50)
  }

  useEffect(() => {
    if (isEditingWeight) {
      focusEditableInput(weightInputRef.current)
    }
  }, [isEditingWeight])

  useEffect(() => {
    if (isEditingReps) {
      focusEditableInput(repsInputRef.current)
    }
  }, [isEditingReps])

  const handleInputFocus = (event: FocusEvent<HTMLInputElement>) => {
    if (typeof window !== "undefined") {
      lastScrollYRef.current = window.scrollY
    }

    requestAnimationFrame(() => {
      event.target.select()
    })

    window.setTimeout(() => {
      ensureInputVisible(event.target)
    }, 50)
  }

  const handleInputBlur = (setter: (value: boolean) => void) => () => {
    setter(false)

    window.setTimeout(() => {
      if (typeof window === "undefined") return
      if (
        typeof document !== "undefined" &&
        (document.activeElement === weightInputRef.current || document.activeElement === repsInputRef.current)
      ) {
        return
      }
      if (lastScrollYRef.current === null) return

      window.scrollTo({
        top: lastScrollYRef.current,
        behavior: "smooth",
      })

      lastScrollYRef.current = null
    }, 180)
  }

  const isEditingValues = isEditingWeight || isEditingReps
  const bottomWrapperClasses = `${
    isEditingValues ? "relative" : "fixed bottom-[10px]"
  } left-0 right-0 flex justify-center pointer-events-none z-50`

  const exercises = [
    {
      name: "warm up",
      instructions: "jumping jacks × 20\njump, spreading your legs to the sides, clap your hands overhead",
    },
    {
      name: "deadlift",
      instructions:
        "1. the barbell is on the floor – bend down, grab it, and stand up, as if lifting a heavy box from the ground\n2. push the floor with your legs, let the bar slide up along your shins\n3. chest forward, back straight, hips back – don't bend your elbows",
    },
    {
      name: "bench press",
      instructions:
        "1. lie on a bench, hold the bar above your chest with straight arms\n2. slowly lower it to your chest\n3. push it back up while keeping your back flat and feet on the floor",
    },
  ]

  const finishWorkout = () => {
    setIsWorkoutActive(false)
    setStage("finished")
    // Очищаем сохраненное состояние тренировки
    localStorage.removeItem("workoutState")
  }

  const skipRest = () => {
    setStage("working-set")
    setRestTime(119)
  }

  // Warmup Stage
  if (stage === "warmup") {
    return (
      <div className="min-h-screen bg-[#ffffff] flex flex-col p-[10px]">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4 text-[16px] leading-[120%]">
            <span className="text-[#000000]">{formatTime(totalTime)}</span>
            <button onClick={finishWorkout} className="text-[#000000]">
              finish
            </button>
          </div>

          <div className="mb-8">
            <h1 className="text-[60px] leading-[110%] font-normal text-[#000000]">warm up</h1>
            <p className="text-[60px] leading-[110%] font-normal text-[#ff2f00]">{formatTime(warmupTime)}</p>
          </div>

          <div className="mb-8">
            <p className="text-[20px] leading-[120%] text-[#000000] whitespace-pre-line">{exercises[0].instructions}</p>
          </div>

          <div className="flex-1"></div>

          <div className="fixed bottom-[10px] left-0 right-0 flex justify-center z-50">
            <div className="w-full max-w-md px-[10px]">
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
                <button className="w-full bg-[#ffffff] text-[#000000] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] hover:bg-[rgba(0,0,0,0.02)]">
                  shuffle
                </button>
                <button
                  onClick={() => setStage("exercise-warmup")}
                  className="w-full bg-[#000000] text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal hover:opacity-90"
                >
                  next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Exercise Warmup Stage
  if (stage === "exercise-warmup") {
    return (
      <div className="min-h-screen bg-[#ffffff] flex flex-col p-[10px]">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4 text-[16px] leading-[120%]">
            <span className="text-[#000000]">{formatTime(totalTime)}</span>
            <button onClick={finishWorkout} className="text-[#000000]">
              finish
            </button>
          </div>

          <div className="mb-8">
            <h1 className="text-[60px] leading-[110%] font-normal text-[#000000]">
              {exercises[currentExercise + 1]?.name || "deadlift"}
            </h1>
            <p className="text-[60px] leading-[110%] font-normal text-[#ff2f00]">×{currentSet}</p>
          </div>

          <div className="mb-8">
            <p className="text-[20px] leading-[120%] text-[#000000] whitespace-pre-line">{exercises[1].instructions}</p>
          </div>

          <div className="flex-1"></div>

          <div className={bottomWrapperClasses}>
            <div className="w-full max-w-md px-[10px] pointer-events-auto relative">
              <div
                className="absolute inset-x-0 bottom-0 h-[250px] -z-10 pointer-events-none"
                style={{
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  maskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
                  WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
                }}
              />

              <div className="space-y-3 mb-3">
                {isEditingWeight ? (
                  <input
                    type="text"
                    value={weight}
                    onChange={handleNumericInput(setWeight)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur(setIsEditingWeight)}
                    ref={weightInputRef}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full bg-[#ffffff] text-[#000000] py-5 px-6 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] outline-none text-center"
                  />
                ) : (
                  <button
                    onClick={() => setIsEditingWeight(true)}
                    className="w-full bg-[#ffffff] text-[#000000] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)]"
                  >
                    {weight} kg
                  </button>
                )}

                {isEditingReps ? (
                  <input
                    type="text"
                    value={reps}
                    onChange={handleNumericInput(setReps)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur(setIsEditingReps)}
                    ref={repsInputRef}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full bg-[#ffffff] text-[#000000] py-5 px-6 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] outline-none text-center"
                  />
                ) : (
                  <button
                    onClick={() => setIsEditingReps(true)}
                    className="w-full bg-[#ffffff] text-[#000000] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)]"
                  >
                    {reps} times
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Сохраняем выполненный подход перед переходом к следующему упражнению
                    setCompletedSets((prev) => ({
                      ...prev,
                      [currentExercise]: [
                        ...(prev[currentExercise] || []),
                        { set: currentSet, weight, reps },
                      ],
                    }))
                    
                    setCurrentExercise(currentExercise + 1)
                    setCurrentSet(1)
                    setStage("exercise-warmup")
                  }}
                  className="flex-1 bg-[#000000] text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal hover:opacity-90"
                >
                  next exercise
                </button>
                <button
                  onClick={() => {
                    // Сохраняем выполненный подход перед переходом к отдыху
                    setCompletedSets((prev) => ({
                      ...prev,
                      [currentExercise]: [
                        ...(prev[currentExercise] || []),
                        { set: currentSet, weight, reps },
                      ],
                    }))
                    
                    setCurrentSet(currentSet + 1)
                    setStage("rest")
                  }}
                  className="flex-1 bg-[#ff2f00] text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal hover:opacity-90"
                >
                  one more
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Rest Stage
  if (stage === "rest") {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col p-[10px]">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4 text-[16px] leading-[120%]">
            <span className="text-[rgba(255,255,255,0.3)]">{formatTime(totalTime)}</span>
            <button onClick={skipRest} className="text-[#ffffff]">
              skip
            </button>
          </div>

          <div className="mb-8">
            <h1 className="text-[60px] leading-[110%] font-normal text-[#ffffff]">rest</h1>
            <p className="text-[60px] leading-[110%] font-normal text-[#ff2f00]">{formatTime(restTime)}</p>
          </div>

          <div className="flex-1"></div>
        </div>
      </div>
    )
  }

  // Working Set Stage
  if (stage === "working-set") {
    return (
      <div className="min-h-screen bg-[#ffffff] flex flex-col p-[10px]">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4 text-[16px] leading-[120%]">
            <span className="text-[#000000]">{formatTime(totalTime)}</span>
            <button onClick={finishWorkout} className="text-[#000000]">
              finish
            </button>
          </div>

          <div className="mb-8">
            <h1 className="text-[60px] leading-[110%] font-normal text-[#000000]">
              {exercises[currentExercise + 1]?.name || "deadlift"}
            </h1>
            <p className="text-[60px] leading-[110%] font-normal text-[#ff2f00]">×{currentSet}</p>
          </div>

          <div className="mb-8">
            <p className="text-[20px] leading-[120%] text-[#000000] whitespace-pre-line">{exercises[1].instructions}</p>
          </div>

          <div className="flex-1"></div>

          <div className={bottomWrapperClasses}>
            <div className="w-full max-w-md px-[10px] pointer-events-auto relative">
              <div
                className="absolute inset-x-0 bottom-0 h-[250px] -z-10 pointer-events-none"
                style={{
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  maskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
                  WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
                }}
              />

              <div className="space-y-3 mb-3">
                {isEditingWeight ? (
                  <input
                    type="text"
                    value={weight}
                    onChange={handleNumericInput(setWeight)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur(setIsEditingWeight)}
                    ref={weightInputRef}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full bg-[#ffffff] text-[#000000] py-5 px-6 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] outline-none text-center"
                  />
                ) : (
                  <button
                    onClick={() => setIsEditingWeight(true)}
                    className="w-full bg-[#ffffff] text-[#000000] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)]"
                  >
                    {weight} kg
                  </button>
                )}

                {isEditingReps ? (
                  <input
                    type="text"
                    value={reps}
                    onChange={handleNumericInput(setReps)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur(setIsEditingReps)}
                    ref={repsInputRef}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full bg-[#ffffff] text-[#000000] py-5 px-6 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] outline-none text-center"
                  />
                ) : (
                  <button
                    onClick={() => setIsEditingReps(true)}
                    className="w-full bg-[#ffffff] text-[#000000] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)]"
                  >
                    {reps} times
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Сохраняем выполненный подход перед переходом к следующему упражнению
                    setCompletedSets((prev) => ({
                      ...prev,
                      [currentExercise]: [
                        ...(prev[currentExercise] || []),
                        { set: currentSet, weight, reps },
                      ],
                    }))
                    
                    setCurrentExercise(currentExercise + 1)
                    setCurrentSet(1)
                    setStage("exercise-warmup")
                  }}
                  className="flex-1 bg-[#000000] text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal hover:opacity-90"
                >
                  next exercise
                </button>
                <button
                  onClick={() => {
                    // Сохраняем выполненный подход перед переходом к отдыху
                    setCompletedSets((prev) => ({
                      ...prev,
                      [currentExercise]: [
                        ...(prev[currentExercise] || []),
                        { set: currentSet, weight, reps },
                      ],
                    }))
                    
                    setCurrentSet(currentSet + 1)
                    setStage("rest")
                  }}
                  className="flex-1 bg-[#ff2f00] text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal hover:opacity-90"
                >
                  one more
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (stage === "finished") {
    return (
      <div className="min-h-screen bg-[#ffffff] flex flex-col p-[10px] relative">
        <div className="fixed top-0 left-0 right-0 flex justify-center pointer-events-none z-10">
          <div
            className="w-full max-w-md px-[10px] flex justify-end pointer-events-auto"
            style={{ paddingTop: "calc(10px + env(safe-area-inset-top, 0px))" }}
          >
            <Link href="/">
              <button className="p-2" aria-label="Close">
                <X className="w-6 h-6 text-[#000000]" />
              </button>
            </Link>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto flex-1 flex flex-col pt-[80px]">
          <div
            className="flex-1 flex flex-col justify-end"
            style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="mb-8">
              <h1 className="text-[60px] leading-[110%] font-normal text-[#000000]">{formatTime(totalTime)}</h1>
            </div>

            <div className="mb-8 space-y-2">
              <div className="flex items-center justify-between py-4 border-b border-[rgba(0,0,0,0.1)]">
                <span className="text-[20px] leading-[120%] text-[#000000]">total workouts</span>
                <span className="text-[20px] leading-[120%] text-[#000000]">89</span>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-[rgba(0,0,0,0.1)]">
                <span className="text-[20px] leading-[120%] text-[#000000]">total weight</span>
                <span className="text-[20px] leading-[120%] text-[#000000]">1950 kg</span>
              </div>
              <div className="flex items-center justify-between py-4 border-[rgba(0,0,0,0.1)]">
                <span className="text-[20px] leading-[120%] text-[#000000]">deadlift new max</span>
                <span className="text-[20px] leading-[120%] text-[#000000]">90kg×10</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
