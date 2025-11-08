export default function HistoryPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-h1 mb-4">История тренировок</h1>
        <p className="text-body opacity-inactive">
          Все ваши завершённые тренировки
        </p>
      </div>

      {/* Calendar View */}
      <section className="border border-black/10 rounded-card p-8">
        <h2 className="text-h1 mb-4">Календарь</h2>
        <div className="h-64 flex items-center justify-center opacity-inactive">
          [Calendar Component with highlights]
        </div>
      </section>

      {/* Workout List */}
      <section className="space-y-4">
        <h2 className="text-h1">Последние тренировки</h2>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border border-black/10 rounded-card p-6 flex justify-between items-center">
            <div>
              <div className="text-body">Тренировка {i}</div>
              <div className="text-body opacity-inactive">15 ноября 2024</div>
            </div>
            <div className="text-body opacity-inactive">45 мин</div>
          </div>
        ))}
      </section>
    </div>
  );
}

