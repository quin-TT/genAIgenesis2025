import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import registerNNPushToken from "native-notify";

// Native Notify Configuration
const NATIVE_NOTIFY_APP_ID = 28566;
const NATIVE_NOTIFY_APP_TOKEN = "CxKTyFzipAqvpDDOWwZMBA";

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
// Get a unique device identifier
const getDeviceIdentifier = async () => {
  try {
    // Try to get stored device ID first
    let deviceId = await AsyncStorage.getItem("deviceId");

    if (!deviceId) {
      // Generate a new device ID
      const deviceName = Device.deviceName || "";
      const deviceModel = Device.modelName || "";
      const randomString = Math.random().toString(36).substring(2, 10);
      deviceId = `${deviceName}-${deviceModel}-${randomString}`;

      // Store it for future use
      await AsyncStorage.setItem("deviceId", deviceId);
    }

    return deviceId;
  } catch (error) {
    console.log("Error getting device identifier:", error);
    return `unknown-${Math.random().toString(36).substring(2, 10)}`;
  }
};

// Register for push notifications with both systems
export async function registerForPushNotificationsAsync(userId) {
  try {
    // Request permissions and other setup...

    // Get device identifier
    const deviceId = await getDeviceIdentifier();

    // IMPORTANT FIX: Add delimiter to prevent prefix matching issues
    // This ensures "user1" doesn't match with "user10"
    const safeUserId = userId || "anonymous";
    const compositeId = `__${safeUserId}__@${deviceId}`;
    console.log("Registering with Native Notify using composite ID:", compositeId);

    // Register with Native Notify
    registerNNPushToken(NATIVE_NOTIFY_APP_ID, compositeId, NATIVE_NOTIFY_APP_TOKEN);

    // Store the userId without the delimiter for easier reference
    await AsyncStorage.setItem("currentUser", safeUserId);

    return {
      expoPushToken: expoPushToken || "expo-token-unavailable",
      compositeId,
    };
  } catch (error) {
    console.log("Error in push notification setup:", error);
    return null;
  }
}

// Send a local notification
export async function sendLocalNotification(title, body, data = {}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // null means send immediately
    });
    return true;
  } catch (error) {
    console.log("Error sending notification:", error);
    return false;
  }
}

// Get current registration info (for debugging)
export async function getCurrentRegistrationInfo() {
  try {
    const deviceId = (await AsyncStorage.getItem("deviceId")) || "unknown";
    const userId = (await AsyncStorage.getItem("currentUser")) || "anonymous";
    const compositeId = `__${userId}__@${deviceId}`;

    return {
      deviceId,
      userId,
      compositeId,
    };
  } catch (error) {
    console.log("Error getting registration info:", error);
    return null;
  }
}

// Set up notification listeners
export function setupNotificationListeners(onNotification, onResponse) {
  try {
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification);
      if (onNotification) onNotification(notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification response:", response);
      if (onResponse) onResponse(response);
    });

    return { notificationListener, responseListener };
  } catch (error) {
    console.log("Error setting up notification listeners:", error);
    return { notificationListener: null, responseListener: null };
  }
}

// Remove notification listeners
export function removeNotificationListeners(listeners) {
  if (listeners?.notificationListener) {
    Notifications.removeNotificationSubscription(listeners.notificationListener);
  }
  if (listeners?.responseListener) {
    Notifications.removeNotificationSubscription(listeners.responseListener);
  }
}

export async function checkNotificationRegistration() {
  try {
    const info = await getCurrentRegistrationInfo();
    console.log("Current registration:", info);

    // Check permissions
    const { status } = await Notifications.getPermissionsAsync();
    console.log("Notification permission status:", status);

    return {
      ...info,
      permissionStatus: status,
    };
  } catch (error) {
    console.log("Error checking registration:", error);
    return null;
  }
}
