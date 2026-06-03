import { Request, Response, NextFunction } from 'express';
import { Logger } from 'pino';

export function requestLogger(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
      logger.info({
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: Date.now() - start,
      });
    });

    next();
  };
}
