import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Muted, StatusBadge, Title } from '@/components/ui';
import { usePickups } from '@/context/PickupContext';
import { confirmAction } from '@/lib/confirm';
import { goBackOrHome } from '@/lib/navigation';
import { formatCountdown, formatDateTime, formatDuration, formatTime } from '@/lib/time';
import { mapsDirectionsUrl } from '@/services/travelTime';
import { colors, spacing } from '@/theme';

export default function PickupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { pickups, refreshPickup, removePickup } = usePickups();
  const pickup = pickups.find((item) => item.id === id);
  const [now, setNow] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const leavePassed = useMemo(() => {
    if (!pickup?.leaveAt) return false;
    return new Date(pickup.leaveAt).getTime() <= now;
  }, [now, pickup?.leaveAt]);

  if (!pickup) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Title>Pickup not found</Title>
          <Button label="Back" onPress={() => goBackOrHome(router)} />
        </View>
      </SafeAreaView>
    );
  }

  const current = pickup;

  async function handleRefresh() {
    setError(null);
    setRefreshing(true);
    try {
      await refreshPickup(current.id);
      void Haptics.selectionAsync();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Refresh failed.');
    } finally {
      setRefreshing(false);
    }
  }

  async function handleDelete() {
    const label = current.label ? `${current.flightNumber} · ${current.label}` : current.flightNumber;
    const confirmed = await confirmAction(
      `Delete ${label}?`,
      'This pickup and its leave-now notification will be removed.',
    );
    if (!confirmed) return;
    await removePickup(current.id);
    goBackOrHome(router);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrHome(router)}>
            <Text style={styles.back}>Back</Text>
          </Pressable>
          <StatusBadge status={pickup.status} label={pickup.statusLabel} />
        </View>
        <Title>{pickup.flightNumber}</Title>
        {pickup.label ? <Text style={styles.person}>{pickup.label}</Text> : null}
        <Text style={styles.route}>
          {pickup.departureAirport.iata} → {pickup.arrivalAirport.iata}
        </Text>
        <Muted>
          {pickup.arrivalAirport.name}
          {pickup.arrivalAirport.city ? ` · ${pickup.arrivalAirport.city}` : ''}
        </Muted>

        <Card>
          <Text style={styles.eyebrow}>
            {pickup.leaveAt ? (leavePassed ? 'You should be on the road' : 'Leave in') : 'Passenger ready in'}
          </Text>
          <Text style={styles.hero}>
            {pickup.leaveAt
              ? leavePassed
                ? 'Now'
                : formatCountdown(pickup.leaveAt, now)
              : formatCountdown(pickup.readyAt, now)}
          </Text>
          <Muted>Leave at {formatTime(pickup.leaveAt)}</Muted>
          <Muted>Be ready at the airport around {formatTime(pickup.readyAt)}</Muted>
        </Card>

        <Card style={styles.facts}>
          <Fact label="Lands" value={formatDateTime(pickup.estimatedArrival)} />
          <Fact
            label="Drive"
            value={driveLabel(pickup)}
          />
          {pickup.terminal ? <Fact label="Terminal" value={pickup.terminal} /> : null}
          {pickup.gate ? <Fact label="Gate" value={pickup.gate} /> : null}
          {pickup.baggage ? <Fact label="Baggage" value={pickup.baggage} /> : null}
          {pickup.lastRefreshedAt ? (
            <Fact label="Updated" value={formatTime(pickup.lastRefreshedAt)} />
          ) : null}
        </Card>

        {pickup.driveError ? <Text style={styles.error}>{pickup.driveError}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Open Google Maps"
          onPress={() => void Linking.openURL(mapsDirectionsUrl(pickup.arrivalAirport))}
        />
        <Button
          label={refreshing ? 'Refreshing…' : 'Refresh flight and traffic'}
          variant="secondary"
          onPress={() => void handleRefresh()}
          disabled={refreshing}
        />
        <Button label="Delete pickup" variant="danger" onPress={handleDelete} />
      </ScrollView>
    </SafeAreaView>
  );
}

function driveLabel(pickup: { driveOverrideMinutes?: number; driveDurationSeconds?: number; driveSource?: string }): string {
  const seconds =
    pickup.driveOverrideMinutes != null ? pickup.driveOverrideMinutes * 60 : pickup.driveDurationSeconds;
  const duration = formatDuration(seconds);
  if (duration === '—') return duration;
  if (pickup.driveSource === 'google') return `${duration} with traffic`;
  if (pickup.driveSource === 'osrm') return `${duration} by road`;
  if (pickup.driveSource === 'estimate') return `about ${duration}`;
  if (pickup.driveSource === 'override') return `${duration} (override)`;
  return duration;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
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
  back: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 16,
  },
  person: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '600',
  },
  route: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  eyebrow: {
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
    fontSize: 12,
  },
  hero: {
    color: colors.accent,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1.5,
    marginVertical: 4,
  },
  facts: {
    gap: 12,
  },
  fact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  factLabel: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  factValue: {
    color: colors.text,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  error: {
    color: colors.danger,
  },
});
