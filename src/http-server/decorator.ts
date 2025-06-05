import { StatusCodes } from 'http-status-codes';
import { handleMetaDataRoute, handleMetadataUpload, handleParameter, handleValidateBody, MetaDataKey } from './handler';
import { AuthForRouteType, parameterMetaDataKeyEnum } from './types';
import { RequestHandler } from 'express';

export function EnableServer() {
  return function <T extends new (...args: any[]) => any>(target: T) {
    return class extends target {
      constructor(...args: any[]) {
        super(...args);
      }
      async start(): Promise<void> {
        await super.start();
        await super.listen();
      }
    };
  };
}

export function ApplyProtectRoute(fnc: RequestHandler) {
  return function <T extends new (...args: any[]) => any>(target: T) {
    return class extends target {
      constructor(...args: any[]) {
        super(...args);
        this._protectRouteMiddleware = fnc;
      }
    };
  };
}

export function Authorized(): ClassDecorator & MethodDecorator {
  return (target: any, propertyKey?: string | symbol, _?: PropertyDescriptor) => {
    if (propertyKey) {
      Reflect.defineMetadata(MetaDataKey.auth, true, target.constructor, propertyKey);
    } else {
      Reflect.defineMetadata(MetaDataKey.auth, true, target);
    }
  };
}

export function Controller(prefix: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(MetaDataKey.prefix, prefix, target);
    if (!Reflect.hasMetadata(MetaDataKey.routes, target)) {
      Reflect.defineMetadata(MetaDataKey.routes, [], target);
    }
  };
}
export function AuthForRoutes(list: AuthForRouteType[]): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(MetaDataKey.authForBaseRoute, list, target);
  };
}

export function GET(path = ''): MethodDecorator {
  return handleMetaDataRoute(path, 'get');
}
export function POST(path = ''): MethodDecorator {
  return handleMetaDataRoute(path, 'post');
}
export function PUT(path = ''): MethodDecorator {
  return handleMetaDataRoute(path, 'put');
}
export function PATCH(path = ''): MethodDecorator {
  return handleMetaDataRoute(path, 'patch');
}
export function DELETE(path = ''): MethodDecorator {
  return handleMetaDataRoute(path, 'delete');
}

export function HttpCode(statusCode: StatusCodes) {
  return (target: any, propertyKey: string | symbol, _: PropertyDescriptor) => {
    Reflect.defineMetadata(MetaDataKey.httpCode, statusCode, target.constructor, propertyKey);
  };
}
export const Body = () => handleParameter(parameterMetaDataKeyEnum.body);
export const Req = () => handleParameter(parameterMetaDataKeyEnum.request);
export const Res = () => handleParameter(parameterMetaDataKeyEnum.response);
export const Params = () => handleParameter(parameterMetaDataKeyEnum.params);
export const Query = () => handleParameter(parameterMetaDataKeyEnum.query);

export function UploadMultiFile(fileName: string) {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    handleMetadataUpload(target, propertyKey, parameterIndex, fileName, 'array');
  };
}

export function UploadFile(fileName: string) {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    handleMetadataUpload(target, propertyKey, parameterIndex, fileName, 'single');
  };
}
export function UseValidateBodyDTO(type: any) {
  return (target: any, propertyKey: string | symbol, _: PropertyDescriptor) => {
    handleValidateBody(target, propertyKey, type);
  };
}
