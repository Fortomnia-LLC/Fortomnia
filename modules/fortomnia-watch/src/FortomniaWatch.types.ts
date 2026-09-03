export type NativeWatchState = {
  supported: boolean;
  activated: boolean;
  paired: boolean;
  appInstalled: boolean;
  reachable: boolean;
};

export type NativeWatchActionsEvent = {
  actionsJson: string;
};

export type NativeWatchStateEvent = NativeWatchState;
