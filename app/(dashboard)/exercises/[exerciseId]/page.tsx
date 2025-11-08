export default function ExerciseDetailPage({
  params,
}: {
  params: { exerciseId: string };
}) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-h1 mb-4">Жим лёжа</h1>
        <p className="text-body opacity-inactive">
          Базовое упражнение для грудных мышц
        </p>
      </div>

      {/* Exercise Image/Video */}
      <div className="border border-black/10 rounded-card p-12 bg-secondary flex items-center justify-center h-96">
        <span className="text-h1 opacity-inactive">[Медиа контент]</span>
      </div>

      {/* Stats */}
      <section className="border border-black/10 rounded-card p-8">
        <h2 className="text-h1 mb-6">Личные рекорды</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-body opacity-inactive mb-2">Максимальный вес</div>
            <div className="text-supertitle text-accent">120 kg</div>
          </div>
          <div>
            <div className="text-body opacity-inactive mb-2">Максимум повторений</div>
            <div className="text-supertitle text-accent">15</div>
          </div>
        </div>
      </section>

      {/* Progress Chart */}
      <section className="border border-black/10 rounded-card p-8">
        <h2 className="text-h1 mb-6">График прогресса</h2>
        <div className="h-64 flex items-center justify-center opacity-inactive">
          [Chart Component]
        </div>
      </section>

      {/* History */}
      <section className="border border-black/10 rounded-card p-8">
        <h2 className="text-h1 mb-6">История выполнения</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center py-4 border-b border-black/10">
              <div>
                <div className="text-body">15 ноября 2024</div>
                <div className="text-body opacity-inactive">3 подхода × 8 повторений</div>
              </div>
              <div className="text-body">100 kg</div>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-4">
        <button className="flex-1 py-4 bg-accent text-white text-body rounded-button">
          Редактировать
        </button>
        <button className="flex-1 py-4 border border-black/10 text-body rounded-button">
          Удалить
        </button>
      </div>
    </div>
  );
}

