import cors, { CorsOptions } from 'cors';
import { IHttpServer } from '~src/http-server';
export function EnableCors(options?: CorsOptions) {
  return function <T extends new (...args: any[]) => IHttpServer>(target: T) {
    return class extends target {
      constructor(...args: any[]) {
        super(...args);
      }

      async start(): Promise<void> {
        this._app.use(cors(options));
        await super.start();
      }
    };
  };
}
