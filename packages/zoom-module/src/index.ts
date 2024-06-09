import {
  NativeModulesProxy,
  EventEmitter,
  Subscription,
} from "expo-modules-core";

// Import the native module. On web, it will be resolved to ZoomModule.web.ts
// and on native platforms to ZoomModule.ts
import ZoomModule from "./ZoomModule";
import { ChangeEventPayload } from "./ZoomModule.types";

// Get the native constant value.
export const PI = ZoomModule.PI;

export const hello = ZoomModule.hello;

export async function initialize(jwt: string) {
  return await ZoomModule.initialize(jwt);
}

export async function joinMeeting(
  zak: string,
  displayName: string,
  meetingNumber: string
) {
  return await ZoomModule.joinMeeting(zak, displayName, meetingNumber);
}

const emitter = new EventEmitter(ZoomModule ?? NativeModulesProxy.ZoomModule);

export function addChangeListener(
  listener: (event: ChangeEventPayload) => void
): Subscription {
  return emitter.addListener<ChangeEventPayload>("onChange", listener);
}

export { ChangeEventPayload };
