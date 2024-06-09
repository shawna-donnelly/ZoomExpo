import { NativeModulesProxy, EventEmitter } from "expo-modules-core";

// Import the native module. On web, it will be resolved to ZoomModule.web.ts
// and on native platforms to ZoomModule.ts
import ZoomModule from "./ZoomModule";

// Get the native constant value.
export const PI = ZoomModule.PI;

export function hello(): string {
  return ZoomModule.hello();
}

export async function setValueAsync(value: string) {
  return await ZoomModule.setValueAsync(value);
}

const emitter = new EventEmitter(ZoomModule ?? NativeModulesProxy.ZoomModule);
