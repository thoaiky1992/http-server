declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_NAME: string;
      APP_PORT: number;

      JWT_SECRET: string;
      // Elastic Search
      ES_NODE: string;
      ELASTIC_PASSWORD: string;
      ES_VERSION: string;

      KAFKA_CLIENT_ID: string;
      KAFKA_BROKERS: string;
      KAFKA_COMSUMER_GROUP_ID: string;
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload | undefined;
  }
}

export {};
