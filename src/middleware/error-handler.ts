import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Logger } from 'pino';

export function errorHandler(logger: Logger) {
  return (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
      res.status(400).json({
        error: 'validation_error',
        details: err.issues.map(i => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }

    logger.error({ err }, 'unhandled error');
    res.status(500).json({ error: 'internal_server_error' });
  };
}
