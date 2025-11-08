export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-h1 mb-4">Привет, Атлет!</h1>
        <p className="text-body opacity-inactive">Дашборд с календарём и достижениями</p>
      </div>

      {/* Calendar Widget */}
      <section className="border border-black/10 rounded-card p-8">
        <h2 className="text-h1 mb-4">Календарь тренировок</h2>
        <div className="h-64 flex items-center justify-center opacity-inactive">
          [Calendar Component]
        </div>
      </section>

      {/* Achievements Widget */}
      <section className="border border-black/10 rounded-card p-8">
        <h2 className="text-h1 mb-4">Достижения</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-black/10 rounded-card">
              <div className="text-body">Упражнение {i}</div>
              <div className="text-supertitle text-accent">100 kg</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Button */}
      <div className="flex justify-center">
        <a
          href="/start"
          className="inline-block px-12 py-4 bg-accent text-white text-body rounded-button hover:opacity-80 transition-opacity"
        >
          Начать тренировку
        </a>
      </div>
    </div>
  );
}

