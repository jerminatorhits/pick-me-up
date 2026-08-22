import type { Airport } from '@/types';

type AirportRow = [string, string, string, number, number];

const ROWS: AirportRow[] = [
  ['ATL', 'Hartsfield-Jackson Atlanta International', 'Atlanta', 33.6407, -84.4277],
  ['DFW', 'Dallas/Fort Worth International', 'Dallas', 32.8998, -97.0403],
  ['DEN', 'Denver International', 'Denver', 39.8561, -104.6737],
  ['ORD', "O'Hare International", 'Chicago', 41.9742, -87.9073],
  ['LAX', 'Los Angeles International', 'Los Angeles', 33.9416, -118.4085],
  ['CLT', 'Charlotte Douglas International', 'Charlotte', 35.214, -80.9431],
  ['MCO', 'Orlando International', 'Orlando', 28.4312, -81.3081],
  ['LAS', 'Harry Reid International', 'Las Vegas', 36.084, -115.1537],
  ['PHX', 'Phoenix Sky Harbor International', 'Phoenix', 33.4373, -112.0078],
  ['MIA', 'Miami International', 'Miami', 25.7959, -80.287],
  ['SEA', 'Seattle-Tacoma International', 'Seattle', 47.4502, -122.3088],
  ['IAH', 'George Bush Intercontinental', 'Houston', 29.9902, -95.3368],
  ['JFK', 'John F. Kennedy International', 'New York', 40.6413, -73.7781],
  ['EWR', 'Newark Liberty International', 'Newark', 40.6895, -74.1745],
  ['SFO', 'San Francisco International', 'San Francisco', 37.6213, -122.379],
  ['MSP', 'Minneapolis-Saint Paul International', 'Minneapolis', 44.8848, -93.2223],
  ['DTW', 'Detroit Metropolitan Wayne County', 'Detroit', 42.2162, -83.3554],
  ['BOS', 'Boston Logan International', 'Boston', 42.3656, -71.0096],
  ['FLL', 'Fort Lauderdale-Hollywood International', 'Fort Lauderdale', 26.0742, -80.1506],
  ['PHL', 'Philadelphia International', 'Philadelphia', 39.8744, -75.2424],
  ['LGA', 'LaGuardia', 'New York', 40.7769, -73.874],
  ['BWI', 'Baltimore/Washington International', 'Baltimore', 39.1774, -76.6684],
  ['SLC', 'Salt Lake City International', 'Salt Lake City', 40.7899, -111.9791],
  ['DCA', 'Ronald Reagan Washington National', 'Washington', 38.8512, -77.0402],
  ['IAD', 'Washington Dulles International', 'Washington', 38.9531, -77.4565],
  ['SAN', 'San Diego International', 'San Diego', 32.7338, -117.1933],
  ['TPA', 'Tampa International', 'Tampa', 27.9755, -82.5332],
  ['BNA', 'Nashville International', 'Nashville', 36.1263, -86.6774],
  ['AUS', 'Austin-Bergstrom International', 'Austin', 30.1945, -97.6699],
  ['MDW', 'Chicago Midway International', 'Chicago', 41.7868, -87.7522],
  ['HNL', 'Daniel K. Inouye International', 'Honolulu', 21.3187, -157.9224],
  ['PDX', 'Portland International', 'Portland', 45.5898, -122.5951],
  ['STL', 'St. Louis Lambert International', 'St. Louis', 38.7487, -90.37],
  ['RDU', 'Raleigh-Durham International', 'Raleigh', 35.8776, -78.7875],
  ['SMF', 'Sacramento International', 'Sacramento', 38.6954, -121.5908],
  ['SJC', 'San Jose International', 'San Jose', 37.3639, -121.9289],
  ['OAK', 'Oakland International', 'Oakland', 37.7126, -122.2197],
  ['SNA', 'John Wayne', 'Orange County', 33.6757, -117.8682],
  ['BUR', 'Hollywood Burbank', 'Burbank', 34.2007, -118.3585],
  ['ONT', 'Ontario International', 'Ontario', 34.056, -117.6012],
  ['HOU', 'William P. Hobby', 'Houston', 29.6454, -95.2789],
  ['DAL', 'Dallas Love Field', 'Dallas', 32.8471, -96.8518],
  ['SAT', 'San Antonio International', 'San Antonio', 29.5337, -98.4698],
  ['MCI', 'Kansas City International', 'Kansas City', 39.2976, -94.7139],
  ['CLE', 'Cleveland Hopkins International', 'Cleveland', 41.4117, -81.8498],
  ['PIT', 'Pittsburgh International', 'Pittsburgh', 40.4915, -80.2329],
  ['IND', 'Indianapolis International', 'Indianapolis', 39.7173, -86.2944],
  ['CMH', 'John Glenn Columbus International', 'Columbus', 39.998, -82.8919],
  ['CVG', 'Cincinnati/Northern Kentucky International', 'Cincinnati', 39.0533, -84.663],
  ['MKE', 'Milwaukee Mitchell International', 'Milwaukee', 42.9472, -87.8966],
  ['RSW', 'Southwest Florida International', 'Fort Myers', 26.5362, -81.7552],
  ['JAX', 'Jacksonville International', 'Jacksonville', 30.4941, -81.6879],
  ['PBI', 'Palm Beach International', 'West Palm Beach', 26.6832, -80.0956],
  ['MSY', 'Louis Armstrong New Orleans International', 'New Orleans', 29.9934, -90.258],
  ['RIC', 'Richmond International', 'Richmond', 37.5052, -77.3197],
  ['BUF', 'Buffalo Niagara International', 'Buffalo', 42.9405, -78.7322],
  ['OMA', 'Eppley Airfield', 'Omaha', 41.3032, -95.8941],
  ['OKC', 'Will Rogers World', 'Oklahoma City', 35.3931, -97.6007],
  ['ABQ', 'Albuquerque International Sunport', 'Albuquerque', 35.0402, -106.6092],
  ['ANC', 'Ted Stevens Anchorage International', 'Anchorage', 61.1743, -149.9962],
  ['BOI', 'Boise Airport', 'Boise', 43.5644, -116.2228],
  ['GEG', 'Spokane International', 'Spokane', 47.6199, -117.5338],
  ['RNO', 'Reno-Tahoe International', 'Reno', 39.4991, -119.7681],
  ['TUS', 'Tucson International', 'Tucson', 32.1161, -110.941],
  ['BDL', 'Bradley International', 'Hartford', 41.9389, -72.6832],
  ['PVD', 'Rhode Island T.F. Green International', 'Providence', 41.7267, -71.433],
  ['ORF', 'Norfolk International', 'Norfolk', 36.8946, -76.2012],
  ['SDF', 'Louisville Muhammad Ali International', 'Louisville', 38.174, -85.7365],
  ['MEM', 'Memphis International', 'Memphis', 35.0424, -89.9767],
  ['BHM', 'Birmingham-Shuttlesworth International', 'Birmingham', 33.5629, -86.7535],
  ['CHS', 'Charleston International', 'Charleston', 32.8986, -80.0405],
  ['SAV', 'Savannah/Hilton Head International', 'Savannah', 32.1276, -81.2021],
  ['PSP', 'Palm Springs International', 'Palm Springs', 33.8297, -116.5067],
  ['FAT', 'Fresno Yosemite International', 'Fresno', 36.7762, -119.7181],
  ['OGG', 'Kahului', 'Maui', 20.8986, -156.4305],
  ['KOA', 'Ellison Onizuka Kona International', 'Kona', 19.7388, -156.0456],
  ['LIH', 'Lihue', 'Kauai', 21.976, -159.338],
  ['PWM', 'Portland International Jetport', 'Portland', 43.6462, -70.3093],
  ['YYZ', 'Toronto Pearson International', 'Toronto', 43.6777, -79.6248],
  ['YVR', 'Vancouver International', 'Vancouver', 49.1947, -123.1792],
  ['YUL', 'Montréal-Trudeau International', 'Montreal', 45.4706, -73.7408],
  ['YYC', 'Calgary International', 'Calgary', 51.1215, -114.0076],
  ['MEX', 'Mexico City International', 'Mexico City', 19.4361, -99.0719],
  ['CUN', 'Cancún International', 'Cancun', 21.0365, -86.8771],
  ['LHR', 'London Heathrow', 'London', 51.47, -0.4543],
  ['LGW', 'London Gatwick', 'London', 51.1537, -0.1821],
  ['CDG', 'Paris Charles de Gaulle', 'Paris', 49.0097, 2.5479],
  ['AMS', 'Amsterdam Schiphol', 'Amsterdam', 52.3105, 4.7683],
  ['FRA', 'Frankfurt Airport', 'Frankfurt', 50.0379, 8.5622],
  ['MUC', 'Munich Airport', 'Munich', 48.3537, 11.775],
  ['MAD', 'Madrid Barajas', 'Madrid', 40.4983, -3.5676],
  ['BCN', 'Barcelona El Prat', 'Barcelona', 41.2974, 2.0833],
  ['FCO', 'Rome Fiumicino', 'Rome', 41.8003, 12.2389],
  ['ZRH', 'Zurich Airport', 'Zurich', 47.4647, 8.5492],
  ['DUB', 'Dublin Airport', 'Dublin', 53.4264, -6.2499],
  ['LIS', 'Lisbon Humberto Delgado', 'Lisbon', 38.7756, -9.1354],
  ['IST', 'Istanbul Airport', 'Istanbul', 41.2753, 28.7519],
  ['DXB', 'Dubai International', 'Dubai', 25.2532, 55.3657],
  ['DOH', 'Hamad International', 'Doha', 25.2731, 51.6081],
  ['SIN', 'Singapore Changi', 'Singapore', 1.3644, 103.9915],
  ['HKG', 'Hong Kong International', 'Hong Kong', 22.308, 113.9185],
  ['NRT', 'Narita International', 'Tokyo', 35.772, 140.3929],
  ['HND', 'Tokyo Haneda', 'Tokyo', 35.5494, 139.7798],
  ['ICN', 'Seoul Incheon International', 'Seoul', 37.4602, 126.4407],
  ['TPE', 'Taiwan Taoyuan International', 'Taipei', 25.0797, 121.2342],
  ['BKK', 'Suvarnabhumi', 'Bangkok', 13.69, 100.7501],
  ['KUL', 'Kuala Lumpur International', 'Kuala Lumpur', 2.7456, 101.7072],
  ['SYD', 'Sydney Kingsford Smith', 'Sydney', -33.9399, 151.1753],
  ['MEL', 'Melbourne Airport', 'Melbourne', -37.669, 144.841],
  ['AKL', 'Auckland Airport', 'Auckland', -37.0082, 174.785],
  ['DEL', 'Indira Gandhi International', 'Delhi', 28.5562, 77.1],
  ['BOM', 'Chhatrapati Shivaji Maharaj International', 'Mumbai', 19.0896, 72.8656],
  ['GRU', 'São Paulo Guarulhos', 'São Paulo', -23.4356, -46.4731],
  ['GIG', 'Rio de Janeiro Galeão', 'Rio de Janeiro', -22.809, -43.2506],
  ['EZE', 'Buenos Aires Ezeiza', 'Buenos Aires', -34.8222, -58.5358],
  ['SCL', 'Santiago Arturo Merino Benítez', 'Santiago', -33.393, -70.7858],
  ['BOG', 'Bogotá El Dorado', 'Bogotá', 4.7016, -74.1469],
  ['LIM', 'Lima Jorge Chávez', 'Lima', -12.0219, -77.1143],
  ['JNB', 'O. R. Tambo International', 'Johannesburg', -26.1392, 28.246],
  ['CPT', 'Cape Town International', 'Cape Town', -33.9648, 18.6017],
];

