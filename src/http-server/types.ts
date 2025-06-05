import { ErrorRequestHandler, Express as ExpressType, RequestHandler } from 'express';
import { IncomingMessage, Server, ServerResponse } from 'http';

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
  protected _app!: ExpressType;
  protected _http!: Server<typeof IncomingMessage, typeof ServerResponse>;
  protected _middlewares!: RequestHandler[];
  protected _errorMiddleware?: ErrorRequestHandler | undefined;
  protected _protectRouteMiddleware?: RequestHandler | undefined;

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
