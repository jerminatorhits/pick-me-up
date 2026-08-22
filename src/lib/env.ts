export const envKeys = {
  googleMapsKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '',
  aviationStackKey: process.env.EXPO_PUBLIC_AVIATIONSTACK_KEY ?? '',
  aeroDataBoxKey: process.env.EXPO_PUBLIC_AERODATABOX_KEY ?? '',
};

export function applyKeyDefaults<T extends {
  googleMapsKey: string;
  aviationStackKey: string;
  aeroDataBoxKey: string;
  flightProvider: 'aerodatabox' | 'aviationstack';
}>(settings: T): T {
  const hadAeroKey = Boolean(settings.aeroDataBoxKey);
  const next = {
    ...settings,
    googleMapsKey: settings.googleMapsKey || envKeys.googleMapsKey,
    aviationStackKey: settings.aviationStackKey || envKeys.aviationStackKey,
    aeroDataBoxKey: settings.aeroDataBoxKey || envKeys.aeroDataBoxKey,
  };
  if (!hadAeroKey && next.aeroDataBoxKey) {
    next.flightProvider = 'aerodatabox';
  } else if (!next.aeroDataBoxKey && next.aviationStackKey) {
    next.flightProvider = 'aviationstack';
  }
  return next;
}
