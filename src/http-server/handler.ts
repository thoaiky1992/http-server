import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Express, NextFunction, Request, Response } from 'express';
import * as fs from 'fs';
import { ServerResponse } from 'http';
import { StatusCodes } from 'http-status-codes';
import 'multer';
import multer from 'multer';
import * as path from 'path';
import { AppContainer } from '../container';
import { HttpServer } from './http-server';
import {
  AuthForRouteType,
  HttpMethod,
  parameterMetaDataKeyEnum,
  parameterMetaDataKeyEnumType,
  parameterMetaDataType,
  RouteType
} from './types';

export enum MetaDataKey {
  auth = 'auth',
  middlewares = 'middlewares',
  prefix = 'prefix',
  routes = 'routes',
  httpCode = 'httpCode',
  authForBaseRoute = 'authForBaseRoute',
  protectRoute = 'protectRoute'
}

export function handleValidateBody(target: any, propertyKey: string | symbol, type: any) {
  const { defineMetadata, getMetadata } = Reflect;
  const routes: RouteType[] = getMetadata(MetaDataKey.routes, target.constructor) || [];
  const routeIndex = routes.findIndex((route) => route.propertyKey == propertyKey);
  const middlware = async (req: Request, res: Response, next: NextFunction) => {
    const instance = plainToInstance(type, req.body);
    const errors = await validate(instance);
    if (!errors.length) next();
    else res.status(StatusCodes.BAD_REQUEST).json({ statusCode: StatusCodes.BAD_REQUEST, errors });
  };
  routes[routeIndex]?.middlewares.unshift(middlware);
  defineMetadata(MetaDataKey.routes, routes, target.constructor, propertyKey);
}

export function handleMetaDataRoute(path = '', method: HttpMethod) {
  return (target: any, propertyKey: string | symbol, _: PropertyDescriptor) => {
    if (!Reflect.hasMetadata(MetaDataKey.routes, target.constructor)) {
      Reflect.defineMetadata(MetaDataKey.routes, [], target.constructor);
    }
    const routes = Reflect.getMetadata(MetaDataKey.routes, target.constructor) as Array<RouteType>;
    const isExistRoute = routes.some(
      (r: RouteType) => r.method === method && r.path === path && r.propertyKey === propertyKey
    );
    if (!isExistRoute) {
      const route: RouteType = { method, propertyKey, path, middlewares: [] };
      routes.unshift(route);
    }
    Reflect.defineMetadata(MetaDataKey.routes, routes, target.constructor);
  };
}

export function handleParameter(metaDataKey: parameterMetaDataKeyEnum) {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    const existingParameters: any[] = Reflect.getMetadata(metaDataKey, target.constructor, propertyKey) || [];
    existingParameters.push(parameterIndex);
    Reflect.defineMetadata(metaDataKey, existingParameters, target.constructor, propertyKey);
  };
}

export function handleMetadataUpload(
  target: any,
  propertyKey: string | symbol,
  parameterIndex: number,
  fileName: string,
  type: 'array' | 'single'
) {
  const { getMetadata, defineMetadata } = Reflect;
  const middlewares = getMetadata(MetaDataKey.middlewares, target.constructor, propertyKey) || [];
  middlewares.push(multer()[type](fileName));
  defineMetadata(MetaDataKey.middlewares, middlewares, target.constructor, propertyKey);

  const paramKey = type === 'array' ? parameterMetaDataKeyEnum.multiFile : parameterMetaDataKeyEnum.singleFile;
  const params: any[] = getMetadata(paramKey, target.constructor, propertyKey) || [];
  params.push(parameterIndex);
  defineMetadata(paramKey, params, target.constructor, propertyKey);
}

const parameterMetaData: parameterMetaDataType = {
  [parameterMetaDataKeyEnum.body]: 'req.body',
  [parameterMetaDataKeyEnum.request]: 'req',
  [parameterMetaDataKeyEnum.response]: 'res',
  [parameterMetaDataKeyEnum.query]: 'req.query',
  [parameterMetaDataKeyEnum.params]: 'req.params',
  [parameterMetaDataKeyEnum.multiFile]: 'req.files',
  [parameterMetaDataKeyEnum.singleFile]: 'req.file'
};

