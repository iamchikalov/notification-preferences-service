import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EvaluateService } from '../services/evaluate';
import { Logger } from 'pino';

const evaluateSchema = z.object({
  userId: z.string().min(1),
  notificationType: z.enum(['transactional', 'marketing']),
  channel: z.enum(['email', 'sms', 'push']),
  region: z.enum(['EU', 'US', 'APAC']),
  datetime: z.string().datetime(),
});

export function evaluateRouter(service: EvaluateService, logger: Logger) {
  const router = Router();

  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = evaluateSchema.parse(req.body);
      const result = await service.evaluate(body);

      logger.info({
        userId: body.userId,
        notificationType: body.notificationType,
        channel: body.channel,
        region: body.region,
        decision: result.decision,
        reason: result.reason,
      }, 'evaluate decision');

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
