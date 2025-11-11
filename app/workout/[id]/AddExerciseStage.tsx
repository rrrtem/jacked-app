import { WorkoutHeader } from "./WorkoutHeader"
import { ExerciseSelector } from "@/components/ExerciseSelector"
import { formatTime } from "./utils"
import type { DbExercise } from "./types"

type AddExerciseStageProps = {
  totalTime: number
  availableExercises: DbExercise[]
  isLoadingExercises: boolean
  showExerciseList: boolean
  onCancel: () => void
  onBack: () => void
  onLoadExercises: () => void
  onSelectExercise: (exercise: DbExercise) => void
  onFinish: () => void
}

export function AddExerciseStage({
  totalTime,
  availableExercises,
  isLoadingExercises,
  showExerciseList,
  onCancel,
  onBack,
  onLoadExercises,
  onSelectExercise,
  onFinish,
}: AddExerciseStageProps) {
  if (showExerciseList) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex flex-col p-[10px]">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4 text-[16px] leading-[120%] flex-shrink-0">
            <span className="text-[#000000]">{formatTime(totalTime)}</span>
            <button onClick={onBack} className="text-[#000000]">
              back
            </button>
          </div>

          <ExerciseSelector
            exercises={availableExercises}
            isLoading={isLoadingExercises}
            onSelectExercise={onSelectExercise}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col p-[10px]">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4 text-[16px] leading-[120%]">
          <span className="text-[#000000]">{formatTime(totalTime)}</span>
          <button onClick={onCancel} className="text-[#000000]">
            cancel
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-[60px] leading-[110%] font-normal text-[#000000]">
            something else?
          </h1>
        </div>

        <div className="flex-1"></div>

        <div className="fixed bottom-[15px] left-0 right-0 flex justify-center z-50">
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
              <button
                onClick={onLoadExercises}
                disabled={isLoadingExercises}
                className={`w-full bg-[#ffffff] text-[#000000] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] hover:bg-[rgba(0,0,0,0.02)] ${
                  isLoadingExercises ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {isLoadingExercises ? "Loading..." : "add exercise"}
              </button>
              <button
                onClick={onFinish}
                className="w-full bg-[#000000] text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal hover:opacity-90"
              >
                finish workout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

