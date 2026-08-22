import type { Airport } from '@/types';
import type { Coordinates } from '@/services/location';

export type DriveEstimate = {
  durationSeconds: number;
  distanceMeters: number;
};

function toRfc3339(date: Date): string {
  return date.toISOString();
}

async function routesApi(
  origin: Coordinates,
  destination: Airport,
  apiKey: string,
  departureTime: Date,
): Promise<DriveEstimate> {
  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
    },
    body: JSON.stringify({
      origin: {
        location: { latLng: { latitude: origin.lat, longitude: origin.lng } },
      },
      destination: {
        location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
      },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      departureTime: toRfc3339(departureTime),
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    routes?: { duration?: string; distanceMeters?: number }[];
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || 'Google Routes request failed.');
  }

  const route = payload.routes?.[0];
  const durationMatch = route?.duration?.match(/^(\d+)s$/);
  if (!route || !durationMatch) {
    throw new Error('Google Maps did not return a driving route to that airport.');
  }

  return {
    durationSeconds: Number(durationMatch[1]),
    distanceMeters: route.distanceMeters ?? 0,
  };
}

async function distanceMatrix(
  origin: Coordinates,
  destination: Airport,
  apiKey: string,
  departureTime: Date,
): Promise<DriveEstimate> {
  const params = new URLSearchParams({
    origins: `${origin.lat},${origin.lng}`,
    destinations: `${destination.lat},${destination.lng}`,
    mode: 'driving',
    departure_time: String(Math.max(Math.floor(departureTime.getTime() / 1000), Math.floor(Date.now() / 1000))),
    key: apiKey,
  });
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`,
  );
  const payload = (await response.json()) as {
    status?: string;
    error_message?: string;
    rows?: {
      elements?: {
        status?: string;
        duration?: { value: number };
        duration_in_traffic?: { value: number };
        distance?: { value: number };
      }[];
    }[];
  };

  if (payload.status !== 'OK') {
    throw new Error(payload.error_message || 'Google Distance Matrix request failed.');
  }

  const element = payload.rows?.[0]?.elements?.[0];
  if (!element || element.status !== 'OK' || !element.duration) {
    throw new Error('Google Maps did not return a driving route to that airport.');
  }

  return {
    durationSeconds: element.duration_in_traffic?.value ?? element.duration.value,
    distanceMeters: element.distance?.value ?? 0,
  };
}

async function osrmRoute(origin: Coordinates, destination: Airport): Promise<DriveEstimate> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`;
  const response = await fetch(url);
  const payload = (await response.json()) as {
    code?: string;
    routes?: { duration?: number; distance?: number }[];
  };
  const route = payload.routes?.[0];
  if (payload.code !== 'Ok' || !route?.duration) {
    throw new Error('Could not estimate a driving route to that airport.');
  }
  return {
    durationSeconds: Math.round(route.duration),
    distanceMeters: Math.round(route.distance ?? 0),
  };
}

function haversineEstimate(origin: Coordinates, destination: Airport): DriveEstimate {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(destination.lat - origin.lat);
  const dLng = toRad(destination.lng - origin.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(origin.lat)) * Math.cos(toRad(destination.lat)) * Math.sin(dLng / 2) ** 2;
  const km = 2 * earthKm * Math.asin(Math.min(1, Math.sqrt(a)));
  const miles = km * 0.621371;
  const hours = miles / 32;
  return {
    durationSeconds: Math.max(12 * 60, Math.round(hours * 3600)),
    distanceMeters: Math.round(km * 1000),
  };
}

export type DriveEstimateResult = DriveEstimate & {
  source: Exclude<NonNullable<import('@/types').Pickup['driveSource']>, 'override'>;
};

export async function estimateDriveTime(
  origin: Coordinates,
  destination: Airport,
  apiKey: string,
  departureTime = new Date(),
): Promise<DriveEstimateResult> {
  const when = departureTime.getTime() < Date.now() + 60_000 ? new Date() : departureTime;
  const errors: string[] = [];

  if (apiKey.trim()) {
    try {
      return { ...(await routesApi(origin, destination, apiKey.trim(), when)), source: 'google' };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Google Routes failed.');
      try {
        return { ...(await distanceMatrix(origin, destination, apiKey.trim(), when)), source: 'google' };
      } catch (matrixError) {
        errors.push(matrixError instanceof Error ? matrixError.message : 'Distance Matrix failed.');
      }
    }
  }

  try {
    return { ...(await osrmRoute(origin, destination)), source: 'osrm' };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'OSRM failed.');
  }

  if (destination.lat === 0 && destination.lng === 0) {
    throw new Error(errors[0] || 'Could not estimate drive time to that airport.');
  }

  return { ...haversineEstimate(origin, destination), source: 'estimate' };
}

export function mapsDirectionsUrl(destination: Airport): string {
  const query = encodeURIComponent(`${destination.name} (${destination.iata})`);
  return `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`;
}
