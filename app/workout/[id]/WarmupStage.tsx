import { WorkoutHeader } from "./WorkoutHeader"
import { formatTime } from "./utils"
import type { ExerciseData } from "./types"

type WarmupStageProps = {
  totalTime: number
  warmupTime: number
  warmupExercise: ExerciseData | null
  canShuffle: boolean
  isShuffleLoading: boolean
  onCancel: () => void
  onFinish: () => void
  onShuffle: () => void
  onNext: () => void
}

export function WarmupStage({
  totalTime,
  warmupTime,
  warmupExercise,
  canShuffle,
  isShuffleLoading,
  onCancel,
  onFinish,
  onShuffle,
  onNext,
}: WarmupStageProps) {
  const warmupDetailsText = warmupExercise
    ? `${warmupExercise.name}${warmupExercise.instructions ? `\n${warmupExercise.instructions}` : ""}`
    : "Warm-up exercise not found"

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col p-[10px]">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
        <WorkoutHeader
          totalTime={totalTime}
          onCancel={onCancel}
          onFinish={onFinish}
        />

        <div className="mb-8">
          <h1 className="text-[60px] leading-[110%] font-normal text-[#000000]">Warm Up</h1>
          <p className="text-[60px] leading-[110%] font-normal text-[#ff2f00]">
            {formatTime(warmupTime)}
          </p>
        </div>

        <div className="mb-8">
          <p className="text-[20px] leading-[120%] text-[#000000] whitespace-pre-line">
            {warmupDetailsText}
          </p>
        </div>

        <div className="flex-1"></div>

        <div className="fixed bottom-[25px] left-0 right-0 flex justify-center z-50">
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
                type="button"
                onClick={onShuffle}
                disabled={isShuffleLoading || !canShuffle}
                className={`w-full bg-[#ffffff] text-[#000000] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] hover:bg-[rgba(0,0,0,0.02)] ${
                  isShuffleLoading || !canShuffle ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                shuffle
              </button>
              <button
                onClick={onNext}
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

