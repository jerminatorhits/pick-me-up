import * as Location from 'expo-location';

export type Coordinates = {
  lat: number;
  lng: number;
};

function browserCoordinates(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Location is not available in this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => reject(new Error('Location permission is needed to estimate drive time to the airport.')),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
    );
  });
}

export async function getCurrentCoordinates(): Promise<Coordinates> {
  try {
    const existing = await Location.getForegroundPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Location.requestForegroundPermissionsAsync();
      status = requested.status;
    }
    if (status === 'granted') {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    }
  } catch {
    // Fall through to the browser geolocation API on web.
  }
  return browserCoordinates();
}
