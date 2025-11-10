#!/bin/bash

echo "🛑 Останавливаем все процессы..."

# Останавливаем Next.js сервер (порт 3000)
echo "   Останавливаем Next.js сервер (порт 3000)..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "   ✓ Next.js уже остановлен"

# Останавливаем все процессы node (на всякий случай)
echo "   Останавливаем node процессы..."
pkill -f "next dev" 2>/dev/null || echo "   ✓ Node процессы уже остановлены"

# Останавливаем ngrok
echo "   Останавливаем ngrok..."
pkill -f ngrok 2>/dev/null || echo "   ✓ ngrok уже остановлен"

echo ""
echo "✅ Все процессы остановлены!"
echo ""
echo "🚀 Запускаем Next.js сервер..."

# Запускаем Next.js в фоновом режиме
pnpm dev > dev.log 2>&1 &
NEXT_PID=$!

echo "   ✓ Next.js запущен (PID: $NEXT_PID)"
echo "   📝 Логи сохраняются в dev.log"
echo ""
echo "⏳ Ждем 5 секунд, чтобы сервер запустился..."
sleep 5

echo ""
echo "🌐 Запускаем ngrok туннель..."

# Запускаем ngrok в фоновом режиме
ngrok http 3000 > ngrok.log 2>&1 &
NGROK_PID=$!

echo "   ✓ ngrok запущен (PID: $NGROK_PID)"
echo ""
echo "⏳ Ждем 3 секунды, чтобы туннель установился..."
sleep 3

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ВСЁ ГОТОВО!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Next.js: http://localhost:3000"
echo ""
echo "🔗 ngrok URL (получаем из API):"

# Получаем ngrok URL через API
sleep 2
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[a-zA-Z0-9.-]*\.ngrok-free\.dev' | head -n 1)

if [ -z "$NGROK_URL" ]; then
    echo "   ⚠️  Не удалось получить URL автоматически"
    echo "   Откройте http://localhost:4040 в браузере"
else
    echo "   $NGROK_URL"
    echo ""
    echo "📱 Откройте на телефоне:"
    echo "   $NGROK_URL/login"
    echo ""
    echo "⚠️  НЕ ЗАБУДЬТЕ обновить в Supabase Dashboard:"
    echo "   Site URL: $NGROK_URL"
    echo "   Redirect URLs: $NGROK_URL/auth/callback"
    echo ""
    echo "📝 И в .env.local:"
    echo "   NEXT_PUBLIC_SITE_URL=$NGROK_URL"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Полезные команды:"
echo "   • Просмотр логов Next.js: tail -f dev.log"
echo "   • Просмотр ngrok панели: open http://localhost:4040"
echo "   • Остановить всё: ./stop-dev.sh"
echo ""
echo "Процессы запущены в фоне. Чтобы остановить, используйте:"
echo "   kill $NEXT_PID $NGROK_PID"
echo ""

