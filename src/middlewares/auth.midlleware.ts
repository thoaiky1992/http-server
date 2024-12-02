import { Request, Response, NextFunction } from 'express';
import { HttpException } from '~src/http-server';

export function authMiddleware(_req: Request, _res: Response, next: NextFunction) {
  if (!_req.user) throw new HttpException(401);
  next();
}
