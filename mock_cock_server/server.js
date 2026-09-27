// server.js
// Мок-сервер для 동네 SOS.
// Отвечает на все 9 endpoint'ов из §11 архитектуры точно так же, как будет
// отвечать настоящий Node + Express бэкенд — но данные хранятся не в Postgres,
// а прямо в памяти (стартуют из fixtures.json). Перезапустил сервер — всё сбросилось.

const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');
const fixtures = require('./fixtures.json');

const app = express();
app.use(cors());          // без этого приложение с другого порта/домена получит ошибку CORS
app.use(express.json());  // парсим JSON-тело запроса в req.body

// Копируем фикстуры в рабочие массивы — сюда мы уже пишем и меняем данные.
// structuredClone делает глубокую копию, чтобы исходный fixtures.json не трогать.
let reports = structuredClone(fixtures.reports);
let reportPhotos = structuredClone(fixtures.report_photos);
let confirmations = structuredClone(fixtures.confirmations);
let statusLogs = structuredClone(fixtures.status_logs);

// Простой логгер — в консоли видно, что реально дёргает фронтенд
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// ---------------- вспомогательные функции ----------------

// Расстояние между двумя координатами в метрах (формула гаверсинуса)
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Заглушка формулы приоритета — реальную формулу даст backend-разработчик,
// мок просто должен возвращать правдоподобное число
function calcPriority(report) {
  const severityWeight = { low: 0, medium: 15, high: 30 }[report.severity] || 0;
  return Math.min(100, report.confirmation_count * 5 + severityWeight);
}

function findReport(id) {
  return reports.find((r) => r.id === id);
}

// ---------------- 1. POST /api/reports/nearby ----------------
// Ищет незакрытую заявку той же категории в радиусе 50 м от точки
app.post('/api/reports/nearby', (req, res) => {
  const { lat, lng, category } = req.body;
  if (lat == null || lng == null || !category) {
    return res.status(400).json({ error: 'нужны lat, lng и category' });
  }
  const match = reports.find(
    (r) =>
      r.category === category &&
      r.status !== 'resolved' &&
      distanceMeters(lat, lng, r.geom.lat, r.geom.lng) <= 50
  );
  res.json({ duplicate: match || null });
});

// ---------------- 2. POST /api/reports ----------------
// Создаёт новую заявку
app.post('/api/reports', (req, res) => {
  const { device_id, category, severity, description, address, lat, lng } = req.body;
  const report = {
    id: randomUUID(),
    device_id: device_id || null,
    category,
    severity: severity || 'medium',
    status: 'new',
    geom: { lat, lng },
    address: address || '',
    description: description || '',
    priority_score: 0,
    confirmation_count: 0,
    created_at: new Date().toISOString(),
    resolved_at: null,
  };
  report.priority_score = calcPriority(report);
  reports.push(report);
  res.status(201).json(report);
});

// ---------------- 3. POST /api/reports/:id/confirm ----------------
// 확인 +1 — подтверждение заявки другим жителем
app.post('/api/reports/:id/confirm', (req, res) => {
  const report = findReport(req.params.id);
  if (!report) return res.status(404).json({ error: 'заявка не найдена' });

  confirmations.push({
    id: randomUUID(),
    report_id: report.id,
    device_id: req.body.device_id || null,
    created_at: new Date().toISOString(),
  });
  report.confirmation_count += 1;
  report.priority_score = calcPriority(report);
  res.json(report);
});

// ---------------- 4. GET /api/reports?bbox=... ----------------
// Точки для карты. Настоящий сервер фильтрует по bbox и урезает поля —
// мок для простоты отдаёт все заявки лёгкими объектами
app.get('/api/reports', (req, res) => {
  const points = reports.map((r) => ({
    id: r.id,
    lat: r.geom.lat,
    lng: r.geom.lng,
    category: r.category,
    status: r.status,
    priority_score: r.priority_score,
  }));
  res.json(points);
});

// ---------------- 5. GET /api/reports/:id ----------------
// Полная карточка заявки: сама заявка + фото + история статусов
app.get('/api/reports/:id', (req, res) => {
  const report = findReport(req.params.id);
  if (!report) return res.status(404).json({ error: 'заявка не найдена' });

  res.json({
    ...report,
    photos: reportPhotos.filter((p) => p.report_id === report.id),
    status_history: statusLogs.filter((l) => l.report_id === report.id),
  });
});

// ---------------- 6. POST /api/classify ----------------
// Фото → категория. Настоящий сервер ходит во внешний Vision API,
// мок просто выдаёт случайную категорию с высокой "уверенностью"
app.post('/api/classify', (req, res) => {
  const categories = ['broken_sidewalk', 'broken_streetlight', 'illegal_parking', 'garbage_dump'];
  const category = categories[Math.floor(Math.random() * categories.length)];
  res.json({ category, confidence: Number((0.85 + Math.random() * 0.1).toFixed(2)) });
});

// ---------------- 7. POST /api/voice/draft ----------------
// Аудио → черновик заявки
app.post('/api/voice/draft', (req, res) => {
  res.json({
    category: 'broken_sidewalk',
    description: '(черновик из голоса — мок-текст, реальный сервер распознает аудио)',
    affected_group: 'pedestrians',
  });
});

// ---------------- 8. PATCH /api/admin/reports/:id/status ----------------
// Смена статуса оператором из админки
app.patch('/api/admin/reports/:id/status', (req, res) => {
  const report = findReport(req.params.id);
  if (!report) return res.status(404).json({ error: 'заявка не найдена' });

  const { status, admin_id, note } = req.body;
  statusLogs.push({
    id: randomUUID(),
    report_id: report.id,
    from_status: report.status,
    to_status: status,
    admin_id: admin_id || null,
    note: note || '',
    created_at: new Date().toISOString(),
  });
  report.status = status;
  res.json(report);
});

// ---------------- 9. PATCH /api/admin/reports/:id/resolve ----------------
// After-фото + 해결
app.patch('/api/admin/reports/:id/resolve', (req, res) => {
  const report = findReport(req.params.id);
  if (!report) return res.status(404).json({ error: 'заявка не найдена' });

  const { admin_id, after_photo_url } = req.body;
  reportPhotos.push({
    id: randomUUID(),
    report_id: report.id,
    kind: 'after',
    url: after_photo_url || '',
    thumb_url: after_photo_url || '',
    created_at: new Date().toISOString(),
  });
  statusLogs.push({
    id: randomUUID(),
    report_id: report.id,
    from_status: report.status,
    to_status: 'resolved',
    admin_id: admin_id || null,
    note: 'after-фото загружено',
    created_at: new Date().toISOString(),
  });
  report.status = 'resolved';
  report.resolved_at = new Date().toISOString();
  res.json(report);
});

// health-check — можно дёргать, чтобы проверить, что сервер жив
app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Мок-сервер 동네 SOS запущен: http://localhost:${PORT}`);
});
