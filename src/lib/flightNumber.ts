export type ParsedFlightNumber = {
  display: string;
  iata: string;
  airline: string;
  number: string;
};

const FLIGHT_PATTERN = /^([A-Z]{2}|[A-Z]{3}|[A-Z]\d|\d[A-Z])\s*-?\s*(\d{1,4}[A-Z]?)$/;

export function normalizeFlightNumber(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function parseFlightNumber(input: string): ParsedFlightNumber | null {
  const compact = normalizeFlightNumber(input);
  const spaced = compact.replace(/^([A-Z]{2}|[A-Z]{3}|[A-Z]\d|\d[A-Z])(\d{1,4}[A-Z]?)$/, '$1 $2');
  const match = spaced.match(FLIGHT_PATTERN);
  if (!match) return null;
  const airline = match[1];
  const number = match[2];
  return {
    display: `${airline} ${number}`,
    iata: `${airline}${number}`,
    airline,
    number,
  };
}

export function createId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
