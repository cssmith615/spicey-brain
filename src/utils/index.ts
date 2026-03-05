import 'react-native-get-random-values';
import type { AgeGroup } from '../types';

export function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export const getAgeGroup = (age: number): AgeGroup => {
  if (age <= 7) return 'young';
  if (age <= 12) return 'middle';
  return 'teen';
};

export const formatTime = (time: string): string => {
  const [hourStr, minute] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${period}`;
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const TASK_PRESETS = [
  { title: 'Wake up', icon: '☀️', durationMinutes: 5 },
  { title: 'Make bed', icon: '🛏️', durationMinutes: 5 },
  { title: 'Brush teeth', icon: '🪥', durationMinutes: 3 },
  { title: 'Get dressed', icon: '👕', durationMinutes: 10 },
  { title: 'Eat breakfast', icon: '🥣', durationMinutes: 15 },
  { title: 'Take medication', icon: '💊', durationMinutes: 2, isMedication: true },
  { title: 'Tidy room', icon: '🧹', durationMinutes: 10 },
  { title: 'Pack backpack', icon: '🎒', durationMinutes: 5 },
  { title: 'Wash face', icon: '🚿', durationMinutes: 3 },
  { title: 'Eat lunch', icon: '🥪', durationMinutes: 20 },
  { title: 'Homework', icon: '📚', durationMinutes: 30 },
  { title: 'Eat dinner', icon: '🍽️', durationMinutes: 20 },
  { title: 'Bath/shower', icon: '🛁', durationMinutes: 15 },
  { title: 'Read a book', icon: '📖', durationMinutes: 15 },
  { title: 'Lights out', icon: '🌙', durationMinutes: 0 },
];

export const AVATAR_OPTIONS = ['🦁', '🐯', '🐻', '🦊', '🐼', '🐨', '🦋', '🐸', '🦄', '🐲'];

export const STAR_REWARDS = {
  taskComplete: 1,
  routineComplete: 5,
  streak3Day: 10,
  streak7Day: 25,
};
