import express, { ErrorRequestHandler, RequestHandler } from 'express';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import ErrorMiddleware from '~src/middlewares/error.middleware';
import { initializeMiddlewareAndRoute, normalizePath } from './handler';
import { IHttpServer } from './types';

export class HttpServer extends IHttpServer {
  private address!: AddressInfo;
  private port: number;
  private prefixApi: string;
  private static _instance: HttpServer;

  constructor(port: number) {
    super();
    this.port = port;
    this.prefixApi = '/api';
    this._middlewares = [];
    this._app = express();
    this._http = createServer(this._app);
  }

  public async start(): Promise<void> {
    // this._app.use(express.json());
    this._app.use(express.static('public'));

    this._middlewares.forEach((_middleware) => this._app.use(_middleware));

    /** Initialize Middlewares and Routes */
    initializeMiddlewareAndRoute(this._app, this.prefixApi, this);

    /** Apply Error Middleware */

    this._app.use(this._errorMiddleware ?? ErrorMiddleware);
  }

  public get app() {
    return this._app;
  }

  public get http() {
    return this._http;
  }

  public get protectRouteMiddleware() {
    return this._protectRouteMiddleware;
  }

  public setPrefixApi(prefixApi: string) {
    this.prefixApi = prefixApi;
  }

  public applyMiddlewares(middlewares: RequestHandler[]) {
    this._middlewares = middlewares;
  }


  public applyErrorMiddleware(errorMiddleware: ErrorRequestHandler) {
    this._errorMiddleware = errorMiddleware;
  }

  public async stop(): Promise<void> {
    await new Promise<void>((resolve) =>
      this._http.close(() => {
        resolve();
      })
    );
  }

  public async listen(): Promise<void> {
    await new Promise<void>((resolve) =>
      this._http.listen(this.port, () => {
        this.address = this._http.address() as AddressInfo;
        console.log(`🚀 Server ready at http://localhost:${this.address.port}${normalizePath(this.prefixApi, '')}`);
        resolve();
      })
    );
  }

  public static getInstance(port: number) {
    if (this._instance) return this._instance;
    this._instance = new HttpServer(port);
    return this._instance;
  }
  public static start(port: number) {
    return this.getInstance(port).start();
  }
}
