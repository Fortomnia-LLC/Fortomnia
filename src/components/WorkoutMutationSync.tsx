import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

import { workoutLocalStore } from "../lib/workoutLocalStore";
import { type WorkoutSyncStatus } from "../lib/workoutSyncStatus";
import {
  isWorkoutSyncActive,
  subscribeWorkoutSyncActivity,
} from "../lib/workoutSyncActivity";
import { useAuth } from "../providers/AuthProvider";
import { workoutRepository } from "../repositories/supabaseWorkoutRepository";

type WorkoutSyncContextValue = {
  pendingCount: number;
  retry: () => Promise<void>;
  status: WorkoutSyncStatus;
};

const WorkoutSyncContext = createContext<WorkoutSyncContextValue | undefined>(undefined);

export function WorkoutSyncProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [status, setStatus] = useState<WorkoutSyncStatus>("synced");
  const accountGenerationRef = useRef(0);
  const syncRequestRef = useRef(0);
  const userId = session?.user.id;

  const sync = useCallback(async () => {
    if (!userId) return;
    const accountGeneration = accountGenerationRef.current;
    const request = ++syncRequestRef.current;
    setStatus("syncing");
    try {
      const result = await workoutRepository.syncPendingMutations(userId);
      if (
        accountGeneration !== accountGenerationRef.current ||
        request !== syncRequestRef.current
      ) return;
      setPendingCount(result.pending);
      setStatus(
        result.failure === "attention"
          ? "attention"
          : result.failure === "offline" || result.pending > 0
            ? "offline"
            : "synced",
      );
    } catch {
      const state = await workoutLocalStore.load(userId);
      if (
        accountGeneration !== accountGenerationRef.current ||
        request !== syncRequestRef.current
      ) return;
      setPendingCount(state.pendingMutations.length);
      setStatus(state.pendingMutations.length > 0 ? "offline" : "attention");
    }
  }, [userId]);

  useEffect(() => {
    const generation = ++accountGenerationRef.current;
    if (!userId) {
      setPendingCount(0);
      setStatus("synced");
      return;
    }

    let active = true;
    void workoutLocalStore.load(userId).then((state) => {
      if (!active) return;
      setPendingCount(state.pendingMutations.length);
      if (state.pendingMutations.length > 0) setStatus("offline");
    });
    void sync();
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void sync();
    });
    const storeSubscription = workoutLocalStore.subscribe(userId, (state) => {
      if (!active) return;
      setPendingCount(state.pendingMutations.length);
      if (isWorkoutSyncActive(userId)) setStatus("syncing");
      else if (state.pendingMutations.length > 0) setStatus("offline");
      else setStatus((current) => current === "syncing" ? current : "synced");
    });
    const activitySubscription = subscribeWorkoutSyncActivity(
      userId,
      (isActive) => {
        if (!active || generation !== accountGenerationRef.current) return;
        if (isActive) {
          setStatus("syncing");
          return;
        }
        void workoutLocalStore.load(userId).then((state) => {
          if (!active || generation !== accountGenerationRef.current) return;
          setPendingCount(state.pendingMutations.length);
          setStatus((current) =>
            current === "syncing"
              ? state.pendingMutations.length > 0
                ? "offline"
                : "synced"
              : current,
          );
        });
      },
    );

    return () => {
      active = false;
      if (generation === accountGenerationRef.current) {
        accountGenerationRef.current += 1;
      }
      appStateSubscription.remove();
      storeSubscription();
      activitySubscription();
    };
  }, [sync, userId]);

  const value = useMemo(
    () => ({ pendingCount, retry: sync, status }),
    [pendingCount, status, sync],
  );
  return (
    <WorkoutSyncContext.Provider value={value}>
      {children}
    </WorkoutSyncContext.Provider>
  );
}

export function useWorkoutSync(): WorkoutSyncContextValue {
  const context = useContext(WorkoutSyncContext);
  if (!context) throw new Error("useWorkoutSync must be used within WorkoutSyncProvider");
  return context;
}
