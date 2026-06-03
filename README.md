# Notification Preferences Service

Сервис управления предпочтениями уведомлений. Хранит дефолтные и пользовательские настройки, глобальные политики, quiet hours. Позволяет проверить, можно ли отправить конкретное уведомление пользователю.

## Запуск

### Docker (рекомендуется)

```bash
docker-compose up --build
```

Сервис поднимется на `http://localhost:3000`, миграции применятся автоматически.

### Локально

Нужен работающий PostgreSQL.

```bash
cp .env.example .env
# отредактировать DATABASE_URL в .env

npm install
npm run migrate
npm run dev
```

## Тесты

```bash
npm test
```

Тесты не требуют запущенной базы — репозитории мокаются.

## API

### Получить предпочтения

```
GET /users/:userId/preferences
```

Возвращает мерж дефолтных и пользовательских настроек.

### Изменить предпочтения

```
POST /users/:userId/preferences
Content-Type: application/json

{
  "preferences": [
    { "notificationType": "marketing", "channel": "email", "enabled": true }
  ],
  "quietHours": {
    "startTime": "22:00",
    "endTime": "08:00",
    "timezone": "Europe/Moscow"
  }
}
```

Оба поля опциональны, но хотя бы одно должно присутствовать. Операция идемпотентна.

### Проверить возможность отправки

```
POST /evaluate
Content-Type: application/json

{
  "userId": "user-1",
  "notificationType": "marketing",
  "channel": "sms",
  "region": "EU",
  "datetime": "2026-05-21T21:30:00Z"
}
```

Ответ:

```json
{
  "decision": "deny",
  "reason": "blocked_by_global_policy"
}
```

Цепочка проверок: глобальная политика → пользовательские/дефолтные настройки → quiet hours.

## Архитектура

```
src/
  routes/        — HTTP-слой, валидация входных данных (Zod)
  services/      — бизнес-логика
  repositories/  — SQL-запросы (pg)
  types/         — доменные типы
  db/            — подключение и миграции
  middleware/    — логирование запросов, обработка ошибок
```

Слоёная архитектура: routes → services → repositories. Сервисы не знают про HTTP, репозитории не знают про бизнес-логику.

Логирование — pino (структурированные JSON-логи). Логируются изменения настроек и решения evaluate.

## Что добавить для продакшена

- Rate limiting
- Аутентификация/авторизация
- CRUD для глобальных политик (сейчас управляются через БД напрямую)
- Кэширование дефолтных настроек и политик (они меняются редко)
- Healthcheck с проверкой доступности БД
- Метрики (Prometheus) — счётчики allow/deny, гистограммы latency
- CI/CD pipeline
- Нагрузочное тестирование
