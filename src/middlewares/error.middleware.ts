import { NextFunction, Request, Response } from 'express';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { HttpException } from '~src/http-server/http-exception';

// eslint-disable-next-line no-unused-vars
function ErrorMiddleware(error: HttpException, req: Request, res: Response, nextFunc: NextFunction) {
  const statusCode = error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  let message = error?.message || getReasonPhrase(statusCode);

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    message = getReasonPhrase(statusCode);
  }
  res.status(statusCode).json({ statusCode, message });
}
export default ErrorMiddleware;
