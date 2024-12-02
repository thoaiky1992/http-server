import { createNamespace } from 'cls-hooked';
import EventEmitter from 'events';

type SessionManagerUser = Record<string, unknown> | undefined;

/**
 * Extension for Session Manager
 * To Support authentication storage
 *
 */
export class SessionManager {
  private static _instance: SessionManager;
  private readonly USER_SESSION_NAME: string = 'user';
  private session;

  constructor() {
    this.session = createNamespace(this.USER_SESSION_NAME);
  }

  public setUser(user: SessionManagerUser) {
    this.session.set(this.USER_SESSION_NAME, user);
  }

  static setUser(user: SessionManagerUser) {
    this.instance.setUser(user);
  }

  public getUser<T>(): SessionManagerUser & T {
    return this.session.get(this.USER_SESSION_NAME);
  }

  static getUser<T>(): SessionManagerUser & T {
    return this.instance.getUser<T>();
  }

  public bindEmitter(emitter: EventEmitter): void {
    this.session.bindEmitter(emitter);
  }

  static bindEmitter(emitter: EventEmitter): void {
    this.instance.bindEmitter(emitter);
  }

  public run(fn: (...args: any[]) => void): void {
    this.session.run(fn);
  }

  static run(fn: (...args: any[]) => void): void {
    this.instance.run(fn);
  }

  public static get instance(): SessionManager {
    return this._instance || (this._instance = new SessionManager());
  }
}
