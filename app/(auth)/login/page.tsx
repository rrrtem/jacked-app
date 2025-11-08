export default function LoginPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-h1">Вход</h1>
      <p className="text-body opacity-inactive">
        Страница авторизации (заглушка)
      </p>
      <div className="space-y-4">
        <div className="p-4 border border-black/10 rounded-card">
          Email input
        </div>
        <div className="p-4 border border-black/10 rounded-card">
          Password input
        </div>
        <button className="w-full py-4 bg-accent text-white rounded-button">
          Войти
        </button>
      </div>
    </div>
  );
}

