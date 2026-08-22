# Pick Me Up

An Expo app that tells you when to leave home to pick someone up from the airport.

Enter a flight number and date (or an airport and landing time). The app looks up the arrival, uses your location plus Google Maps traffic to estimate the drive, and sends a local notification when it is time to go.

## Run it

Use Node 24 (see `.nvmrc`), then:

```bash
npm install
npx expo start
```

Open it in Expo Go or a simulator.

## API keys

Add these in **Settings**. They stay on the device.

1. **Google Maps** — enable [Routes API](https://developers.google.com/maps/documentation/routes) (Distance Matrix still works as a fallback) and create an API key. This powers live drive times.
2. **Flight lookup** (optional if you enter the landing time yourself)
   - [AeroDataBox on RapidAPI](https://rapidapi.com/aerodatabox/api/aerodatabox) — best for flight number + date
   - or [AviationStack](https://aviationstack.com/)

Without a Maps key you can still type a drive-time override. Without a flight key you can still enter the airport and landing time manually.

## Timing

Leave time is:

`landing time + minutes until they are ready − drive time − extra buffer`

Defaults are 20 minutes after landing and a 10-minute buffer. Change them in Settings.
