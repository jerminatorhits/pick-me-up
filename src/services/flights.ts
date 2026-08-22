import { airportFromPartial, findAirport } from '@/data/airports';
import { toDateKey, toIsoUtc } from '@/lib/time';
import { parseFlightNumber } from '@/lib/flightNumber';
import type { Airport, FlightInfo, FlightStatus, Settings } from '@/types';

function mapStatus(raw?: string | null): { status: FlightStatus; statusLabel: string } {
  const value = (raw || '').toLowerCase();
  if (value.includes('cancel')) return { status: 'cancelled', statusLabel: 'Cancelled' };
  if (value.includes('divert')) return { status: 'diverted', statusLabel: 'Diverted' };
  if (value.includes('land') || value.includes('arriv')) return { status: 'landed', statusLabel: 'Landed' };
  if (value.includes('delay')) return { status: 'delayed', statusLabel: 'Delayed' };
  if (value.includes('enroute') || value.includes('en-route') || value.includes('active') || value.includes('depart')) {
    return { status: 'active', statusLabel: 'In the air' };
  }
  if (value.includes('sched') || value.includes('expect') || value.includes('gate')) {
    return { status: 'scheduled', statusLabel: 'Scheduled' };
  }
  return { status: 'unknown', statusLabel: raw || 'Unknown' };
}

function resolveAirport(partial: {
  iata?: string | null;
  name?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
}): Airport {
  const airport = airportFromPartial(partial);
  if (airport) return airport;
  const iata = (partial.iata || '???').toUpperCase();
  return {
    iata,
    name: partial.name || `${iata} Airport`,
    city: partial.city || '',
    lat: partial.lat ?? 0,
    lng: partial.lng ?? 0,
  };
}

function firstIso(...values: (string | null | undefined)[]): string | undefined {
  return values.find((value) => Boolean(value)) || undefined;
}

function aeroBoxToIso(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const normalized = raw.trim().replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

type AeroBoxAirport = {
  iata?: string;
  icao?: string;
  name?: string;
  municipalityName?: string;
  location?: { lat?: number; lon?: number };
};

type AeroBoxFlight = {
  number?: string;
  status?: string;
  airline?: { name?: string };
  departure?: {
    airport?: AeroBoxAirport;
    scheduledTime?: { utc?: string; local?: string };
    revisedTime?: { utc?: string; local?: string };
    predictedTime?: { utc?: string; local?: string };
    terminal?: string;
    gate?: string;
  };
  arrival?: {
    airport?: AeroBoxAirport;
    scheduledTime?: { utc?: string; local?: string };
    revisedTime?: { utc?: string; local?: string };
    predictedTime?: { utc?: string; local?: string };
    terminal?: string;
    gate?: string;
    baggageBelt?: string;
  };
};

function fromAeroBox(flight: AeroBoxFlight): FlightInfo | null {
  const arrivalAirport = flight.arrival?.airport;
  const departureAirport = flight.departure?.airport;
  if (!arrivalAirport?.iata && !findAirport(arrivalAirport?.iata)) {
    if (!arrivalAirport?.location?.lat) return null;
  }

  const arrival = resolveAirport({
    iata: arrivalAirport?.iata,
    name: arrivalAirport?.name,
    city: arrivalAirport?.municipalityName,
    lat: arrivalAirport?.location?.lat,
    lng: arrivalAirport?.location?.lon,
  });
  const departure = resolveAirport({
    iata: departureAirport?.iata,
    name: departureAirport?.name,
    city: departureAirport?.municipalityName,
    lat: departureAirport?.location?.lat,
    lng: departureAirport?.location?.lon,
  });

  const estimatedArrival = firstIso(
    aeroBoxToIso(flight.arrival?.predictedTime?.utc),
    aeroBoxToIso(flight.arrival?.revisedTime?.utc),
    aeroBoxToIso(flight.arrival?.scheduledTime?.utc),
    aeroBoxToIso(flight.arrival?.predictedTime?.local),
    aeroBoxToIso(flight.arrival?.revisedTime?.local),
    aeroBoxToIso(flight.arrival?.scheduledTime?.local),
  );
  if (!estimatedArrival || (arrival.lat === 0 && arrival.lng === 0)) return null;

  const status = mapStatus(flight.status);
  return {
    flightNumber: (flight.number || '').replace(/\s+/g, ''),
    airlineName: flight.airline?.name,
    ...status,
    departure: {
      airport: departure,
      scheduled: aeroBoxToIso(flight.departure?.scheduledTime?.utc || flight.departure?.scheduledTime?.local),
      estimated: firstIso(
        aeroBoxToIso(flight.departure?.revisedTime?.utc),
        aeroBoxToIso(flight.departure?.scheduledTime?.utc),
      ),
      terminal: flight.departure?.terminal,
      gate: flight.departure?.gate,
    },
    arrival: {
      airport: arrival,
      scheduled: aeroBoxToIso(flight.arrival?.scheduledTime?.utc || flight.arrival?.scheduledTime?.local),
      estimated: estimatedArrival,
      terminal: flight.arrival?.terminal,
      gate: flight.arrival?.gate,
      baggage: flight.arrival?.baggageBelt,
    },
  };
}

async function lookupAeroDataBox(flightIata: string, date: string, apiKey: string): Promise<FlightInfo[]> {
  const url = `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(flightIata)}/${date}?dateLocalRole=Arrival`;
  const response = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
    },
  });
  if (response.status === 204 || response.status === 404) return [];
  const payload = (await response.json()) as AeroBoxFlight[] | { message?: string };
  if (!response.ok) {
    const message = Array.isArray(payload) ? 'AeroDataBox lookup failed.' : payload.message;
    throw new Error(message || 'AeroDataBox lookup failed.');
  }
  if (!Array.isArray(payload)) return [];
  return payload.map(fromAeroBox).filter((flight): flight is FlightInfo => flight != null);
}

