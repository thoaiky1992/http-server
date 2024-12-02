import { Express as ExpressType, NextFunction, RequestHandler } from 'express';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { HttpException } from './http-exception';
import { TErrorMiddleware } from '~src/middlewares/error.middleware';

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';
export enum parameterMetaDataKeyEnum {
  body = 'body',
  request = 'request',
  response = 'response',
  multiFile = 'multiFile',
  singleFile = 'singleFile',
  params = 'params',
  query = 'query'
}
export type RouteType = {
  method: HttpMethod;
  propertyKey: string | symbol;
  path: string;
  middlewares: RequestHandler[];
};

export abstract class IHttpServer {
  _app!: ExpressType;
  _http!: Server<typeof IncomingMessage, typeof ServerResponse>;
  _middlewares!: RequestHandler[];
  _errorMiddleware?: TErrorMiddleware;

  async start(): Promise<void> {}
  async stop(): Promise<void> {}
  async listen(): Promise<void> {}
}

export type parameterMetaDataKeyEnumType = keyof typeof parameterMetaDataKeyEnum;
export type parameterMetaDataType = Record<parameterMetaDataKeyEnumType, string>;

export type AuthForRouteType = { path: string; method: HttpMethod };

export type CrudControllerRouteKeyType =
  | 'GetMany'
  | 'GetOne'
  | 'CreateOne'
  | 'CreateMany'
  | 'UpdateMany'
  | 'UpdateOne'
  | 'DeleteMany'
  | 'DeleteOne';
export type CrudControllerRouteValueType = { method: HttpMethod; path: string };
export type CrudControllerRouteType = Record<CrudControllerRouteKeyType, CrudControllerRouteValueType>;
