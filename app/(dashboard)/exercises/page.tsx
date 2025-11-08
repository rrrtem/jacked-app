export default function ExercisesPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-h1 mb-4">Библиотека упражнений</h1>
          <p className="text-body opacity-inactive">
            Все доступные упражнения
          </p>
        </div>
        <button className="px-8 py-3 bg-accent text-white text-body rounded-button">
          Добавить упражнение
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <button className="px-6 py-2 border border-black rounded-button text-body">
          Все
        </button>
        <button className="px-6 py-2 border border-black/10 rounded-button text-body opacity-inactive">
          Грудь
        </button>
        <button className="px-6 py-2 border border-black/10 rounded-button text-body opacity-inactive">
          Спина
        </button>
        <button className="px-6 py-2 border border-black/10 rounded-button text-body opacity-inactive">
          Ноги
        </button>
      </div>

      {/* Exercise List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <a
            key={i}
            href={`/exercises/${i}`}
            className="border border-black/10 rounded-card p-6 space-y-4 hover:border-accent transition-colors"
          >
            <div className="h-32 bg-secondary rounded-card flex items-center justify-center opacity-inactive">
              [Изображение]
            </div>
            <h3 className="text-body">Упражнение {i}</h3>
            <div className="flex justify-between text-body opacity-inactive">
              <span>Макс вес: 100 kg</span>
              <span>Макс повт: 12</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