function toAirport(row: AirportRow): Airport {
  return {
    iata: row[0],
    name: row[1],
    city: row[2],
    lat: row[3],
    lng: row[4],
  };
}

export const AIRPORTS: Airport[] = ROWS.map(toAirport);

const BY_IATA = new Map(AIRPORTS.map((airport) => [airport.iata, airport]));

export function findAirport(iata?: string | null): Airport | undefined {
  if (!iata) return undefined;
  return BY_IATA.get(iata.trim().toUpperCase());
}

export function searchAirports(query: string, limit = 8): Airport[] {
  const needle = query.trim().toUpperCase();
  if (needle.length < 1) return [];
  const scored = AIRPORTS.map((airport) => {
    if (airport.iata === needle) return { airport, score: 0 };
    if (airport.iata.startsWith(needle)) return { airport, score: 1 };
    if (airport.city.toUpperCase().startsWith(needle)) return { airport, score: 2 };
    if (airport.name.toUpperCase().includes(needle)) return { airport, score: 3 };
    if (airport.city.toUpperCase().includes(needle)) return { airport, score: 4 };
    return null;
  }).filter((item): item is { airport: Airport; score: number } => item != null);
  return scored
    .sort((a, b) => a.score - b.score || a.airport.iata.localeCompare(b.airport.iata))
    .slice(0, limit)
    .map((item) => item.airport);
}

export function airportFromPartial(partial: {
  iata?: string | null;
  name?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
}): Airport | null {
  const known = findAirport(partial.iata);
  if (known) {
    return {
      ...known,
      name: partial.name || known.name,
      city: partial.city || known.city,
      lat: partial.lat ?? known.lat,
      lng: partial.lng ?? known.lng,
    };
  }
  if (partial.iata && partial.lat != null && partial.lng != null) {
    return {
      iata: partial.iata.toUpperCase(),
      name: partial.name || `${partial.iata.toUpperCase()} Airport`,
      city: partial.city || '',
      lat: partial.lat,
      lng: partial.lng,
    };
  }
  return null;
}
