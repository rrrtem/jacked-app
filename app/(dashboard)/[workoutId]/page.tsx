export default function WorkoutPage({
  params,
}: {
  params: { workoutId: string };
}) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="text-body opacity-inactive mb-2">Упражнение 1 из 5</div>
        <h1 className="text-supertitle mb-4">Жим лёжа</h1>
        <div className="text-h1 opacity-inactive">Подход 1 из 3</div>
      </div>

      {/* Timer / Exercise State */}
      <div className="border border-black/10 rounded-card p-12 text-center">
        <div className="text-supertitle text-accent mb-4">00:45</div>
        <p className="text-body opacity-inactive">Разминка</p>
      </div>

      {/* Exercise Parameters */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-black/10 rounded-card p-6">
          <div className="text-body opacity-inactive mb-2">Вес</div>
          <div className="text-h1">80 kg</div>
        </div>
        <div className="border border-black/10 rounded-card p-6">
          <div className="text-body opacity-inactive mb-2">Повторения</div>
          <div className="text-h1">8</div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <button className="w-full py-4 bg-accent text-white text-body rounded-button">
          Далее
        </button>
        <button className="w-full py-4 border border-black/10 text-body rounded-button">
          Изменить параметры
        </button>
      </div>

      {/* Progress */}
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-12 h-2 rounded-full ${
              i === 1 ? "bg-accent" : "bg-black/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

