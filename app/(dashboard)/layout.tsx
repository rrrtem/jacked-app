export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header / Navigation */}
      <header className="border-b border-black/10 p-base">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-h1">Jacked</h1>
          <nav className="flex gap-4 text-body">
            <a href="/" className="opacity-inactive hover:opacity-100">Дашборд</a>
            <a href="/start" className="opacity-inactive hover:opacity-100">Старт</a>
            <a href="/history" className="opacity-inactive hover:opacity-100">История</a>
            <a href="/exercises" className="opacity-inactive hover:opacity-100">Упражнения</a>
            <a href="/settings" className="opacity-inactive hover:opacity-100">Настройки</a>
          </nav>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="p-base">
        {children}
      </main>
    </div>
  );
}

