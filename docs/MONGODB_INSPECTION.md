# Как посмотреть данные в MongoDB

В Task 2 MongoDB запущена как replica set из трех контейнеров:

- `mongo1`
- `mongo2`
- `mongo3`

Данные физически хранятся в Docker volumes:

- `mongo1-data:/data/db`
- `mongo2-data:/data/db`
- `mongo3-data:/data/db`

Приложение пишет данные в базу `crackhash`.

## Подключение

Самый удобный способ — зайти в `mongosh` внутри контейнера `mongo1`:

```powershell
docker compose exec mongo1 mongosh
```

Или сразу открыть базу приложения:

```powershell
docker compose exec mongo1 mongosh crackhash
```

Если `mongo1` сейчас не primary, это не страшно для просмотра. Для записи приложение подключается по URI ко всем трем нодам:

```text
mongodb://mongo1:27017,mongo2:27017,mongo3:27017/crackhash?replicaSet=rs0&w=majority&readConcernLevel=majority&retryWrites=true
```

## Проверка replica set

Показать полный статус:

```javascript
rs.status()
```

Коротко посмотреть роли нод:

```javascript
rs.status().members.map(m => ({ name: m.name, state: m.stateStr }))
```

Ожидаемая схема для Task 2:

```text
1 PRIMARY
2 SECONDARY
```

## Базы и коллекции

Показать базы:

```javascript
show dbs
```

Перейти в базу приложения:

```javascript
use crackhash
```

Показать коллекции:

```javascript
show collections
```

В этой реализации основные коллекции такие:

- `crack_requests` — основной документ клиентского запроса;
- `crack_task_parts` — части задачи, они же outbox manager для публикации в RabbitMQ.

## Основные запросы

Посмотреть все клиентские запросы:

```javascript
db.crack_requests.find().pretty()
```

Посмотреть все части задач:

```javascript
db.crack_task_parts.find().pretty()
```

Посмотреть последние клиентские запросы:

```javascript
db.crack_requests.find().sort({ createdAt: -1 }).limit(5).pretty()
```

Посмотреть только важные поля запросов:

```javascript
db.crack_requests.find(
  {},
  {
    requestId: 1,
    hash: 1,
    maxLength: 1,
    status: 1,
    partCount: 1,
    completedParts: 1,
    results: 1,
    createdAt: 1,
    updatedAt: 1
  }
).pretty()
```

Посмотреть только важные поля частей:

```javascript
db.crack_task_parts.find(
  {},
  {
    requestId: 1,
    partNumber: 1,
    partCount: 1,
    status: 1,
    publishAttempts: 1,
    lastError: 1,
    publishedAt: 1,
    completedAt: 1
  }
).sort({ requestId: 1, partNumber: 1 }).pretty()
```

Посмотреть части конкретного запроса:

```javascript
db.crack_task_parts.find({ requestId: "ВСТАВЬ_REQUEST_ID" }).sort({ partNumber: 1 }).pretty()
```

Посмотреть неудачные публикации в RabbitMQ:

```javascript
db.crack_task_parts.find({ status: "PUBLISH_FAILED" }).pretty()
```

Посмотреть части, которые еще ждут публикации:

```javascript
db.crack_task_parts.find({ status: "PENDING_PUBLISH" }).pretty()
```

Посмотреть завершенные части:

```javascript
db.crack_task_parts.find({ status: "COMPLETED" }).pretty()
```

## Что хранится в `crack_requests`

Примерный вид документа:

