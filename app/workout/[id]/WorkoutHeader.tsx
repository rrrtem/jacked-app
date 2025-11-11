import { formatTime } from "./utils"

type WorkoutHeaderProps = {
  totalTime: number
  onCancel: () => void
  onFinish: () => void
  variant?: "default" | "rest"
  showFinish?: boolean
}

export function WorkoutHeader({ 
  totalTime, 
  onCancel, 
  onFinish, 
  variant = "default",
  showFinish = true 
}: WorkoutHeaderProps) {
  const isRest = variant === "rest"
  
  return (
    <div className="flex items-center justify-between mb-4 text-[16px] leading-[120%]">
      <span className={isRest ? "text-[rgba(255,255,255,0.3)]" : "text-[#000000]"}>
        {formatTime(totalTime)}
      </span>
      <div className="flex items-center gap-3">
        <button 
          onClick={onCancel} 
          className={isRest ? "text-[#ffffff]" : "text-[#000000]"}
        >
          cancel
        </button>
        {showFinish && (
          <button 
            onClick={onFinish} 
            className={isRest ? "text-[#ffffff]" : "text-[#000000]"}
          >
            finish
          </button>
        )}
      </div>
    </div>
  )
}

