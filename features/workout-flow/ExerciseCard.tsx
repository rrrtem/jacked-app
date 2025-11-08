import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";

interface ExerciseCardProps {
  title: string;
  description?: string;
  targetWeight?: number;
  targetReps?: number;
  targetTime?: number;
  onEdit?: () => void;
  onComplete?: () => void;
}

export function ExerciseCard({
  title,
  description,
  targetWeight,
  targetReps,
  targetTime,
  onEdit,
  onComplete,
}: ExerciseCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-body opacity-inactive mt-2">{description}</p>
        )}
      </CardHeader>

      <CardContent>
        {/* Parameters */}
        <div className="grid grid-cols-2 gap-4">
          {targetWeight !== undefined && (
            <div className="border border-black/10 rounded-card p-4">
              <div className="text-body opacity-inactive mb-1">Вес</div>
              <div className="text-h1">{targetWeight} kg</div>
            </div>
          )}
          {targetReps !== undefined && (
            <div className="border border-black/10 rounded-card p-4">
              <div className="text-body opacity-inactive mb-1">Повторения</div>
              <div className="text-h1">{targetReps}</div>
            </div>
          )}
          {targetTime !== undefined && (
            <div className="border border-black/10 rounded-card p-4">
              <div className="text-body opacity-inactive mb-1">Время</div>
              <div className="text-h1">{targetTime}s</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 py-3 border border-black/10 rounded-button text-body hover:border-accent"
            >
              Изменить
            </button>
          )}
          {onComplete && (
            <button
              onClick={onComplete}
              className="flex-1 py-3 bg-accent text-white rounded-button hover:opacity-80"
            >
              Выполнено
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

