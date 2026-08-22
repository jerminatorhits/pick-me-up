import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { formatTime } from '@/lib/time';
import type { Pickup, Settings } from '@/types';

let configured = false;

export function configureNotifications() {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status === 'granted' && Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('pickup-alerts', {
      name: 'Airport pickups',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F0B429',
    });
  }
  return status === 'granted';
}

async function cancelIfPresent(id?: string) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Notification may already have fired.
  }
}

function dateTrigger(date: Date): Notifications.NotificationTriggerInput {
  const triggerType =
    Notifications.SchedulableTriggerInputTypes?.DATE ?? 'date';
  return {
    type: triggerType,
    date,
    channelId: Platform.OS === 'android' ? 'pickup-alerts' : undefined,
  } as Notifications.NotificationTriggerInput;
}

async function scheduleAt(date: Date, title: string, body: string): Promise<string | undefined> {
  if (date.getTime() <= Date.now() + 5000) {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
    return undefined;
  }
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: dateTrigger(date),
  });
}

export async function syncPickupNotifications(
  pickup: Pickup,
  settings: Settings,
): Promise<Pick<Pickup, 'leaveNotificationId' | 'earlyNotificationId'>> {
  await cancelIfPresent(pickup.leaveNotificationId);
  await cancelIfPresent(pickup.earlyNotificationId);

  if (!settings.notificationsEnabled || !pickup.leaveAt || pickup.status === 'cancelled') {
    return { leaveNotificationId: undefined, earlyNotificationId: undefined };
  }

  const allowed = await ensureNotificationPermission();
  if (!allowed) {
    return { leaveNotificationId: undefined, earlyNotificationId: undefined };
  }

  const airport = pickup.arrivalAirport.iata;
  const flight = pickup.flightNumber;
  const landing = formatTime(pickup.estimatedArrival);
  const leaveAt = new Date(pickup.leaveAt);

  const leaveNotificationId = await scheduleAt(
    leaveAt,
    `Time to leave for ${airport}`,
    `${flight} lands at ${landing}. Head out now so you arrive when they do.`,
  );

  let earlyNotificationId: string | undefined;
  if (settings.earlyWarningMinutes > 0) {
    const earlyAt = new Date(leaveAt.getTime() - settings.earlyWarningMinutes * 60_000);
    if (earlyAt.getTime() > Date.now() + 30_000) {
      earlyNotificationId = await scheduleAt(
        earlyAt,
        `Leave in ${settings.earlyWarningMinutes} min`,
        `${flight} · ${airport} lands at ${landing}.`,
      );
    }
  }

  return { leaveNotificationId, earlyNotificationId };
}

export async function cancelPickupNotifications(pickup: Pickup) {
  await cancelIfPresent(pickup.leaveNotificationId);
  await cancelIfPresent(pickup.earlyNotificationId);
}
