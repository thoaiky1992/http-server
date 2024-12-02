import {
  container,
  InjectionToken,
  ValueProvider,
  FactoryProvider,
  ClassProvider,
  DependencyContainer,
  registry,
  singleton,
  injectable,
  inject,
  autoInjectable,
  RegistrationOptions,
  scoped
} from 'tsyringe';
export {
  InjectionToken,
  ValueProvider,
  FactoryProvider,
  ClassProvider,
  DependencyContainer,
  Lifecycle,
  RegistrationOptions,
  instanceCachingFactory,
  instancePerContainerCachingFactory
} from 'tsyringe';

export const Registry = registry;
export const Singleton = singleton;
export const Injectable = injectable;
export const AutoInjectable = autoInjectable;
export const Inject = inject;
export const Scoped = scoped;

export class AppContainer {
  static register(
    token: InjectionToken<unknown>,
    provider: ValueProvider<unknown>,
    options?: RegistrationOptions
  ): DependencyContainer;
  static register<T>(
    token: InjectionToken<T>,
    provider: FactoryProvider<T>,
    options?: RegistrationOptions
  ): DependencyContainer;
  static register<T>(
    token: InjectionToken<T>,
    provider: ValueProvider<T>,
    options?: RegistrationOptions
  ): DependencyContainer;
  static register<T>(
    token: InjectionToken<T>,
    provider: ClassProvider<T>,
    options?: RegistrationOptions
  ): DependencyContainer;

  static register(token: any, provider: any, options?: RegistrationOptions): DependencyContainer {
    return container.register(token, provider, options);
  }

  /**
   * Resolve a dependency from container
   */
  static resolve<T>(token: InjectionToken<T>, defaultProvider?: any, options?: RegistrationOptions): T;
  static resolve(token: InjectionToken, defaultProvider?: any, options?: RegistrationOptions): unknown {
    /**
     * 1. try to resolve
     * 2. fallback: autoRegister
     */
    try {
      return container.resolve(token);
    } catch (e) {
      if (!defaultProvider) throw e;
      container.register(token, defaultProvider, options);

      return container.resolve(token);
    }
  }

  /**
   * Check a token is existed
   * @param token
   * @returns
   */
  static isRegistered(token: InjectionToken): boolean {
    return container.isRegistered(token);
  }

  /**
   * Resolve multiple instance of a abstraction
   * @param token
   * @returns
   */
  static resolveAll<T>(token: InjectionToken<T>): T[] {
    return container.resolveAll<T>(token);
  }
}
