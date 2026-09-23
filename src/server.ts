/**
 * 동네 SOS API. The 9 endpoints from contract/README.md.
 *
 * `npm run dev` locally (reads .env), `npm start` on Railway (the
 * platform sets DATABASE_URL and PORT).
 */

import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { DEVICE_ID_HEADER } from '../contract/types.ts';
import { requireAdmin } from './admin/auth.ts';
import { resolve, updateStatus } from './admin/reports.ts';
import { confirm, create, nearby } from './core/create.ts';
import { ApiFailure, isUuid } from './core/errors.ts';
import { classify, voiceDraft } from './core/optional.ts';
import { getReport } from './read/detail.ts';
import { getMap } from './read/map.ts';

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

// Method and path only. No query string (the bbox is coordinates) and no
// device id: never log exact coordinates together with X-Device-Id.
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Residents have no account: the X-Device-Id header is who they are.
// It must be a uuid, because it is the primary key of `devices`.
app.use('/api', (req, res, next) => {
  const device_id = req.get(DEVICE_ID_HEADER);
  if (isUuid(device_id)) res.locals.device_id = device_id.toLowerCase();
  next();
});

function requireDevice(_req: Request, res: Response, next: NextFunction) {
  if (!res.locals.device_id) throw new ApiFailure('invalid_payload');
  next();
}

// ─── resident: create path ────────────────────────────────────
app.post('/api/reports/nearby', requireDevice, nearby);
app.post('/api/reports', requireDevice, create);
app.post('/api/reports/:id/confirm', requireDevice, confirm);

// ─── resident: browse path ────────────────────────────────────
app.get('/api/reports', requireDevice, getMap);
app.get('/api/reports/:id', requireDevice, getReport);

// ─── optional helpers: always answer, never fail ──────────────
app.post('/api/classify', classify);
app.post('/api/voice/draft', voiceDraft);

// ─── admin: operator only ─────────────────────────────────────
app.patch('/api/admin/reports/:id/status', requireAdmin, updateStatus);
app.patch('/api/admin/reports/:id/resolve', requireAdmin, resolve);

// ─── everything else ──────────────────────────────────────────
app.use(() => {
  throw new ApiFailure('report_not_found');
});

// Express 5 sends errors from async handlers here by itself.
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // Malformed JSON body from express.json().
  const failure =
    error instanceof ApiFailure
      ? error
      : error instanceof SyntaxError
        ? new ApiFailure('invalid_payload')
        : new ApiFailure('internal');

  if (failure.code === 'internal') {
    // Only the message: a pg error can carry the query parameters.
    console.error(error instanceof Error ? error.message : String(error));
  }
  res.status(failure.status).json(failure.toBody());
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`동네 SOS API on :${port}`);
});
