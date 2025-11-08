# Инструкция по деплою на Vercel

## Предварительные требования

1. GitHub аккаунт
2. Vercel аккаунт (можно войти через GitHub)
3. Supabase проект с настроенными API ключами

## Шаг 1: Подготовка репозитория

1. Инициализируйте Git (если ещё не сделано):
```bash
git init
git add .
git commit -m "Initial commit: infrastructure and scaffolding"
```

2. Создайте репозиторий на GitHub и запушьте код:
```bash
git remote add origin https://github.com/your-username/jacked-app.git
git branch -M main
git push -u origin main
```

## Шаг 2: Настройка Supabase

1. Перейдите на [app.supabase.com](https://app.supabase.com)
2. Создайте новый проект
3. Перейдите в **Project Settings → API**
4. Скопируйте следующие значения:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

## Шаг 3: Деплой на Vercel

### Через веб-интерфейс

1. Перейдите на [vercel.com](https://vercel.com)
2. Нажмите **Add New → Project**
3. Импортируйте ваш GitHub репозиторий
4. Настройте переменные окружения:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Нажмите **Deploy**

### Через CLI

```bash
# Установите Vercel CLI
pnpm install -g vercel

# Войдите в аккаунт
vercel login

# Деплой
vercel

# Добавьте переменные окружения
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Продакшен деплой
vercel --prod
```

## Шаг 4: Проверка

1. Откройте URL, предоставленный Vercel
2. Убедитесь, что приложение загружается
3. Проверьте, что все страницы доступны

## Автоматический деплой

Vercel автоматически деплоит изменения при пуше в GitHub:
- `main` ветка → Production
- Другие ветки → Preview deployments

## Настройка доменов

1. В Vercel перейдите в **Settings → Domains**
2. Добавьте свой домен
3. Настройте DNS записи согласно инструкциям Vercel

## Мониторинг и логи

- **Analytics**: Vercel Dashboard → Analytics
- **Logs**: Vercel Dashboard → Deployments → [выберите деплой] → Logs
- **Performance**: Vercel Dashboard → Speed Insights

## Troubleshooting

### Ошибка: "Missing environment variables"
Убедитесь, что все переменные окружения добавлены в Vercel Settings.

### Ошибка сборки
Проверьте логи сборки в Vercel Dashboard и запустите `pnpm build` локально для отладки.

### Проблемы с Supabase
Проверьте правильность URL и ключей в настройках проекта.

