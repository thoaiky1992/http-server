import 'reflect-metadata';

export * from './logger';
export * from './http-server';
export * from './container';
export { TErrorMiddleware } from './middlewares';
export * from 'class-validator';
export * from 'class-transformer';
export * from 'http-status-codes';
import * as winstonIntance from 'winston';

export const winston = winstonIntance;
