import { requireNativeModule } from "expo";

import type {
  NativeWatchActionsEvent,
  NativeWatchState,
  NativeWatchStateEvent,
} from "./FortomniaWatch.types";

type Subscription = { remove(): void };

type FortomniaWatchNativeModule = {
  addListener(
    eventName: "onWatchActions",
    listener: (event: NativeWatchActionsEvent) => void,
  ): Subscription;
  addListener(
    eventName: "onWatchStateChanged",
    listener: (event: NativeWatchStateEvent) => void,
  ): Subscription;
  getState(): NativeWatchState;
  activate(): Promise<NativeWatchState>;
  sendWorkoutSnapshot(snapshotJson: string): Promise<NativeWatchState>;
  acknowledgeActions(actionIds: string[]): Promise<void>;
};

export default requireNativeModule<FortomniaWatchNativeModule>("FortomniaWatch");
