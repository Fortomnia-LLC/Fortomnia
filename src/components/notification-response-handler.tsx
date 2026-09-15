import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Linking, Platform } from "react-native";

function notificationUrl(
  response: Notifications.NotificationResponse,
): string | null {
  const value = response.notification.request.content.data?.url;
  return typeof value === "string" && value.startsWith("fortomnia://")
    ? value
    : null;
}

export function NotificationResponseHandler() {
  const handledResponseId = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const openResponse = (response: Notifications.NotificationResponse) => {
      if (handledResponseId.current === response.notification.request.identifier) {
        return;
      }
      handledResponseId.current = response.notification.request.identifier;
      const url = notificationUrl(response);
      if (url) void Linking.openURL(url);
    };

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) openResponse(response);
    });
    const subscription =
      Notifications.addNotificationResponseReceivedListener(openResponse);
    return () => subscription.remove();
  }, []);

  return null;
}
