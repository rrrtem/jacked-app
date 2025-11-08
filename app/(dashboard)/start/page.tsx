export default function StartPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-h1 mb-4">Выбор тренировки</h1>
        <p className="text-body opacity-inactive">
          Выберите готовый сет или создайте свой
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <button className="px-6 py-2 border border-black rounded-button text-body">
          Все
        </button>
        <button className="px-6 py-2 border border-black/10 rounded-button text-body opacity-inactive">
          Силовые
        </button>
        <button className="px-6 py-2 border border-black/10 rounded-button text-body opacity-inactive">
          Кардио
        </button>
      </div>

      {/* Workout Sets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-black/10 rounded-card p-6 space-y-4">
            <h2 className="text-h1">Тренировка {i}</h2>
            <p className="text-body opacity-inactive">
              Описание тренировки и список упражнений
            </p>
            <button className="w-full py-3 bg-accent text-white rounded-button">
              Начать
            </button>
          </div>
        ))}
      </div>

      {/* AI Chat Option */}
      <div className="border border-accent rounded-card p-6 text-center">
        <h2 className="text-h1 mb-2">Спросить AI</h2>
        <p className="text-body opacity-inactive mb-4">
          Получите персональные рекомендации
        </p>
        <button className="px-8 py-3 bg-accent text-white rounded-button">
          Открыть чат
        </button>
      </div>
    </div>
  );
}

