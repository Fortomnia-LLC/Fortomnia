import type { WatchWorkoutAction, WatchWorkoutSnapshot } from "./watchWorkoutContract.ts";
import { isWatchWorkoutAction } from "./watchWorkoutContract.ts";

export type WatchConnectionState = {
  supported: boolean;
  activated: boolean;
  paired: boolean;
  appInstalled: boolean;
  reachable: boolean;
};

export type WatchConnectivityAdapter = {
  sendWorkoutSnapshot(snapshotJson: string): Promise<WatchConnectionState>;
  acknowledgeActions(actionIds: string[]): Promise<void>;
};

export async function transferWorkoutSnapshot(
  adapter: WatchConnectivityAdapter,
  snapshot: WatchWorkoutSnapshot,
): Promise<WatchConnectionState> {
  return adapter.sendWorkoutSnapshot(JSON.stringify(snapshot));
}

export function parseWatchActions(actionsJson: string): WatchWorkoutAction[] {
  try {
    const value: unknown = JSON.parse(actionsJson);
    return Array.isArray(value) ? value.filter(isWatchWorkoutAction) : [];
  } catch {
    return [];
  }
}

export async function acknowledgeProcessedWatchActions(
  adapter: WatchConnectivityAdapter,
  processed: WatchWorkoutAction[],
): Promise<void> {
  const ids = [...new Set(processed.map(({ actionId }) => actionId))];
  if (ids.length > 0) await adapter.acknowledgeActions(ids);
}
