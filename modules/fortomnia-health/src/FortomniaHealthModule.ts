import { requireNativeModule } from "expo";
import type {
  NativeHealthAnchors,
  NativeHealthChanges,
  NativeHealthConnectChanges,
  NativeHealthDataChangedEvent,
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
  grantedRead?: NativeHealthMetric[];
  grantedWrite: NativeHealthMetric[];
  deniedWrite: NativeHealthMetric[];
};

type FortomniaHealthNativeModule = {
  addListener(
    eventName: "onHealthDataChanged",
    listener: (event: NativeHealthDataChangedEvent) => void,
  ): { remove(): void };
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
  createChangesTokens(metrics: NativeHealthMetric[]): Promise<NativeHealthAnchors>;
  readChanges(
    metrics: NativeHealthMetric[],
    tokens: NativeHealthAnchors,
  ): Promise<NativeHealthConnectChanges>;
  enableBackgroundDelivery(
    metrics: NativeHealthMetric[],
  ): Promise<NativeHealthMetric[]>;
  disableBackgroundDelivery(): Promise<void>;
};

export default requireNativeModule<FortomniaHealthNativeModule>("FortomniaHealth");
