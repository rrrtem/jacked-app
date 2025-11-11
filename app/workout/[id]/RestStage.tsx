import { WorkoutHeader } from "./WorkoutHeader"
import { formatTime } from "./utils"

type RestStageProps = {
  totalTime: number
  restTime: number
  onSkip: () => void
}

export function RestStage({ totalTime, restTime, onSkip }: RestStageProps) {
  return (
    <div className="min-h-screen bg-[#000000] flex flex-col p-[10px]">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4 text-[16px] leading-[120%]">
          <span className="text-[rgba(255,255,255,0.3)]">{formatTime(totalTime)}</span>
          <button onClick={onSkip} className="text-[#ffffff]">
            skip
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-[60px] leading-[110%] font-normal text-[#ffffff]">rest</h1>
          <p className="text-[60px] leading-[110%] font-normal text-[#ff2f00]">
            {formatTime(restTime)}
          </p>
        </div>

        <div className="flex-1"></div>
      </div>
    </div>
  )
}

