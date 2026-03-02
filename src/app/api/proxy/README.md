# Proxy API

REST API для выполнения HTTP-запросов через прокси-серверы.

## Базовый URL

```
/api/proxy
```

## Эндпоинты

### POST /api/proxy/request

Выполняет HTTP-запрос через прокси.

**Request Body:**

```json
{
  "url": "https://api.example.com/data",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer token"
  },
  "body": null,
  "geo": {
    "country": "us"
  }
}
```

| Поле | Тип | Обязательный | Описание |
|------|-----|--------------|----------|
| url | string | Да | URL для запроса |
| method | string | Нет | HTTP метод (default: GET) |
| headers | object | Нет | HTTP заголовки |
| body | string | Нет | Тело запроса |
| geo | object | Нет | Гео-таргетинг |
| geo.country | string | Нет | Код страны (us, uk, de, etc.) |

**Response (200 OK):**

```json
{
  "success": true,
  "status": 200,
  "headers": {
    "content-type": "application/json",
    "x-request-id": "abc123"
  },
  "body": "{\"result\": \"data\"}",
  "proxyUsed": {
    "id": "brightdata",
    "country": "us"
  }
}
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "URL is required"
}
```

```json
{
  "success": false,
  "error": "URL is not allowed (internal or invalid address)"
}
```

**Response (500 Internal Server Error):**

```json
{
  "success": false,
  "error": "No healthy proxies available"
}
```

**Пример с curl:**

```bash
curl -X POST http://localhost:3000/api/proxy/request \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://httpbin.org/get",
    "method": "GET",
    "geo": { "country": "us" }
  }'
```

---

### GET /api/proxy/status

Возвращает статус всех настроенных прокси.

**Response (200 OK):**

```json
{
  "healthy": 2,
  "total": 3,
  "proxies": [
    {
      "id": "brightdata",
      "healthy": true,
      "failures": 0,
      "countries": ["us", "uk", "de"]
    },
    {
      "id": "smartproxy",
      "healthy": true,
      "failures": 1,
      "countries": ["us", "uk"]
    },
    {
      "id": "proxy3",
      "healthy": false,
      "failures": 5,
      "countries": []
    }
  ]
}
```

| Поле | Описание |
|------|----------|
| healthy | Количество здоровых прокси |
| total | Общее количество прокси |
| proxies[].id | Идентификатор прокси |
| proxies[].healthy | Доступен ли прокси |
| proxies[].failures | Количество последовательных ошибок |
| proxies[].countries | Поддерживаемые страны |

**Пример с curl:**

```bash
curl http://localhost:3000/api/proxy/status
```

---

### POST /api/proxy/test

Тестирует работу прокси, выполняя запрос к тестовому URL.

**Request Body (опционально):**

```json
{
  "url": "https://httpbin.org/ip",
  "geo": {
    "country": "de"
  }
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| url | string | Тестовый URL (default: https://httpbin.org/ip) |
| geo | object | Гео-таргетинг |

**Response (200 OK):**

```json
{
  "success": true,
  "testUrl": "https://httpbin.org/ip",
  "response": {
    "status": 200,
    "body": "{\"origin\": \"123.45.67.89\"}"
  },
  "proxyUsed": {
    "id": "brightdata",
    "country": "de"
  }
}
```

**Пример с curl:**

```bash
# Тест с URL по умолчанию
curl -X POST http://localhost:3000/api/proxy/test \
  -H "Content-Type: application/json"

# Тест с гео-таргетингом
curl -X POST http://localhost:3000/api/proxy/test \
  -H "Content-Type: application/json" \
  -d '{"geo": {"country": "de"}}'
```

---

### POST /api/proxy/reset

Сбрасывает счётчики ошибок для всех прокси.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Proxy failure counters reset"
}
```

**Пример с curl:**

```bash
curl -X POST http://localhost:3000/api/proxy/reset
```

---

## Примеры использования

### Парсинг данных с гео-ограничением

```bash
# Получить контент доступный только в США
curl -X POST http://localhost:3000/api/proxy/request \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://us-only-api.example.com/data",
    "geo": { "country": "us" }
  }'
```

### POST запрос с авторизацией

```bash
curl -X POST http://localhost:3000/api/proxy/request \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.example.com/users",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer your-token",
      "Content-Type": "application/json"
    },
    "body": "{\"name\": \"John\", \"email\": \"john@example.com\"}"
  }'
```

### Проверка своего IP через прокси

```bash
curl -X POST http://localhost:3000/api/proxy/test \
  -H "Content-Type: application/json" \
  -d '{"url": "https://httpbin.org/ip"}'
```

---

## Коды ошибок

| Код | Описание |
|-----|----------|
| 400 | Невалидный запрос (отсутствует URL, недопустимый URL) |
| 500 | Ошибка сервера (нет доступных прокси, ошибка соединения) |

## Заблокированные URL

Для защиты от SSRF атак следующие URL заблокированы:

- `localhost`, `127.0.0.1`, `0.0.0.0`
- Приватные IP: `10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`
- Link-local: `169.254.x.x`
- Cloud metadata: `metadata.google.*`

---

## Конфигурация

API автоматически инициализируется если в `.env` настроены прокси-провайдеры:

```env
# Обязательные параметры провайдера
PROXY__PROVIDERS__PROVIDER_ID__HOST=proxy.example.com
PROXY__PROVIDERS__PROVIDER_ID__PORT=8080
PROXY__PROVIDERS__PROVIDER_ID__USERNAME=user
PROXY__PROVIDERS__PROVIDER_ID__PASSWORD=pass

# Опциональные параметры
PROXY__PROVIDERS__PROVIDER_ID__COUNTRIES=us,uk,de

# Глобальные настройки
PROXY__MAX_RETRIES=3
PROXY__RETRY_DELAY=1000
PROXY__TIMEOUT=30000
PROXY__ROTATION_STRATEGY=round-robin
```

Если провайдеры не настроены, API proxy не будет доступен.
