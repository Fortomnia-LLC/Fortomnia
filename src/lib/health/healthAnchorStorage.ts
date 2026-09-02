import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  normalizeAppleHealthAnchors,
  type AppleHealthAnchors,
} from "./healthAnchors";

const APPLE_HEALTH_ANCHORS_KEY = "fortomnia.apple-health.anchors.v1";

export async function loadAppleHealthAnchors(): Promise<AppleHealthAnchors> {
  const stored = await AsyncStorage.getItem(APPLE_HEALTH_ANCHORS_KEY);
  if (!stored) return {};
  try {
    return normalizeAppleHealthAnchors(JSON.parse(stored));
  } catch {
    await AsyncStorage.removeItem(APPLE_HEALTH_ANCHORS_KEY);
    return {};
  }
}

export async function saveAppleHealthAnchors(anchors: AppleHealthAnchors): Promise<void> {
  await AsyncStorage.setItem(
    APPLE_HEALTH_ANCHORS_KEY,
    JSON.stringify(normalizeAppleHealthAnchors(anchors)),
  );
}

export async function clearAppleHealthAnchors(): Promise<void> {
  await AsyncStorage.removeItem(APPLE_HEALTH_ANCHORS_KEY);
}
