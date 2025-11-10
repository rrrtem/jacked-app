# ⚠️ СРОЧНО: Примените миграцию для работы Settings!

## Ошибка "Failed to save settings"

Эта ошибка возникает потому, что в таблице `users` отсутствуют новые поля.

## Решение: Применить миграцию

### Вариант 1: Supabase Dashboard (САМЫЙ ПРОСТОЙ)

1. Откройте **Supabase Dashboard**: https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **SQL Editor** (в левом меню)
4. Нажмите **New Query**
5. Скопируйте и вставьте этот SQL:

```sql
-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS progression_config TEXT DEFAULT 'standard-linear';
ALTER TABLE users ADD COLUMN IF NOT EXISTS training_preferences TEXT DEFAULT NULL;

-- Add comments
COMMENT ON COLUMN users.progression_config IS 'Progression logic configuration ID';
COMMENT ON COLUMN users.training_preferences IS 'Free text field for user training approach and preferences';
```

6. Нажмите **Run** (или Cmd+Enter / Ctrl+Enter)
7. Дождитесь сообщения "Success"

### Вариант 2: Из файла миграции

Или просто скопируйте содержимое файла `db/migration_user_preferences.sql` и запустите его в SQL Editor.

## Проверка

После применения миграции перезагрузите страницу Settings и попробуйте сохранить настройки снова.

### Проверить, что миграция применена:

В SQL Editor выполните:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('progression_config', 'training_preferences');
```

Должны увидеть обе колонки.

## Что дальше?

После применения миграции:
1. Обновите страницу Settings (F5)
2. Попробуйте изменить имя или training preferences
3. Проверьте, что появляется сообщение "saved"

## Если всё ещё не работает

Проверьте консоль браузера (F12 → Console) на наличие более детальной ошибки.


