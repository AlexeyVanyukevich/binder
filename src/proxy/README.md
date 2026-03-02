# Proxy Library

Библиотека для выполнения HTTP-запросов через прокси-серверы с поддержкой ротации, failover и гео-таргетинга.

## Особенности

- Zero dependencies (только native Node.js модули)
- HTTP CONNECT туннелирование для HTTPS
- Round-robin и random стратегии ротации
- Circuit breaker для автоматического отключения проблемных прокси
- Exponential backoff при повторных попытках
- Гео-таргетинг по странам
- SSRF защита (блокировка внутренних IP)

## Установка

Библиотека является частью проекта и не требует отдельной установки.

## Быстрый старт

```javascript
const { proxyService } = require('./proxy');

const service = proxyService({
  providers: {
    brightdata: {
      host: 'zproxy.lum-superproxy.io',
      port: '22225',
      username: 'your-username',
      password: 'your-password',
      countries: 'us,uk,de',
    },
  },
});

// GET запрос
const response = await service.get('https://api.example.com/data');
console.log(response.body);

// POST запрос
const postResponse = await service.post('https://api.example.com/data', {
  key: 'value',
});

// Запрос с гео-таргетингом
const geoResponse = await service.get('https://api.example.com/data', {
  geo: { country: 'de' },
});
```

## API

### proxyService(config)

Создаёт экземпляр сервиса.

```javascript
const service = proxyService({
  maxRetries: 3,           // Количество повторных попыток (default: 3)
  retryDelay: 1000,        // Задержка между попытками в мс (default: 1000)
  timeout: 30000,          // Таймаут запроса в мс (default: 30000)
  rotationStrategy: 'round-robin', // Стратегия ротации: 'round-robin' | 'random'
  providers: {             // Конфигурация прокси-провайдеров
    providerId: {
      host: 'proxy.example.com',
      port: '8080',
      username: 'user',
      password: 'pass',
      countries: 'us,uk',  // Опционально: поддерживаемые страны
    },
  },
});
```

### service.request(options)

Выполняет HTTP-запрос через прокси.

```javascript
const response = await service.request({
  url: 'https://api.example.com/data',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ key: 'value' }),
  timeout: 10000,
  geo: { country: 'us' },
});
```

**Параметры:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| url | string | URL для запроса (обязательный) |
| method | string | HTTP метод: GET, POST, PUT, DELETE, PATCH |
| headers | object | HTTP заголовки |
| body | string | Тело запроса |
| timeout | number | Таймаут в мс |
| geo | object | Гео-таргетинг: `{ country: 'us' }` |

**Возвращает:**

```javascript
{
  status: 200,
  headers: { 'content-type': 'application/json' },
  body: '{"result": "data"}',
  proxyUsed: {
    id: 'brightdata',
    host: 'zproxy.lum-superproxy.io',
    country: 'us',
  },
}
```

### service.get(url, options?)

Выполняет GET-запрос.

```javascript
const response = await service.get('https://api.example.com/data', {
  headers: { 'Authorization': 'Bearer token' },
  geo: { country: 'uk' },
});
```

### service.post(url, body, options?)

Выполняет POST-запрос. Автоматически устанавливает `Content-Type: application/json`.

```javascript
const response = await service.post(
  'https://api.example.com/data',
  { key: 'value' },
  { geo: { country: 'de' } }
);
```

### service.getStatus()

Возвращает статус всех прокси.

```javascript
const status = service.getStatus();
// [
//   { id: 'brightdata', host: '...', countries: ['us', 'uk'], healthy: true, failures: 0 },
//   { id: 'smartproxy', host: '...', countries: ['us'], healthy: false, failures: 5 },
// ]
```

### service.reset()

Сбрасывает счётчики ошибок для всех прокси.

```javascript
service.reset();
```

### service.isAllowedUrl(url)

Проверяет, разрешён ли URL (не является внутренним адресом).

```javascript
service.isAllowedUrl('https://api.example.com'); // true
service.isAllowedUrl('http://localhost:8080');   // false
service.isAllowedUrl('http://192.168.1.1');      // false
```

## Низкоуровневые модули

### proxyProvider

Управление пулом прокси с ротацией.

```javascript
const { proxyProvider, createProxyInfo } = require('./proxy/provider');

const proxies = [
  createProxyInfo('proxy1', { host: '...', port: '8080', username: '...', password: '...' }),
  createProxyInfo('proxy2', { host: '...', port: '8080', username: '...', password: '...' }),
];

const provider = proxyProvider({
  proxies,
  strategy: 'round-robin',
});

const proxy = await provider.getProxy({ country: 'us' });
provider.reportSuccess(proxy.id);
provider.reportFailure(proxy.id);
```

### proxyClient

HTTP клиент для запросов через конкретный прокси.

```javascript
const { proxyClient } = require('./proxy/client');

const client = proxyClient({
  id: 'my-proxy',
  host: 'proxy.example.com',
  port: 8080,
  username: 'user',
  password: 'pass',
});

const response = await client.request({
  url: 'https://api.example.com',
  method: 'GET',
});
```

## Обработка ошибок

```javascript
const {
  ProxyError,
  ProxyConnectionError,
  ProxyTimeoutError,
  ProxyAuthError,
  NoHealthyProxyError,
  InvalidUrlError,
} = require('./proxy/errors');

try {
  await service.get('https://api.example.com');
} catch (error) {
  if (error instanceof ProxyTimeoutError) {
    console.log('Превышен таймаут:', error.proxyHost);
  } else if (error instanceof ProxyAuthError) {
    console.log('Ошибка авторизации:', error.proxyHost);
  } else if (error instanceof NoHealthyProxyError) {
    console.log('Нет доступных прокси');
  } else if (error instanceof InvalidUrlError) {
    console.log('Недопустимый URL');
  }
}
```

## Circuit Breaker

Библиотека автоматически отключает проблемные прокси:

- После 5 последовательных ошибок прокси помечается как unhealthy
- Unhealthy прокси исключается из ротации на 60 секунд
- После cooldown прокси снова становится доступным
- Успешный запрос сбрасывает счётчик ошибок

## Конфигурация через .env

```env
PROXY__MAX_RETRIES=3
PROXY__RETRY_DELAY=1000
PROXY__TIMEOUT=30000
PROXY__ROTATION_STRATEGY=round-robin

PROXY__PROVIDERS__BRIGHTDATA__HOST=zproxy.lum-superproxy.io
PROXY__PROVIDERS__BRIGHTDATA__PORT=22225
PROXY__PROVIDERS__BRIGHTDATA__USERNAME=your-username
PROXY__PROVIDERS__BRIGHTDATA__PASSWORD=your-password
PROXY__PROVIDERS__BRIGHTDATA__COUNTRIES=us,uk,de
```

## Структура модуля

```
src/proxy/
├── client/
│   ├── index.js      # HTTP клиент через прокси
│   └── index.d.ts    # Типы
├── provider/
│   ├── index.js      # Менеджер прокси с ротацией
│   └── index.d.ts    # Типы
├── errors/
│   ├── index.js      # Классы ошибок
│   └── index.d.ts    # Типы
├── index.js          # Главный сервис
├── index.d.ts        # Типы
└── README.md         # Эта документация
```
