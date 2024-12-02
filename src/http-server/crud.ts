import { CrudControllerRouteType } from './types';

export const CrudControllerRoutes: CrudControllerRouteType = {
  GetMany: { method: 'get', path: '' },
  GetOne: { method: 'get', path: ':id' },
  CreateOne: { method: 'post', path: '' },
  CreateMany: { method: 'post', path: '/bulk-create' },
  UpdateMany: { method: 'put', path: '' },
  UpdateOne: { method: 'put', path: ':id' },
  DeleteMany: { method: 'delete', path: '' },
  DeleteOne: { method: 'delete', path: ':id' }
};
