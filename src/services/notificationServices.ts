import { Platform } from "react-native";
import { isRunningInExpoGo } from "expo";

const LIST_ACTIVITY_CHANNEL_ID = "list-activity";

let notificationHandlerConfigured = false;

type NotificationsModule = typeof import("expo-notifications");

function isExpoGoAndroid() {
  return Platform.OS === "android" && isRunningInExpoGo();
}

async function loadNotifications() {
  if (isExpoGoAndroid()) {
    return null;
  }

  return import("expo-notifications");
}

export function supportsListNotifications() {
  return !isExpoGoAndroid();
}

function allowsNotifications(
  status: { granted?: boolean; ios?: { status?: unknown } },
  notifications: NotificationsModule
) {
  return (
    status.granted ||
    status.ios?.status === notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function configureNotificationHandling() {
  if (notificationHandlerConfigured) {
    return true;
  }

  const notifications = await loadNotifications();

  if (!notifications) {
    return false;
  }

  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    notifications.setNotificationChannelAsync(LIST_ACTIVITY_CHANNEL_ID, {
      name: "List activity",
      importance: notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: "#10b981",
    }).catch((error) => {
      console.log("Could not configure notification channel", error);
    });
  }

  notificationHandlerConfigured = true;
  return true;
}

export async function requestListNotificationPermission() {
  const notifications = await loadNotifications();

  if (!notifications) {
    return false;
  }

  await configureNotificationHandling();

  const currentStatus = await notifications.getPermissionsAsync();

  if (allowsNotifications(currentStatus, notifications)) {
    return true;
  }

  const requestedStatus = await notifications.requestPermissionsAsync();
  return allowsNotifications(requestedStatus, notifications);
}

export async function scheduleItemsAddedNotification({
  listId,
  listName,
  count,
}: {
  listId: string;
  listName: string;
  count: number;
}) {
  if (count <= 0) {
    return;
  }

  const notifications = await loadNotifications();

  if (!notifications) {
    return;
  }

  await configureNotificationHandling();

  const permissionStatus = await notifications.getPermissionsAsync();

  if (!allowsNotifications(permissionStatus, notifications)) {
    return;
  }

  const itemLabel = count === 1 ? "item" : "items";

  await notifications.scheduleNotificationAsync({
    content: {
      title: "CartMate",
      body: `Someone added ${count} ${itemLabel} to ${listName}.`,
      data: { listId },
      sound: false,
    },
    trigger:
      Platform.OS === "android"
        ? { channelId: LIST_ACTIVITY_CHANNEL_ID }
        : null,
  });
}
