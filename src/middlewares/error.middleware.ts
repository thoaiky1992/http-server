import { NextFunction, Request, Response } from 'express';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { HttpException } from '~src/http-server/http-exception';
import { Logger } from '~src/logger';

// eslint-disable-next-line no-unused-vars
function ErrorMiddleware(error: HttpException, request: Request, res: Response, _: NextFunction) {
  Logger.error('ErrorMiddleware', error?.message || getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR), {
    request,
    stack: error?.stack || ''
  });
  const statusCode = error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = error?.message || getReasonPhrase(statusCode);
  res.status(statusCode).json({ statusCode, message });
}

export default ErrorMiddleware;
