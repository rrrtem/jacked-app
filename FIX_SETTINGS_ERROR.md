# 🔧 FIX: Settings Save Error

## Проблема
Ошибка "Failed to save settings" возникает из-за отсутствия INSERT политики в Row Level Security для таблицы `users`.

## ✅ Решение (1 минута)

### В Supabase Dashboard SQL Editor выполните:

```sql
-- Add INSERT policy for users table
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

Это всё! Просто 3 строки SQL.

## Что это делает?

Разрешает пользователю создавать свою собственную запись в таблице `users` через upsert операцию.

## Проверка

После выполнения SQL:
1. Обновите страницу Settings (F5)
2. Измените имя или другие настройки
3. Должно появиться "saved" ✅

## Проверить, что политика добавлена:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd;
```

Должны увидеть 3 политики:
- INSERT: "Users can insert own profile"
- SELECT: "Users can view own profile"  
- UPDATE: "Users can update own profile"

## Альтернатива: Полный скрипт

Если хотите запустить полный скрипт со всеми проверками, используйте:
`db/complete_settings_fix.sql`


