export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-h1 mb-4">Настройки</h1>
        <p className="text-body opacity-inactive">
          Управление профилем и предпочтениями
        </p>
      </div>

      {/* Profile Section */}
      <section className="border border-black/10 rounded-card p-8 space-y-6">
        <h2 className="text-h1">Профиль</h2>
        <div className="space-y-4">
          <div>
            <label className="text-body opacity-inactive mb-2 block">Имя</label>
            <div className="p-4 border border-black/10 rounded-card">
              Иван Иванов
            </div>
          </div>
          <div>
            <label className="text-body opacity-inactive mb-2 block">Email</label>
            <div className="p-4 border border-black/10 rounded-card">
              ivan@example.com
            </div>
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section className="border border-black/10 rounded-card p-8 space-y-6">
        <h2 className="text-h1">Предпочтения</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-body">Единицы измерения</span>
            <span className="text-body opacity-inactive">Килограммы</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-body">Длительность отдыха</span>
            <span className="text-body opacity-inactive">90 секунд</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-body">AI-предпочтения</span>
            <span className="text-body opacity-inactive">Включено</span>
          </div>
        </div>
      </section>

      <button className="w-full py-4 bg-accent text-white text-body rounded-button">
        Сохранить изменения
      </button>
    </div>
  );
}

