import express from 'express';
import pino from 'pino';
import { Pool } from 'pg';
import { PreferencesRepository } from './repositories/preferences';
import { PoliciesRepository } from './repositories/policies';
import { PreferencesService } from './services/preferences';
import { EvaluateService } from './services/evaluate';
import { preferencesRouter } from './routes/preferences';
import { evaluateRouter } from './routes/evaluate';
import { requestLogger } from './middleware/request-logger';
import { errorHandler } from './middleware/error-handler';

export function createApp(pool: Pool) {
  const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

  const preferencesRepo = new PreferencesRepository(pool);
  const policiesRepo = new PoliciesRepository(pool);
  const preferencesService = new PreferencesService(preferencesRepo);
  const evaluateService = new EvaluateService(preferencesRepo, policiesRepo);

  const app = express();
  app.use(express.json());
  app.use(requestLogger(logger));

  app.use('/users', preferencesRouter(preferencesService, logger));
  app.use('/evaluate', evaluateRouter(evaluateService, logger));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(errorHandler(logger));

  return app;
}