```javascript
{
  _id: "requestId",
  requestId: "requestId",
  hash: "098f6bcd4621d373cade4e832627b4f6",
  maxLength: 4,
  status: "QUEUED" | "IN_PROGRESS" | "READY" | "ERROR",
  results: ["test"],
  partCount: 3,
  completedParts: 3,
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

Назначение полей:

- `requestId` — внешний идентификатор задачи, который получает клиент;
- `hash` — MD5-хэш для перебора;
- `maxLength` — максимальная длина слова;
- `status` — общий статус клиентской задачи;
- `results` — найденные слова, заполняется при `READY`;
- `partCount` — на сколько частей manager разделил задачу;
- `completedParts` — сколько частей уже завершено;
- `createdAt`, `updatedAt` — время создания и последнего изменения.

## Что хранится в `crack_task_parts`

Примерный вид документа:

```javascript
{
  _id: "requestId:1",
  requestId: "requestId",
  partNumber: 1,
  partCount: 3,
  hash: "098f6bcd4621d373cade4e832627b4f6",
  maxLength: 4,
  alphabet: "abcdefghijklmnopqrstuvwxyz0123456789",
  status: "PENDING_PUBLISH" | "PUBLISH_FAILED" | "PUBLISHED" | "PROCESSING" | "COMPLETED",
  workerId: "worker-container-id",
  attemptId: "uuid-of-worker-attempt",
  results: ["test"],
  publishAttempts: 0,
  lastError: null,
  processingError: null,
  processingAttempts: 1,
  createdAt: ISODate("..."),
  updatedAt: ISODate("..."),
  publishedAt: ISODate("..."),
  startedAt: ISODate("..."),
  lastHeartbeatAt: ISODate("..."),
  completedAt: ISODate("...")
}
```

Назначение полей:

- `_id` — составной идентификатор `requestId:partNumber`;
- `requestId` — ссылка на основной запрос;
- `partNumber` — номер части;
- `partCount` — общее количество частей;
- `hash`, `maxLength`, `alphabet` — параметры перебора для воркера;
- `status` — внутренний статус части;
- `workerId` — идентификатор контейнера/процесса worker, который взял часть в работу;
- `attemptId` — идентификатор конкретной попытки обработки части;
- `results` — найденные слова именно в этой части;
- `publishAttempts` — сколько раз manager пытался отправить часть в RabbitMQ;
- `lastError` — последняя ошибка публикации, если RabbitMQ был недоступен;
- `processingError` — последняя ошибка выполнения на worker, если попытка завершилась неудачно;
- `processingAttempts` — сколько раз manager получал событие `STARTED` по этой части;
- `publishedAt` — когда часть успешно отправлена в очередь задач;
- `startedAt` — когда worker сообщил, что начал обработку части;
- `lastHeartbeatAt` — последнее событие активности worker по этой части;
- `completedAt` — когда manager сохранил ответ воркера.

## Жизненный цикл записи

После `POST /api/hash/crack` manager делает две записи:

1. Создает документ в `crack_requests` со статусом `QUEUED`.
2. Создает несколько документов в `crack_task_parts` со статусом `PENDING_PUBLISH`.

Дальше статусы частей обычно меняются так:

```text
PENDING_PUBLISH -> PUBLISHED -> PROCESSING -> COMPLETED
```

Если RabbitMQ недоступен во время публикации:

```text
PENDING_PUBLISH -> PUBLISH_FAILED -> PUBLISHED -> PROCESSING -> COMPLETED
```

Если worker начал обработку и упал/получил ошибку до финального ответа, исходное сообщение возвращается в RabbitMQ через `nack requeue=true`, а manager сохраняет последнюю ошибку попытки в `processingError`.

## Monitoring API

Для страницы мониторинга клиент не читает MongoDB напрямую и не ходит в manager. Он обращается в отдельный read-only сервис `monitoring-api` на `:8083`, а уже этот сервис читает состояние задач напрямую из MongoDB replica set:

```text
React client -> http://localhost:8083/api/monitoring/* -> monitoring-api -> MongoDB
```

В `docker-compose.yml` и `monitoring-api/src/main/resources/application.yml` для него используется отдельный MongoDB URI:

```text
mongodb://mongo1:27017,mongo2:27017,mongo3:27017/crackhash?replicaSet=rs0&readConcernLevel=majority&readPreference=secondaryPreferred&retryWrites=true
```

Важные отличия от manager:

- `monitoring-api` не публикует задачи в RabbitMQ и не меняет документы задач;
- чтение идет с `readConcernLevel=majority`, то есть сервис показывает только подтвержденные replica set данные;
- `readPreference=secondaryPreferred` позволяет читать с secondary-нод, если они доступны, и не грузить primary лишними запросами мониторинга;
- вкладка Monitoring продолжает работать при остановке или рестарте manager, пока доступны `monitoring-api` и MongoDB.

Основные endpoints:

```http
GET /api/monitoring/requests?page=0&size=50&sort=newest
GET /api/monitoring/requests?limit=50
GET /api/monitoring/requests?status=READY
GET /api/monitoring/requests/{requestId}
```

В ответах уже посчитаны удобные поля:

- `totalDurationMs` — сколько идет/шла задача целиком;
- `queueWaitMs` — сколько часть ждала до старта обработки;
- `runningMs` — сколько часть уже выполняется или выполнялась;
- `workerId`, `attemptId` — кто и какой попыткой взял часть.

Статус основного запроса обычно меняется так:

```text
QUEUED -> IN_PROGRESS -> READY
```
