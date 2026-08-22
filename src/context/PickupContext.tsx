import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { createId } from '@/lib/flightNumber';
import { applyTiming, isPickupActive } from '@/services/leaveTime';
import { flightToPickupFields, lookupFlight } from '@/services/flights';
import { getCurrentCoordinates } from '@/services/location';
import { cancelPickupNotifications, configureNotifications, syncPickupNotifications } from '@/services/notifications';
import { loadPickups, loadSettings, savePickups, saveSettings } from '@/services/storage';
import { estimateDriveTime } from '@/services/travelTime';
import type { FlightInfo, Pickup, Settings } from '@/types';

configureNotifications();

type RefreshOptions = {
  skipFlightLookup?: boolean;
};

type PickupContextValue = {
  ready: boolean;
  pickups: Pickup[];
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  addPickup: (pickup: Omit<Pickup, 'id' | 'createdAt'>) => Promise<Pickup>;
  updatePickup: (id: string, patch: Partial<Pickup>) => Promise<void>;
  removePickup: (id: string) => Promise<void>;
  refreshPickup: (id: string, options?: RefreshOptions) => Promise<Pickup>;
  refreshAll: () => Promise<void>;
};

const PickupContext = createContext<PickupContextValue | null>(null);

async function recalculate(pickup: Pickup, settings: Settings, options?: RefreshOptions): Promise<Pickup> {
  let next: Pickup = { ...pickup };

  if (pickup.source === 'flight_api' && !options?.skipFlightLookup) {
    try {
      const flights = await lookupFlight(pickup.flightNumber, pickup.flightDate, settings);
      const match =
        flights.find((flight) => flight.arrival.airport.iata === pickup.arrivalAirport.iata) ||
        flights[0];
      if (match) {
        next = { ...next, ...flightToPickupFields(match) };
      }
    } catch {
      // Keep the last known flight times if a refresh fails.
    }
  }

  if (next.driveOverrideMinutes != null) {
    next.driveSource = 'override';
    next.driveError = undefined;
  } else {
    try {
      const origin = await getCurrentCoordinates();
      const estimate = await estimateDriveTime(
        origin,
        next.arrivalAirport,
        settings.googleMapsKey,
      );
      next.driveDurationSeconds = estimate.durationSeconds;
      next.driveDistanceMeters = estimate.distanceMeters;
      next.driveSource = estimate.source;
      next.driveError = undefined;
    } catch (error) {
      next.driveError =
        error instanceof Error ? error.message : 'Could not estimate drive time.';
    }
  }

  next = applyTiming(next, settings);

  const notifications = await syncPickupNotifications(next, settings);
  next.leaveNotificationId = notifications.leaveNotificationId;
  next.earlyNotificationId = notifications.earlyNotificationId;
  next.lastRefreshedAt = new Date().toISOString();
  return next;
}

export function PickupProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [storedPickups, storedSettings] = await Promise.all([loadPickups(), loadSettings()]);
      if (cancelled) return;
      setPickups(storedPickups.map((pickup) => applyTiming(pickup, storedSettings)));
      setSettings(storedSettings);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void savePickups(pickups);
  }, [pickups, ready]);

  const replacePickup = useCallback((id: string, updater: (current: Pickup) => Pickup) => {
    setPickups((current) => current.map((pickup) => (pickup.id === id ? updater(pickup) : pickup)));
  }, []);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...(current as Settings), ...patch };
      void saveSettings(next);
      return next;
    });
  }, []);

  const addPickup = useCallback(async (input: Omit<Pickup, 'id' | 'createdAt'>) => {
    const created: Pickup = {
      ...input,
      id: createId(),
      createdAt: new Date().toISOString(),
    };
    const currentSettings = settings;
    const hydrated = currentSettings ? await recalculate(created, currentSettings) : created;
    setPickups((current) => [hydrated, ...current]);
    return hydrated;
  }, [settings]);

  const updatePickup = useCallback(async (id: string, patch: Partial<Pickup>) => {
    replacePickup(id, (current) => ({ ...current, ...patch }));
  }, [replacePickup]);

  const removePickup = useCallback(async (id: string) => {
    const existing = pickups.find((pickup) => pickup.id === id);
    if (existing) await cancelPickupNotifications(existing);
    setPickups((current) => current.filter((pickup) => pickup.id !== id));
  }, [pickups]);

  const refreshPickup = useCallback(async (id: string, options?: RefreshOptions) => {
    const existing = pickups.find((pickup) => pickup.id === id);
    if (!existing || !settings) {
      throw new Error('Pickup not found.');
    }
    const next = await recalculate(existing, settings, options);
    replacePickup(id, () => next);
    return next;
  }, [pickups, replacePickup, settings]);

  const refreshAll = useCallback(async () => {
    if (!settings) return;
    const next = await Promise.all(
      pickups.map((pickup) =>
        isPickupActive(pickup) ? recalculate(pickup, settings) : Promise.resolve(pickup),
      ),
    );
    setPickups(next);
  }, [pickups, settings]);

  const didInitialRefresh = useRef(false);
  useEffect(() => {
    if (!ready || !settings || didInitialRefresh.current) return;
    didInitialRefresh.current = true;
    void refreshAll();
  }, [ready, refreshAll, settings]);

  useEffect(() => {
    if (!ready || !settings) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshAll();
      }
    });
    return () => sub.remove();
  }, [ready, refreshAll, settings]);

  const value = useMemo<PickupContextValue>(
    () => ({
      ready,
      pickups,
      settings: settings ?? ({} as Settings),
      updateSettings,
      addPickup,
      updatePickup,
      removePickup,
      refreshPickup,
      refreshAll,
    }),
    [addPickup, pickups, ready, refreshAll, refreshPickup, removePickup, settings, updatePickup, updateSettings],
  );

  return <PickupContext.Provider value={value}>{children}</PickupContext.Provider>;
}

export function usePickups() {
  const value = useContext(PickupContext);
  if (!value) {
    throw new Error('usePickups must be used inside PickupProvider');
  }
  return value;
}

export function pickupFromFlight(
  flight: FlightInfo,
  flightDate: string,
  extras: Partial<Pickup> = {},
): Omit<Pickup, 'id' | 'createdAt'> {
  return {
    source: 'flight_api',
    flightDate,
    ...flightToPickupFields(flight),
    ...extras,
  };
}
