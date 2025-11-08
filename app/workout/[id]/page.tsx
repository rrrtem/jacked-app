"use client"

import { useState, useEffect, ChangeEvent, useRef, FocusEvent } from "react"
import Link from "next/link"

type WorkoutStage = "warmup" | "exercise-warmup" | "working-set" | "rest" | "finished"

export default function WorkoutSession() {
  const [stage, setStage] = useState<WorkoutStage>("warmup")
  const [currentExercise, setCurrentExercise] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [totalTime, setTotalTime] = useState(0)
  const [warmupTime, setWarmupTime] = useState(599)
  const [restTime, setRestTime] = useState(119)
  const [isWorkoutActive, setIsWorkoutActive] = useState(true)

  const [weight, setWeight] = useState("30")
  const [reps, setReps] = useState("10")
  const [isEditingWeight, setIsEditingWeight] = useState(false)
  const [isEditingReps, setIsEditingReps] = useState(false)

  const weightInputRef = useRef<HTMLInputElement | null>(null)
  const repsInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!isWorkoutActive) return

    const interval = setInterval(() => {
      setTotalTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isWorkoutActive])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (stage === "warmup" && warmupTime > 0) {
      interval = setInterval(() => {
        setWarmupTime((prev) => prev - 1)
      }, 1000)
    }

    if (stage === "rest" && restTime > 0) {
      interval = setInterval(() => {
        setRestTime((prev) => prev - 1)
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
    if (!input) return

    const prefersCenteredScroll =
      typeof window !== "undefined" &&
      typeof window.visualViewport !== "undefined" &&
      window.visualViewport?.height < window.innerHeight

    input.scrollIntoView({
      block: prefersCenteredScroll ? "center" : "nearest",
      behavior: "smooth",
    })

    if (typeof window !== "undefined" && window.visualViewport) {
      const handleViewportChange = () => {
        input.scrollIntoView({
          block: "center",
          behavior: "smooth",
        })
      }

      window.visualViewport.addEventListener("resize", handleViewportChange, { once: true })
    }
  }

  const focusEditableInput = (input: HTMLInputElement | null) => {
    if (!input) return

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
    requestAnimationFrame(() => {
      event.target.select()
    })

    window.setTimeout(() => {
      ensureInputVisible(event.target)
    }, 50)
  }

  const handleInputBlur = (setter: (value: boolean) => void) => () => {
    setter(false)
  }

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
                  adjust warm up
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

          <div className="fixed bottom-[10px] left-0 right-0 flex justify-center pointer-events-none z-50">
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

          <div className="fixed bottom-[10px] left-0 right-0 flex justify-center pointer-events-none z-50">
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
      <div className="min-h-screen bg-[#ffffff] flex flex-col p-[10px]">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4 text-[16px] leading-[120%]">
            <span className="text-[#000000]"></span>
          </div>

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

          <div className="flex-1"></div>

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
                <button className="w-full bg-[#000000] text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal hover:opacity-90 flex items-center justify-center gap-2">
                  take a selfie
                </button>
                <Link href="/">
                  <button className="w-full bg-[#000000] text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal hover:opacity-90">
                    close
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
