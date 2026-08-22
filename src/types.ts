import { applyKeyDefaults, envKeys } from '@/lib/env';

export type FlightStatus =
  | 'scheduled'
  | 'active'
  | 'landed'
  | 'cancelled'
  | 'diverted'
  | 'delayed'
  | 'unknown';

export type Airport = {
  iata: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
};

export type FlightInfo = {
  flightNumber: string;
  airlineName?: string;
  status: FlightStatus;
  statusLabel: string;
  departure: {
    airport: Airport;
    scheduled?: string;
    estimated?: string;
    terminal?: string;
    gate?: string;
  };
  arrival: {
    airport: Airport;
    scheduled?: string;
    estimated?: string;
    actual?: string;
    terminal?: string;
    gate?: string;
    baggage?: string;
  };
};

export type PickupSource = 'flight_api' | 'manual';

export type Pickup = {
  id: string;
  createdAt: string;
  source: PickupSource;
  label?: string;
  flightNumber: string;
  flightDate: string;
  airlineName?: string;
  status: FlightStatus;
  statusLabel: string;
  departureAirport: Airport;
  arrivalAirport: Airport;
  scheduledArrival?: string;
  estimatedArrival: string;
  terminal?: string;
  gate?: string;
  baggage?: string;
  driveDurationSeconds?: number;
  driveDistanceMeters?: number;
  driveOverrideMinutes?: number;
  driveSource?: 'google' | 'osrm' | 'estimate' | 'override';
  driveError?: string;
  leaveAt?: string;
  readyAt?: string;
  lastRefreshedAt?: string;
  leaveNotificationId?: string;
  earlyNotificationId?: string;
};

export type FlightProvider = 'aerodatabox' | 'aviationstack';

export type Settings = {
  googleMapsKey: string;
  aeroDataBoxKey: string;
  aviationStackKey: string;
  flightProvider: FlightProvider;
  readyMinutes: number;
  extraBufferMinutes: number;
  earlyWarningMinutes: number;
  notificationsEnabled: boolean;
};

export const defaultSettings: Settings = applyKeyDefaults({
  googleMapsKey: envKeys.googleMapsKey,
  aeroDataBoxKey: envKeys.aeroDataBoxKey,
  aviationStackKey: envKeys.aviationStackKey,
  flightProvider: envKeys.aeroDataBoxKey ? 'aerodatabox' : 'aviationstack',
  readyMinutes: 20,
  extraBufferMinutes: 10,
  earlyWarningMinutes: 15,
  notificationsEnabled: true,
});
