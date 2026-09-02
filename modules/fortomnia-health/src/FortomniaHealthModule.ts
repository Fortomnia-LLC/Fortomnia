import { requireNativeModule } from "expo";
import type {
  NativeHealthAnchors,
  NativeHealthChanges,
  NativeHealthMetric,
  NativeHealthSample,
} from "./FortomniaHealth.types";

export type NativeHealthAuthorizationRequestStatus =
  | "should_request"
  | "unnecessary"
  | "unknown"
  | "unavailable";

export type NativeHealthAuthorizationResult = {
  available: boolean;
  requestCompleted: boolean;
  grantedWrite: NativeHealthMetric[];
  deniedWrite: NativeHealthMetric[];
};

type FortomniaHealthNativeModule = {
  isAvailable(): boolean;
  getAuthorizationRequestStatus(
    read: NativeHealthMetric[],
    write: NativeHealthMetric[],
  ): Promise<NativeHealthAuthorizationRequestStatus>;
  requestAuthorization(
    read: NativeHealthMetric[],
    write: NativeHealthMetric[],
  ): Promise<NativeHealthAuthorizationResult>;
  readSamples(
    metrics: NativeHealthMetric[],
    startAt: string,
    endAt: string,
  ): Promise<NativeHealthSample[]>;
  readAnchoredSamples(
    metrics: NativeHealthMetric[],
    startAt: string,
    endAt: string,
    anchors: NativeHealthAnchors,
  ): Promise<NativeHealthChanges>;
};

export default requireNativeModule<FortomniaHealthNativeModule>("FortomniaHealth");
