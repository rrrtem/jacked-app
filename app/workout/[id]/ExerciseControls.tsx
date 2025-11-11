import { useRef, useEffect, ChangeEvent, FocusEvent } from "react"
import { ArrowRight, X } from "lucide-react"
import type { ExerciseData } from "./types"
import { hasExerciseType } from "./utils"

type ExerciseControlsProps = {
  exercise: ExerciseData
  currentSet: number
  weight: string
  reps: string
  duration: string
  isEditingWeight: boolean
  isEditingReps: boolean
  isEditingDuration: boolean
  onWeightChange: (value: string) => void
  onRepsChange: (value: string) => void
  onDurationChange: (value: string) => void
  onEditingWeightChange: (editing: boolean) => void
  onEditingRepsChange: (editing: boolean) => void
  onEditingDurationChange: (editing: boolean) => void
  onCompleteSet: () => void
  onSkipSet: () => void
  onNextExercise: () => void
}

export function ExerciseControls({
  exercise,
  currentSet,
  weight,
  reps,
  duration,
  isEditingWeight,
  isEditingReps,
  isEditingDuration,
  onWeightChange,
  onRepsChange,
  onDurationChange,
  onEditingWeightChange,
  onEditingRepsChange,
  onEditingDurationChange,
  onCompleteSet,
  onSkipSet,
  onNextExercise,
}: ExerciseControlsProps) {

  const weightInputRef = useRef<HTMLInputElement | null>(null)
  const repsInputRef = useRef<HTMLInputElement | null>(null)
  const durationInputRef = useRef<HTMLInputElement | null>(null)
  const lastScrollYRef = useRef<number | null>(null)

  const isDurationExercise = hasExerciseType(exercise, "duration")
  const isWeightExercise = hasExerciseType(exercise, "weight")

  const handleNumericInput =
    (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
      const cleanedValue = event.target.value.replace(/\D/g, "")
      setter(cleanedValue)
    }

  const isEditingValues = isEditingWeight || isEditingReps || isEditingDuration

  const ensureInputVisible = (input: HTMLInputElement | null) => {
    if (!input || typeof window === "undefined") return

    const visualViewport = window.visualViewport
    const viewportHeight = visualViewport?.height ?? window.innerHeight
    const viewportOffsetTop = visualViewport?.offsetTop ?? 0
    const keyboardPadding = 96
    const topPadding = 24

    const prefersCenteredScroll = Boolean(
      visualViewport && typeof visualViewport.height === "number" && visualViewport.height < window.innerHeight
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
        (document.activeElement === weightInputRef.current ||
          document.activeElement === repsInputRef.current ||
          document.activeElement === durationInputRef.current)
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

  useEffect(() => {
    if (isEditingDuration) {
      focusEditableInput(durationInputRef.current)
    }
  }, [isEditingDuration])

  const resetInputsToZero = () => {
    onWeightChange("0")
    onRepsChange("0")
    onDurationChange("0")
    onEditingWeightChange(false)
    onEditingRepsChange(false)
    onEditingDurationChange(false)

    if (weightInputRef.current) {
      weightInputRef.current.blur()
    }
    if (repsInputRef.current) {
      repsInputRef.current.blur()
    }
    if (durationInputRef.current) {
      durationInputRef.current.blur()
    }
  }

  const bottomWrapperClasses = `${
    isEditingValues ? "relative" : "fixed bottom-[15px]"
  } left-0 right-0 flex justify-center pointer-events-none z-50`

  return (
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

        {isDurationExercise ? (
          <div className="mb-3">
            {isEditingDuration ? (
              <input
                type="text"
                value={duration}
                onChange={handleNumericInput(onDurationChange)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur(onEditingDurationChange)}
                ref={durationInputRef}
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full bg-[#ffffff] text-[#000000] py-5 px-6 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] outline-none text-center"
              />
            ) : (
              <button
                onClick={() => onEditingDurationChange(true)}
                className="w-full bg-[#ffffff] text-[#000000] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)]"
              >
                {duration} sec
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-[5px] mb-3">
            {isWeightExercise && (
              <div className="flex-1">
                {isEditingWeight ? (
                  <input
                    type="text"
                    value={weight}
                    onChange={handleNumericInput(onWeightChange)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur(onEditingWeightChange)}
                    ref={weightInputRef}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full bg-[#ffffff] text-[#000000] py-5 px-6 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] outline-none text-center"
                  />
                ) : (
                  <button
                    onClick={() => onEditingWeightChange(true)}
                    className="w-full bg-[#ffffff] text-[#000000] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)]"
                  >
                    {weight} kg
                  </button>
                )}
              </div>
            )}

            <div className="flex-1">
              {isEditingReps ? (
                <input
                  type="text"
                  value={reps}
                  onChange={handleNumericInput(onRepsChange)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur(onEditingRepsChange)}
                  ref={repsInputRef}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full bg-[#ffffff] text-[#000000] py-5 px-6 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] outline-none text-center"
                />
              ) : (
                <button
                  onClick={() => onEditingRepsChange(true)}
                  className="w-full bg-[#ffffff] text-[#000000] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)]"
                >
                  {reps} times
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-[5px]">
          <button
            onClick={() => {
              resetInputsToZero()
              onSkipSet()
            }}
            className="w-[64px] h-[64px] rounded-full bg-[#ffffff] border border-[rgba(0,0,0,0.1)] text-[#000000] flex items-center justify-center hover:bg-[rgba(0,0,0,0.02)]"
            aria-label="Skip set"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={onCompleteSet}
            className="flex-1 bg-[#ff2f00] text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal hover:opacity-90"
          >
            one more
          </button>
          <button
            onClick={onNextExercise}
            className="w-[64px] h-[64px] rounded-full bg-[#000000] text-[#ffffff] flex items-center justify-center hover:opacity-90"
            aria-label="Next exercise"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}

