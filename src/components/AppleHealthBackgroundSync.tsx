import { useEffect } from "react";
import { Platform } from "react-native";
import {
  addAppleHealthChangeListener,
  APPLE_HEALTH_RECOVERY_METRICS,
  enableAppleHealthBackgroundDelivery,
  syncAnchoredAppleHealthSamples,
} from "../lib/health/appleHealthProvider";
import { loadAppleHealthConnection, saveAppleHealthConnection } from "../lib/health/healthConnectionStorage";
import { getHealthQueryRange } from "../lib/health/healthNormalization";

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBefore(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() - amount);
  return dateKey(value);
}

async function syncIfConnected() {
  const connection = await loadAppleHealthConnection();
  if (!connection) return;
  const today = dateKey();
  await syncAnchoredAppleHealthSamples({
    metrics: APPLE_HEALTH_RECOVERY_METRICS,
    ...getHealthQueryRange(daysBefore(today, 28), today),
  });
  await saveAppleHealthConnection(new Date().toISOString());
}

export function AppleHealthBackgroundSync() {
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    let active = true;
    const run = () => {
      void syncIfConnected().catch((error) => {
        if (active) console.warn("Apple Health background sync failed", error instanceof Error ? error.name : "unknown");
      });
    };
    const subscription = addAppleHealthChangeListener(run);
    void loadAppleHealthConnection().then((connection) => {
      if (!active || !connection) return;
      void enableAppleHealthBackgroundDelivery().then(run).catch((error) => {
        console.warn("Apple Health background delivery initialization failed", error instanceof Error ? error.name : "unknown");
      });
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return null;
}

