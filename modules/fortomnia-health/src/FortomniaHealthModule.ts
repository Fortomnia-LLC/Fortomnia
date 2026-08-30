import { requireNativeModule } from "expo";
import type { NativeHealthMetric, NativeHealthSample } from "./FortomniaHealth.types";

export type NativeHealthAuthorizationRequestStatus =
  | "should_request"
  | "unnecessary"
  | "unknown"
  | "unavailable";

type FortomniaHealthNativeModule = {
  isAvailable(): boolean;
  getAuthorizationRequestStatus(
    read: NativeHealthMetric[],
    write: NativeHealthMetric[],
  ): Promise<NativeHealthAuthorizationRequestStatus>;
  requestAuthorization(
    read: NativeHealthMetric[],
    write: NativeHealthMetric[],
  ): Promise<boolean>;
  readSamples(
    metrics: NativeHealthMetric[],
    startAt: string,
    endAt: string,
  ): Promise<NativeHealthSample[]>;
};

export default requireNativeModule<FortomniaHealthNativeModule>("FortomniaHealth");