type AviationStackFlight = {
  flight_status?: string;
  flight_date?: string;
  airline?: { name?: string };
  flight?: {
    iata?: string;
    number?: string;
    codeshared?: { flight_iata?: string };
  };
  departure?: {
    airport?: string;
    timezone?: string;
    iata?: string;
    scheduled?: string;
    estimated?: string;
    terminal?: string;
    gate?: string;
  };
  arrival?: {
    airport?: string;
    timezone?: string;
    iata?: string;
    scheduled?: string;
    estimated?: string;
    actual?: string;
    terminal?: string;
    gate?: string;
    baggage?: string;
  };
};

function fromAviationStack(flight: AviationStackFlight, searchedIata: string): FlightInfo | null {
  const arrivalAirport = resolveAirport({
    iata: flight.arrival?.iata,
    name: flight.arrival?.airport,
  });
  const departureAirport = resolveAirport({
    iata: flight.departure?.iata,
    name: flight.departure?.airport,
  });
  const arrivalTz = flight.arrival?.timezone;
  const departureTz = flight.departure?.timezone;
  const estimatedArrival = firstIso(
    toIsoUtc(flight.arrival?.actual, arrivalTz),
    toIsoUtc(flight.arrival?.estimated, arrivalTz),
    toIsoUtc(flight.arrival?.scheduled, arrivalTz),
  );
  if (!estimatedArrival || arrivalAirport.lat === 0) return null;
  const status = mapStatus(flight.flight_status);
  return {
    flightNumber: searchedIata || flight.flight?.iata || '',
    airlineName: flight.airline?.name,
    ...status,
    departure: {
      airport: departureAirport,
      scheduled: toIsoUtc(flight.departure?.scheduled, departureTz),
      estimated: toIsoUtc(flight.departure?.estimated, departureTz),
      terminal: flight.departure?.terminal,
      gate: flight.departure?.gate,
    },
    arrival: {
      airport: arrivalAirport,
      scheduled: toIsoUtc(flight.arrival?.scheduled, arrivalTz),
      estimated: estimatedArrival,
      actual: toIsoUtc(flight.arrival?.actual, arrivalTz),
      terminal: flight.arrival?.terminal,
      gate: flight.arrival?.gate,
      baggage: flight.arrival?.baggage,
    },
  };
}

