import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Chip, Field, Muted, StatusBadge, Title } from '@/components/ui';
import { pickupFromFlight, usePickups } from '@/context/PickupContext';
import { findAirport, searchAirports } from '@/data/airports';
import { parseFlightNumber } from '@/lib/flightNumber';
import { goBackOrHome } from '@/lib/navigation';
import { addDays, combineLocalDateAndTime, formatDateLabel, formatDateTime, formatTime, toDateKey } from '@/lib/time';
import { lookupFlight } from '@/services/flights';
import { computeLeavePlan } from '@/services/leaveTime';
import { getCurrentCoordinates } from '@/services/location';
import { estimateDriveTime } from '@/services/travelTime';
import { colors, radius, spacing } from '@/theme';
import type { Airport, FlightInfo } from '@/types';

export default function AddFlightScreen() {
  const router = useRouter();
  const { settings, addPickup } = usePickups();
  const [mode, setMode] = useState<'flight' | 'manual'>('flight');
  const [flightNumber, setFlightNumber] = useState('');
  const [dateKey, setDateKey] = useState(toDateKey(new Date()));
  const [label, setLabel] = useState('');
  const [airportQuery, setAirportQuery] = useState('');
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [landingTime, setLandingTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');
  const [driveOverride, setDriveOverride] = useState('');
  const [flights, setFlights] = useState<FlightInfo[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<FlightInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const dateOptions = useMemo(
    () => Array.from({ length: 6 }, (_, index) => toDateKey(addDays(new Date(), index))),
    [],
  );
  const airportMatches = searchAirports(airportQuery);

  async function handleLookup() {
    setError(null);
    setPreview(null);
    setSelectedFlight(null);
    const parsed = parseFlightNumber(flightNumber);
    if (!parsed) {
      setError('Enter a flight number like UA123.');
      return;
    }
    setBusy(true);
    try {
      const found = await lookupFlight(parsed.iata, dateKey, settings);
      if (found.length === 0) {
        setError('No flight matched that number and date. Try the departure date, or enter it manually.');
        setFlights([]);
        return;
      }
      setFlights(found);
      setSelectedFlight(found[0]);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : 'Could not look up that flight.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    setError(null);
    setBusy(true);
    try {
      if (mode === 'flight') {
        if (!selectedFlight) {
          setError('Look up a flight first, or switch to manual entry.');
          return;
        }
        const override = driveOverride.trim() ? Number(driveOverride) : undefined;
        await addPickup(
          pickupFromFlight(selectedFlight, dateKey, {
            label: label.trim() || undefined,
            driveOverrideMinutes: Number.isFinite(override) ? override : undefined,
          }),
        );
        goBackOrHome(router);
        return;
      }

      const airport = selectedAirport || findAirport(airportQuery);
      if (!airport) {
        setError('Choose an airport from the list, or enter a known IATA code like SFO.');
        return;
      }
      const estimatedArrival = combineLocalDateAndTime(dateKey, landingTime);
      const override = driveOverride.trim() ? Number(driveOverride) : undefined;
      let driveDurationSeconds: number | undefined;
      if (override == null) {
        try {
          const origin = await getCurrentCoordinates();
          const estimate = await estimateDriveTime(origin, airport, settings.googleMapsKey);
          driveDurationSeconds = estimate.durationSeconds;
          const plan = computeLeavePlan(estimatedArrival, driveDurationSeconds, settings);
          setPreview(
            `Leave around ${formatTime(plan.leaveAt)} · drive ${Math.round(driveDurationSeconds / 60)} min`,
          );
        } catch {
          // addPickup recalculates drive time after save.
        }
      }
      await addPickup({
        source: 'manual',
        label: label.trim() || undefined,
        flightNumber: parseFlightNumber(flightNumber)?.iata || flightNumber.toUpperCase() || 'MANUAL',
        flightDate: dateKey,
        status: 'scheduled',
        statusLabel: 'Manual',
        departureAirport: { iata: '—', name: 'Unknown', city: '', lat: 0, lng: 0 },
        arrivalAirport: airport,
        estimatedArrival,
        scheduledArrival: estimatedArrival,
        driveDurationSeconds,
        driveOverrideMinutes: Number.isFinite(override) ? override : undefined,
      });
      goBackOrHome(router);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this pickup.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Title>Add pickup</Title>
            <Pressable onPress={() => goBackOrHome(router)}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>
          <Muted>I’ll use the landing time and your location to decide when you should leave.</Muted>

          <View style={styles.row}>
            <Chip label="Flight number" selected={mode === 'flight'} onPress={() => setMode('flight')} />
            <Chip label="Manual airport" selected={mode === 'manual'} onPress={() => setMode('manual')} />
          </View>

          <Field
            label="Who are you picking up?"
            placeholder="Optional name"
            value={label}
            onChangeText={setLabel}
          />

          {mode === 'flight' ? (
            <Field
              label="Flight number"
              placeholder="UA123"
              autoCapitalize="characters"
              value={flightNumber}
              onChangeText={(value) => setFlightNumber(value.toUpperCase())}
            />
          ) : (
            <View style={{ gap: spacing.sm }}>
              <Field
                label="Arrival airport"
                placeholder="SFO or San Francisco"
                autoCapitalize="characters"
                value={airportQuery}
                onChangeText={(value) => {
                  setAirportQuery(value);
                  setSelectedAirport(null);
                }}
              />
              {airportMatches.length > 0 && !selectedAirport ? (
                <View style={styles.matches}>
                  {airportMatches.map((airport) => (
                    <Pressable
                      key={airport.iata}
                      onPress={() => {
                        setSelectedAirport(airport);
                        setAirportQuery(`${airport.iata} · ${airport.city}`);
                      }}
                      style={styles.match}>
                      <Text style={styles.matchCode}>{airport.iata}</Text>
                      <Text style={styles.matchName}>
                        {airport.city} · {airport.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <Field
                label="Flight number (optional)"
                placeholder="UA123"
                autoCapitalize="characters"
                value={flightNumber}
                onChangeText={(value) => setFlightNumber(value.toUpperCase())}
              />
              <Text style={styles.fieldLabel}>Landing time</Text>
              {Platform.OS === 'web' ? (
                <Field
                  label="Time"
                  placeholder="16:30"
                  value={`${String(landingTime.getHours()).padStart(2, '0')}:${String(landingTime.getMinutes()).padStart(2, '0')}`}
                  onChangeText={(value) => {
                    const match = value.match(/^(\d{1,2}):(\d{2})$/);
                    if (!match) return;
                    const next = new Date(landingTime);
                    next.setHours(Number(match[1]), Number(match[2]), 0, 0);
                    setLandingTime(next);
                  }}
                />
              ) : (
                <>
                  {(showTimePicker || Platform.OS === 'ios') && (
                    <DateTimePicker
                      value={landingTime}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      themeVariant="dark"
                      onChange={(_, date) => {
                        if (Platform.OS !== 'ios') setShowTimePicker(false);
                        if (date) setLandingTime(date);
                      }}
                    />
                  )}
                  {Platform.OS === 'android' ? (
                    <Button
                      label={`Landing at ${landingTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`}
                      variant="secondary"
                      onPress={() => setShowTimePicker(true)}
                    />
                  ) : null}
                </>
              )}
            </View>
          )}

          <View>
            <Text style={styles.fieldLabel}>Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {dateOptions.map((option) => (
                <Chip
                  key={option}
                  label={formatDateLabel(option)}
                  selected={option === dateKey}
                  onPress={() => setDateKey(option)}
                />
              ))}
            </ScrollView>
          </View>

          <Field
            label="Drive time override (minutes)"
            placeholder="Leave blank to use Google Maps"
            keyboardType="number-pad"
            value={driveOverride}
            onChangeText={setDriveOverride}
          />

          {mode === 'flight' ? (
            <Button label={busy ? 'Looking up…' : 'Find flight'} onPress={handleLookup} disabled={busy} />
          ) : null}

          {flights.map((flight) => (
            <Pressable key={`${flight.flightNumber}-${flight.arrival.estimated}`} onPress={() => setSelectedFlight(flight)}>
              <Card style={selectedFlight === flight ? styles.selectedCard : undefined}>
                <View style={styles.flightHeader}>
                  <Text style={styles.flightNumber}>{flight.flightNumber}</Text>
                  <StatusBadge status={flight.status} label={flight.statusLabel} />
                </View>
                <Text style={styles.airline}>{flight.airlineName}</Text>
                <Text style={styles.route}>
                  {flight.departure.airport.iata} → {flight.arrival.airport.iata}
                </Text>
                <Muted>Lands {formatDateTime(flight.arrival.estimated)}</Muted>
                {flight.arrival.terminal ? <Muted>Terminal {flight.arrival.terminal}</Muted> : null}
              </Card>
            </Pressable>
          ))}

          {preview ? <Muted>{preview}</Muted> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label={busy ? 'Saving…' : 'Track this pickup'}
            onPress={handleSave}
            disabled={busy}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  close: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  matches: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  match: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  matchCode: {
    color: colors.accent,
    fontWeight: '800',
  },
  matchName: {
    color: colors.textMuted,
    marginTop: 2,
  },
  selectedCard: {
    borderColor: colors.accent,
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flightNumber: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  airline: {
    color: colors.textMuted,
    marginTop: 4,
  },
  route: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 6,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});
