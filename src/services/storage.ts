import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { applyKeyDefaults } from '@/lib/env';
import { defaultSettings, type Pickup, type Settings } from '@/types';

const PICKUPS_KEY = 'pickups.v1';
const SETTINGS_KEY = 'settings.v1';

export async function loadPickups(): Promise<Pickup[]> {
  const raw = await AsyncStorage.getItem(PICKUPS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Pickup[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function savePickups(pickups: Pickup[]): Promise<void> {
  await AsyncStorage.setItem(PICKUPS_KEY, JSON.stringify(pickups));
}

async function readSecret(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function writeSecret(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function loadSettings(): Promise<Settings> {
  const raw = await readSecret(SETTINGS_KEY);
  let stored: Partial<Settings> = {};
  if (raw) {
    try {
      stored = JSON.parse(raw) as Partial<Settings>;
    } catch {
      stored = {};
    }
  }
  const settings = applyKeyDefaults({ ...defaultSettings, ...stored });
  if (
    settings.googleMapsKey !== stored.googleMapsKey ||
    settings.aviationStackKey !== stored.aviationStackKey ||
    settings.aeroDataBoxKey !== stored.aeroDataBoxKey ||
    settings.flightProvider !== stored.flightProvider
  ) {
    await writeSecret(SETTINGS_KEY, JSON.stringify(settings));
  }
  return settings;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await writeSecret(SETTINGS_KEY, JSON.stringify(settings));
}
