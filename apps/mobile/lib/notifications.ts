import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;
}

export interface NotificationData {
  type?: string;
  id?: string;
  screen?: string;
  params?: Record<string, any>;
}

export async function registerForPushNotificationsAsync(): Promise<PushNotificationToken | null> {
  // Push notifications don't work in simulators
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission not granted for push notifications');
    return null;
  }

  try {
    const platform = Platform.OS as 'ios' | 'android';
    const deviceName = Device.deviceName || undefined;
    let token: string;

    // Configure Android notification channel first
    if (Platform.OS === 'android') {
      await setupAndroidChannel();
    }

    // Try to get native FCM/APNs token first (for direct Firebase push)
    try {
      const nativeToken = await Notifications.getDevicePushTokenAsync();
      if (nativeToken?.data) {
        token = nativeToken.data;
        console.log('Using native push token (FCM/APNs)');
        return { token, platform, deviceName };
      }
    } catch (nativeError) {
      console.log('Native token not available, falling back to Expo token');
    }

    // Fallback to Expo push token (for development/Expo Go)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    if (!projectId) {
      console.log('No project ID found for push notifications');
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    token = tokenResponse.data;
    console.log('Using Expo push token');

    return { token, platform, deviceName };
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

async function setupAndroidChannel() {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#007AFF',
  });

  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#007AFF',
  });

  await Notifications.setNotificationChannelAsync('events', {
    name: 'Events',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
    lightColor: '#007AFF',
  });

  await Notifications.setNotificationChannelAsync('daily-summary', {
    name: 'Daily Summary',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
    lightColor: '#007AFF',
  });
}

export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

export async function getBadgeCountAsync(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

export async function setBadgeCountAsync(count: number): Promise<boolean> {
  return Notifications.setBadgeCountAsync(count);
}

export function parseNotificationData(
  notification: Notifications.Notification,
): NotificationData {
  return (notification.request.content.data as NotificationData) || {};
}

export function parseNotificationResponseData(
  response: Notifications.NotificationResponse,
): NotificationData {
  return (response.notification.request.content.data as NotificationData) || {};
}

// Schedule a local notification (useful for testing)
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: NotificationData,
  seconds: number = 1,
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: { seconds },
  });
}

// Cancel all scheduled notifications
export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Get all scheduled notifications
export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}

// Dismiss all notifications from notification center
export async function dismissAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}
