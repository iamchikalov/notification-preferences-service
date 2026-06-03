import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PreferencesService } from '../services/preferences';
import { Logger } from 'pino';

const updateSchema = z.object({
  preferences: z.array(z.object({
    notificationType: z.enum(['transactional', 'marketing']),
    channel: z.enum(['email', 'sms', 'push']),
    enabled: z.boolean(),
  })).optional(),
  quietHours: z.object({
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    timezone: z.string().min(1),
  }).optional(),
}).refine(data => data.preferences || data.quietHours, {
  message: 'At least one of preferences or quietHours must be provided',
});

export function preferencesRouter(service: PreferencesService, logger: Logger) {
  const router = Router();

  router.get('/:userId/preferences', async (req: Request<{ userId: string }>, res: Response, next: NextFunction) => {
    try {
      const result = await service.get(req.params.userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:userId/preferences', async (req: Request<{ userId: string }>, res: Response, next: NextFunction) => {
    try {
      const body = updateSchema.parse(req.body);
      const userId = req.params.userId;
      await service.update(userId, body.preferences as any, body.quietHours);

      logger.info({
        userId,
        changes: {
          preferences: body.preferences?.length ?? 0,
          quietHours: !!body.quietHours,
        },
      }, 'preferences updated');

      const updated = await service.get(userId);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