function flightArrivesOnDate(flight: FlightInfo, date: string): boolean {
  const iso = flight.arrival.estimated || flight.arrival.scheduled;
  if (!iso) return false;
  return toDateKey(new Date(iso)) === date;
}

async function fetchAviationStack(
  apiKey: string,
  extraParams: Record<string, string>,
): Promise<AviationStackFlight[]> {
  const params = new URLSearchParams({ access_key: apiKey, ...extraParams });
  const urls = [
    `https://api.aviationstack.com/v1/flights?${params.toString()}`,
    `http://api.aviationstack.com/v1/flights?${params.toString()}`,
  ];

  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      const response = await fetch(url);
      const payload = (await response.json()) as {
        error?: { code?: string; info?: string; message?: string };
        data?: AviationStackFlight[];
      };
      if (payload.error) {
        const message = payload.error.info || payload.error.message || 'AviationStack lookup failed.';
        if (payload.error.code === 'https_access_restricted') {
          lastError = new Error(message);
          continue;
        }
        throw new Error(message);
      }
      return payload.data || [];
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('AviationStack lookup failed.');
    }
  }
  throw lastError || new Error('AviationStack lookup failed.');
}

async function lookupAviationStack(flightIata: string, date: string, apiKey: string): Promise<FlightInfo[]> {
  // Free plans reject flight_date (that hits the paid historical API).
  const raw = await fetchAviationStack(apiKey, { flight_iata: flightIata });
  const mapped = raw.flatMap((flight) => {
    const info = fromAviationStack(flight, flightIata);
    return info ? [{ info, flightDate: flight.flight_date }] : [];
  });
  const today = toDateKey(new Date());
  return mapped
    .map(({ info }) => info)
    .filter((info) => flightArrivesOnDate(info, date))
    .filter((info) => date <= today || (info.status !== 'landed' && info.status !== 'cancelled'));
}

export async function lookupFlight(
  flightNumber: string,
  date: string,
  settings: Settings,
): Promise<FlightInfo[]> {
  const parsed = parseFlightNumber(flightNumber);
  if (!parsed) {
    throw new Error('Enter a flight number like UA123 or DL 456.');
  }

  const useAviationStack =
    settings.flightProvider === 'aviationstack' || !settings.aeroDataBoxKey.trim();

  if (useAviationStack) {
    if (!settings.aviationStackKey.trim()) {
      throw new Error('Add an AviationStack API key in Settings, or enter the landing time manually.');
    }
    const flights = await lookupAviationStack(parsed.iata, date, settings.aviationStackKey.trim());
    if (flights.length === 0) {
      throw new Error(
        `No ${parsed.display} landing on ${date}. AviationStack’s free plan has no future schedules. Add a free AeroDataBox RapidAPI key in Settings, or enter the airport and landing time manually.`,
      );
    }
    return flights;
  }

  const dates = [date];
  const results: FlightInfo[] = [];
  const seen = new Set<string>();
  let lastError: Error | null = null;
  for (const lookupDate of dates) {
    try {
      const flights = await lookupAeroDataBox(parsed.iata, lookupDate, settings.aeroDataBoxKey.trim());
      for (const flight of flights) {
        const key = [flight.flightNumber, flight.arrival.airport.iata, flight.arrival.estimated].join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        results.push(flight);
      }
      if (results.length > 0) break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Flight lookup failed.');
    }
  }

  if (results.length === 0 && lastError) throw lastError;
  return results;
}

export function flightToPickupFields(flight: FlightInfo) {
  return {
    flightNumber: flight.flightNumber,
    airlineName: flight.airlineName,
    status: flight.status,
    statusLabel: flight.statusLabel,
    departureAirport: flight.departure.airport,
    arrivalAirport: flight.arrival.airport,
    scheduledArrival: flight.arrival.scheduled,
    estimatedArrival: flight.arrival.estimated || flight.arrival.scheduled || flight.arrival.actual || '',
    terminal: flight.arrival.terminal,
    gate: flight.arrival.gate,
    baggage: flight.arrival.baggage,
  };
}
