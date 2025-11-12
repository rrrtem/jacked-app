import Link from "next/link"
import { formatTime } from "./utils"
import type { NewRecord } from "./types"
import { clearAIGeneration } from "@/lib/ai-suggest/storage"

type FinishedStageProps = {
  totalTime: number
  totalWorkouts: number | null
  sessionWeight: number
  newRecords: NewRecord[]
}

export function FinishedStage({
  totalTime,
  totalWorkouts,
  sessionWeight,
  newRecords,
}: FinishedStageProps) {
  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col p-[10px] relative">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
        {/* Header with "done" and time */}
        <div className="mb-8 pt-8">
          <p className="text-[16px] leading-[120%] text-[rgba(0,0,0,0.3)] mb-4">done</p>
          <h1 className="text-[60px] leading-[110%] font-normal text-[#000000]">
            {formatTime(totalTime)}
          </h1>
        </div>

        {/* Divider */}
        <div className="border-t border-[rgba(0,0,0,0.1)] mb-6"></div>

        {/* Overall statistics */}
        <div className="mb-8">
          {totalWorkouts !== null && (
            <div className="flex items-center justify-between py-3">
              <span className="text-[20px] leading-[120%] text-[#000000]">total workouts</span>
              <span className="text-[20px] leading-[120%] text-[#000000]">{totalWorkouts}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-3">
            <span className="text-[20px] leading-[120%] text-[#000000]">weight</span>
            <span className="text-[20px] leading-[120%] text-[#000000]">
              {sessionWeight.toFixed(0)} kg
            </span>
          </div>
        </div>

        {/* Records - show only new records from this workout */}
        {newRecords.length > 0 && (
          <div className="mb-8">
            <p className="text-[16px] leading-[120%] text-[rgba(0,0,0,0.3)] mb-4">records</p>
            <div className="space-y-3">
              {newRecords.map((record) => (
                <div key={record.exerciseId} className="flex items-center justify-between py-2">
                  <span className="text-[20px] leading-[120%] text-[#000000]">
                    {record.exerciseName}
                  </span>
                  <span className="text-[20px] leading-[120%] text-[#000000]">{record.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1"></div>

        {/* Close button at bottom */}
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
            <Link href="/">
              <button 
                onClick={() => clearAIGeneration()}
                className="w-full bg-[#000000] text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal hover:opacity-90"
              >
                close
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