export async function responseInterceptor(
  target: any,
  instance: any,
  propertyKey: string | symbol,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const args: any[] = [];
  const { body, params, query } = parameterMetaDataKeyEnum;
  for (const key in parameterMetaData) {
    const parameters: number[] = Reflect.getMetadata(key, target, propertyKey) || [];
    for (const index of parameters) {
      if ([body, query, params].includes(key as parameterMetaDataKeyEnum)) {
        args[index] = Object.assign({}, eval(parameterMetaData[key as parameterMetaDataKeyEnumType]));
      } else {
        args[index] = eval(parameterMetaData[key as parameterMetaDataKeyEnumType]);
      }
    }
  }
  try {
    let result = instance[propertyKey](...args);
    if (result instanceof Promise) {
      result = await result;
    }
    if (!res.headersSent && !(result instanceof ServerResponse)) {
      const httpCode = Reflect.getMetadata(MetaDataKey.httpCode, target, propertyKey);
      const statusCode = httpCode ?? 200;
      res.status(statusCode).json({ data: result ?? null, statusCode });
    }
  } catch (error) {
    next(error);
  }
}

export function normalizePath(prefix: string, path: string) {
  let str = prefix.replace(/^\/+/, '/').replace(/^(?!\/)/, '/');
  if (path) str += path.replace(/^\/+/, '/').replace(/^(?!\/)/, '/');
  return str.replace(/\/+/g, '/');
}

/**
 * Recursively finds folders named 'controllers' and reads all files within them.
 * @param {string} dir - The starting directory to search.
 * @returns {void}
 */
function findAndReadControllers(dir: string, folders: string[] = []) {
  // Read the directory content
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name === 'controllers') {
        folders.push(fullPath);
      } else {
        // Continue searching in subdirectories
        findAndReadControllers(fullPath, folders);
      }
    }
  }
}

export async function initializeMiddlewareAndRoute(app: Express, prefixApi: string, _httpServer: HttpServer) {
  // Xác định phần mở rộng file cần tìm dựa trên NODE_ENV
  const isProduction = process.env.NODE_ENV === 'production';

  const controllerFolders: string[] = [];
  findAndReadControllers(process.cwd(), controllerFolders);

  // Start searching controller path with NODE_ENV
  let controllerPaths: string[] = [];
  for (const controllerFolder of controllerFolders) {
    const filePaths = fs
      .readdirSync(controllerFolder)
      .filter((path) => path.endsWith(`controller.${isProduction ? 'js' : 'ts'}`))
      .map((path) => `${controllerFolder}/${path}`);
    controllerPaths = [...controllerPaths, ...filePaths];
  }

  controllerPaths.forEach((controllerPath: any) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const controller = require(path.join(controllerPath)).default;
    const resolveController = AppContainer.resolve(controller);
    const prefix = Reflect.getMetadata(MetaDataKey.prefix, controller);
    const routes = Reflect.getMetadata(MetaDataKey.routes, controller);
    // check auth for all routes
    const classRequiresAuth = Reflect.getMetadata(MetaDataKey.auth, controller);

    routes.forEach((route: RouteType) => {
      const path = normalizePath(prefix, route.path);
      // check auth for only route
      const methodRequiresAuth = Reflect.getMetadata(MetaDataKey.auth, controller, route.propertyKey);

      const middlewares = Reflect.getMetadata(MetaDataKey.middlewares, controller, route.propertyKey) || [];
      const method: HttpMethod = route.method;
      // check auth for base route
      const authForBaseRoutes: AuthForRouteType[] = Reflect.getMetadata(MetaDataKey.authForBaseRoute, controller) || [];
      const isAuthForBaseRoute = authForBaseRoutes.some(
        (authForBaseRoute) =>
          authForBaseRoute.method === route.method && path === normalizePath(prefix, authForBaseRoute.path)
      );
      if ((classRequiresAuth || methodRequiresAuth || isAuthForBaseRoute) && _httpServer.protectRouteMiddleware) {
        route.middlewares.unshift(_httpServer.protectRouteMiddleware);
      }
      app[method](
        normalizePath(prefixApi, path),
        [...middlewares, ...route.middlewares],
        (req: Request, res: Response, next: NextFunction) => {
          responseInterceptor(controller, resolveController, route.propertyKey, req, res, next);
        }
      );
    });
  });
}
