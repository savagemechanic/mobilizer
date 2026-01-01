import { useEffect, useRef, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { useRouter } from 'expo-router';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  parseNotificationData,
  parseNotificationResponseData,
  NotificationData,
} from '@/lib/notifications';
import {
  REGISTER_DEVICE,
  UNREGISTER_DEVICE,
  UPDATE_DEVICE_LAST_USED,
} from '@/lib/graphql/mutations/push-notifications';
import { useAuthStore } from '@/store/auth';
import { useNotificationsStore } from '@/store/notifications';

export function usePushNotifications() {
  const router = useRouter();
  const { isAuthenticated, token: authToken } = useAuthStore();
  const { incrementCount } = useNotificationsStore();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const pushTokenRef = useRef<string | null>(null);

  const [registerDeviceMutation] = useMutation(REGISTER_DEVICE);
  const [unregisterDeviceMutation] = useMutation(UNREGISTER_DEVICE);
  const [updateLastUsedMutation] = useMutation(UPDATE_DEVICE_LAST_USED);

  // Handle incoming notifications while app is foregrounded
  const handleNotification = useCallback(
    (notification: Notifications.Notification) => {
      const data = parseNotificationData(notification);
      console.log('Notification received:', data);

      // Update badge counts based on notification type
      if (data.type === 'message') {
        incrementCount('messages');
      } else if (data.type === 'event') {
        incrementCount('events');
      } else {
        incrementCount('notifications');
      }
    },
    [incrementCount],
  );

  // Handle notification taps
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = parseNotificationResponseData(response);
      console.log('Notification tapped:', data);

      // Navigate based on notification data
      if (data.screen) {
        if (data.params) {
          router.push({ pathname: data.screen as any, params: data.params });
        } else {
          router.push(data.screen as any);
        }
      } else if (data.type === 'message' && data.id) {
        router.push(`/conversation/${data.id}`);
      } else if (data.type === 'event' && data.id) {
        router.push(`/event/${data.id}`);
      } else if (data.type === 'post' && data.id) {
        router.push(`/post/${data.id}`);
      }
    },
    [router],
  );

  // Register device for push notifications
  const registerDevice = useCallback(async () => {
    if (!isAuthenticated || !authToken) return;

    try {
      const tokenData = await registerForPushNotificationsAsync();
      if (!tokenData) return;

      pushTokenRef.current = tokenData.token;

      const { data } = await registerDeviceMutation({
        variables: {
          input: {
            token: tokenData.token,
            platform: tokenData.platform,
            deviceName: tokenData.deviceName,
          },
        },
      });

      if (data?.registerDevice?.success) {
        console.log('Device registered for push notifications');
      }
    } catch (error) {
      console.error('Failed to register device:', error);
    }
  }, [isAuthenticated, authToken, registerDeviceMutation]);

  // Unregister device when logging out
  const unregisterDevice = useCallback(async () => {
    if (!pushTokenRef.current) return;

    try {
      await unregisterDeviceMutation({
        variables: {
          input: {
            token: pushTokenRef.current,
          },
        },
      });
      pushTokenRef.current = null;
      console.log('Device unregistered from push notifications');
    } catch (error) {
      console.error('Failed to unregister device:', error);
    }
  }, [unregisterDeviceMutation]);

  // Update last used timestamp when app comes to foreground
  const updateLastUsed = useCallback(async () => {
    if (!pushTokenRef.current || !isAuthenticated) return;

    try {
      await updateLastUsedMutation({
        variables: {
          token: pushTokenRef.current,
        },
      });
    } catch (error) {
      // Silently fail
    }
  }, [isAuthenticated, updateLastUsedMutation]);

  // Set up notification listeners
  useEffect(() => {
    notificationListener.current = addNotificationReceivedListener(handleNotification);
    responseListener.current = addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [handleNotification, handleNotificationResponse]);

  // Register device when authenticated
  useEffect(() => {
    if (isAuthenticated && authToken) {
      registerDevice();
    }
  }, [isAuthenticated, authToken, registerDevice]);

  // Update last used when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        updateLastUsed();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [updateLastUsed]);

  return {
    registerDevice,
    unregisterDevice,
    pushToken: pushTokenRef.current,
  };
}
