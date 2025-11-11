import { WorkoutHeader } from "./WorkoutHeader"
import { ExerciseControls } from "./ExerciseControls"
import type { ExerciseData } from "./types"

type ExerciseStageProps = {
  totalTime: number
  exercise: ExerciseData
  currentSet: number
  weight: string
  reps: string
  duration: string
  isEditingWeight: boolean
  isEditingReps: boolean
  isEditingDuration: boolean
  onCancel: () => void
  onFinish: () => void
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

export function ExerciseStage({
  totalTime,
  exercise,
  currentSet,
  weight,
  reps,
  duration,
  isEditingWeight,
  isEditingReps,
  isEditingDuration,
  onCancel,
  onFinish,
  onWeightChange,
  onRepsChange,
  onDurationChange,
  onEditingWeightChange,
  onEditingRepsChange,
  onEditingDurationChange,
  onCompleteSet,
  onSkipSet,
  onNextExercise,
}: ExerciseStageProps) {
  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col p-[10px]">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
        <WorkoutHeader totalTime={totalTime} onCancel={onCancel} onFinish={onFinish} />

        <div className="mb-8 exercise-title-group">
          <h1 className="text-[60px] font-normal text-[#000000]">{exercise.name}</h1>
          <p className="text-[60px] font-normal text-[#ff2f00]">×{currentSet}</p>
        </div>

        {exercise.instructions && (
          <div className="mb-8">
            <p className="text-[20px] leading-[120%] text-[#000000] whitespace-pre-line">
              {exercise.instructions}
            </p>
          </div>
        )}

        <div className="flex-1"></div>

        <ExerciseControls
          exercise={exercise}
          currentSet={currentSet}
          weight={weight}
          reps={reps}
          duration={duration}
          isEditingWeight={isEditingWeight}
          isEditingReps={isEditingReps}
          isEditingDuration={isEditingDuration}
          onWeightChange={onWeightChange}
          onRepsChange={onRepsChange}
          onDurationChange={onDurationChange}
          onEditingWeightChange={onEditingWeightChange}
          onEditingRepsChange={onEditingRepsChange}
          onEditingDurationChange={onEditingDurationChange}
          onCompleteSet={onCompleteSet}
          onSkipSet={onSkipSet}
          onNextExercise={onNextExercise}
        />
      </div>
    </div>
  )
}

