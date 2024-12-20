import chalk from 'chalk';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import moment from 'moment';
import * as winston from 'winston';

const FORMAT_DATETIME = 'DD-MM-YYYY HH:mm:ss';

// Define a custom log format with syntax highlighting for the console
const consoleFormat = winston.format.printf((ctx) => {
  const { level, message, timestamp, stack, content, request } = ctx;
  let lv = level;
  if (level === 'info') lv = 'log';
  if (level === 'warn') lv = 'info';
  let color = '#4FC1FF';
  switch (lv) {
    case 'info':
      color = '#fffc00';
      break;
    case 'error':
      color = '#ee0002';
      break;
    default:
      break;
  }
  const datetime = moment(timestamp as any).format(FORMAT_DATETIME);
  const formattedTimestamp = chalk.hex('#0BB976')(`[${datetime}]`);
  const formattedLevel = chalk.hex('#fffc00')(`${lv.toUpperCase()}`.padEnd(7, ' '));
  const formattedMessage = chalk.hex('#fffc00')(message ? `[${message}]` : '');
  const formattedContent = chalk.hex(color)(typeof content !== 'string' ? JSON.stringify(content) : content);
  const formattedStack = stack ? `\n${chalk.gray(stack)}` : '';
  if (request) {
    // const msg = chalk.hex('#ee0002')(message ? `${message}` : '');
    return `${formattedTimestamp} ${formattedLevel} ${formattedContent} ${formattedStack}`;
  }
  return `${formattedTimestamp} ${formattedLevel} ${formattedMessage} ${formattedContent} ${formattedStack}`;
});

// Define a custom log format
const logFileFormat = winston.format.printf(({ message, timestamp, stack, request, level, content }: any) => {
  let formatLog = '';
  let hyphen = '';
  Array.from({ length: 50 }).map((_) => (hyphen += ' -'));
  const datetime = moment(timestamp).format(FORMAT_DATETIME);
  if (request) {
    const { method, body, query, ip, path, user, headers } = request || {};
    formatLog = `[x-trace-id]: ${headers['x-trace-id']}`;
    formatLog += `\n[${datetime}] [${level}] ${path} ${method}`;
    formatLog += `\nuserId: ${user?.id ?? ''}`;
    formatLog += `\nbody: ${JSON.stringify(body)}`;
    formatLog += `\nquery: ${JSON.stringify(query)}`;
    formatLog += `\nip: ${ip}`;
    formatLog += `\nuser-agent: ${request?.get('user-agent') ?? ''}`;
    formatLog += `\nmessage: ${message || getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)}`;
    formatLog += `\nstack: ${stack}`;
    formatLog += `\n${hyphen}`;
    return formatLog;
  } else {
    const msg = message ? `[${message}]` : '';
    formatLog += `[${datetime}] ERROR ${msg} ${typeof content !== 'string' ? JSON.stringify(content) : content}`;
  }
  return formatLog;
});

// Combine formats for both console and file output
const combinedFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }), // Enable stack traces for errors
  logFileFormat
);

const TransportFile = (dir: string = `${process.cwd()}/logs`) =>
  new winston.transports.File({
    filename: dir + `/${moment().format('DD-MM-YYYY')}.error.log`,
    level: 'error',
    format: combinedFormat
  });

export class Logger {
  protected static __instance: Logger;
  protected __wintonLogger!: winston.Logger;

  constructor(options?: winston.LoggerOptions) {
    this.__wintonLogger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }), // Enable stack traces for errors
        winston.format.combine(
          // winston.format.colorize(), // Enable colorization for the console
          consoleFormat
        )
      ),
      transports: [new winston.transports.Console()],
      ...options
    });
  }

  public static get instance() {
    if (!this.__instance) {
      this.__instance = new Logger();
    }
    return this.__instance;
  }

  public static setInstance(options: winston.LoggerOptions) {
    this.__instance = new Logger(options);
  }

  public error(title = '', message: any, params: any = {}) {
    return this.__wintonLogger.error(title, { content: message, ...params });
  }
  static error(title = '', message: any, params: any = {}) {
    return this.instance.error(title, message, params);
  }
  public log(title = '', message: any, params: any = {}) {
    return this.__wintonLogger.info(title, { content: message, ...params });
  }
  static log(title = '', message: any, params: any = {}) {
    return this.instance.log(title, message, params);
  }
  public info(title = '', message: any, params: any = {}) {
    return this.__wintonLogger.warn(title, { content: message, ...params });
  }
  static info(title = '', message: any, params: any = {}) {
    return this.instance.info(title, message, params);
  }
}

/**
 * Logger Decorator
 *
 * @returns
 */
export function LoggerProperty(): PropertyDecorator {
  return (target, key): void => {
    Reflect.deleteProperty(target, key);
    Reflect.defineProperty(target, key, {
      get: () => Logger.instance,
      configurable: true
    });
  };
}
