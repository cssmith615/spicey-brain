import * as Device from 'expo-device';
import Constants from 'expo-constants';
import type { Routine } from '../types';

// expo-notifications crashes Expo Go (SDK 53+) on Android even on import.
// Use dynamic require so the module never loads in Expo Go.
const isExpoGo = Constants.appOwnership === 'expo';

function getNotifications() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('expo-notifications') as typeof import('expo-notifications');
}

if (!isExpoGo) {
  getNotifications().setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (isExpoGo || !Device.isDevice) return false;
  const Notifications = getNotifications();
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleRoutineReminder(routine: Routine): Promise<string | null> {
  if (isExpoGo) return null;
  const granted = await requestNotificationPermissions();
  if (!granted) return null;
  const Notifications = getNotifications();
  const [hour, minute] = routine.scheduledTime.split(':').map(Number);
  await cancelRoutineReminder(routine.id);
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Time for ${routine.name}! 🧠`,
      body: `${routine.tasks.length} mission${routine.tasks.length !== 1 ? 's' : ''} ready to complete`,
      data: { routineId: routine.id },
      sound: true,
    },
    trigger: { hour, minute, repeats: true } as any,
  });
  return identifier;
}

export async function cancelRoutineReminder(routineId: string): Promise<void> {
  if (isExpoGo) return;
  const Notifications = getNotifications();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matching = scheduled.filter((n) => (n.content.data as any)?.routineId === routineId);
  for (const n of matching) {
    await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (isExpoGo) return;
  await getNotifications().cancelAllScheduledNotificationsAsync();
}

export async function sendApprovalNotification(childName: string, rewardTitle: string): Promise<void> {
  if (isExpoGo) return;
  await getNotifications().scheduleNotificationAsync({
    content: {
      title: `${childName} wants a reward! 🎁`,
      body: `Requested: ${rewardTitle}. Tap to approve or deny.`,
      sound: true,
    },
    trigger: null,
  });
}
