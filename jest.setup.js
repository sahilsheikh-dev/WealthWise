globalThis.expo = globalThis.expo ?? {};
if (!globalThis.expo.modules) {
  Object.defineProperty(globalThis.expo, 'modules', {
    value: {},
    configurable: true,
    writable: true,
  });
}
if (!globalThis.expo.modules.ExpoModulesCoreJSLogger) {
  Object.defineProperty(globalThis.expo.modules, 'ExpoModulesCoreJSLogger', {
    value: { addListener: jest.fn() },
    configurable: true,
    writable: true,
  });
}
