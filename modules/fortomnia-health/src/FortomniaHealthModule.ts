import { requireNativeModule } from "expo";
import type { NativeHealthMetric, NativeHealthSample } from "./FortomniaHealth.types";
type FortomniaHealthNativeModule = { isAvailable(): boolean; requestAuthorization(read: NativeHealthMetric[], write: NativeHealthMetric[]): Promise<boolean>; readSamples(metrics: NativeHealthMetric[], startAt: string, endAt: string): Promise<NativeHealthSample[]>; };
export default requireNativeModule<FortomniaHealthNativeModule>("FortomniaHealth");
