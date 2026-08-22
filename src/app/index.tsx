import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button, Card, Muted, StatusBadge, Title } from '@/components/ui';
import { usePickups } from '@/context/PickupContext';
import { confirmAction } from '@/lib/confirm';
import { comparePickups, isPickupActive } from '@/services/leaveTime';
import { formatCountdown, formatTime } from '@/lib/time';
import { colors, radius, spacing } from '@/theme';
import type { Pickup } from '@/types';

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

function PickupCard({
  pickup,
  now,
  featured,
  onDelete,
}: {
  pickup: Pickup;
  now: number;
  featured?: boolean;
  onDelete: (pickup: Pickup) => void;
}) {
  const router = useRouter();
  const leaveLabel = pickup.leaveAt ? formatCountdown(pickup.leaveAt, now) : 'Drive time pending';
  const leavePassed = pickup.leaveAt ? new Date(pickup.leaveAt).getTime() <= now : false;

  return (
    <Card style={featured ? styles.heroCard : undefined}>
      <Pressable onPress={() => router.push(`/pickup/${pickup.id}`)}>
        <View style={styles.cardTop}>
          <Text style={styles.flight}>{pickup.flightNumber}</Text>
          <StatusBadge status={pickup.status} label={pickup.statusLabel} />
        </View>
        {pickup.label ? <Text style={styles.person}>{pickup.label}</Text> : null}
        <Text style={styles.route}>
          {pickup.departureAirport.iata} → {pickup.arrivalAirport.iata}
        </Text>
        <Text style={styles.landing}>Lands {formatTime(pickup.estimatedArrival)}</Text>
        <View style={styles.leaveRow}>
          <Text style={styles.leaveEyebrow}>{leavePassed ? 'Leave' : 'Leave in'}</Text>
          <Text style={styles.leaveValue}>{leavePassed ? 'Now' : leaveLabel}</Text>
        </View>
      </Pressable>
      <Pressable onPress={() => onDelete(pickup)} style={styles.deleteButton} hitSlop={8}>
        <Text style={styles.deleteLabel}>Delete</Text>
      </Pressable>
    </Card>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { pickups, ready, settings, removePickup } = usePickups();
  const now = useNow();

  async function handleDelete(pickup: Pickup) {
    const label = pickup.label ? `${pickup.flightNumber} · ${pickup.label}` : pickup.flightNumber;
    const confirmed = await confirmAction(
      `Delete ${label}?`,
      'This pickup and its leave-now notification will be removed.',
    );
    if (confirmed) await removePickup(pickup.id);
  }

  const { upcoming, recent } = useMemo(() => {
    const active = pickups.filter((pickup) => isPickupActive(pickup, now)).sort(comparePickups);
    const past = pickups.filter((pickup) => !isPickupActive(pickup, now)).sort(comparePickups);
    return { upcoming: active, recent: past };
  }, [now, pickups]);

  const hero = upcoming[0];
  const missingKeys = !settings.googleMapsKey && !settings.aeroDataBoxKey && !settings.aviationStackKey;

  return (
    <ScreenSafe>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Airport pickup</Text>
            <Title>Pick Me Up</Title>
          </View>
          <Pressable onPress={() => router.push('/settings')} style={styles.settingsButton}>
            <Text style={styles.settingsLabel}>Settings</Text>
          </Pressable>
        </View>

        {!ready ? <Muted>Loading your pickups…</Muted> : null}

        {ready && missingKeys ? (
          <Card style={styles.notice}>
            <Text style={styles.noticeTitle}>Add API keys to go fully automatic</Text>
            <Muted>
              You can track a flight number once AeroDataBox or AviationStack is set, and Google Maps
              will estimate traffic-aware drive time. Manual airport + landing time still works now.
            </Muted>
            <Button label="Open settings" variant="secondary" onPress={() => router.push('/settings')} />
          </Card>
        ) : null}

        {hero ? <PickupCard pickup={hero} now={now} featured onDelete={handleDelete} /> : null}

        {!hero && ready ? (
          <Card>
            <Text style={styles.emptyTitle}>No pickups yet</Text>
            <Muted>
              Add a flight number and date. I’ll watch the landing time, check drive time from your
              location, and notify you when it’s time to leave.
            </Muted>
          </Card>
        ) : null}

        {upcoming.slice(1).length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Up next</Text>
            {upcoming.slice(1).map((pickup) => (
              <PickupCard key={pickup.id} pickup={pickup} now={now} onDelete={handleDelete} />
            ))}
          </View>
        ) : null}

        {recent.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent</Text>
            {recent.map((pickup) => (
              <PickupCard key={pickup.id} pickup={pickup} now={now} onDelete={handleDelete} />
            ))}
          </View>
        ) : null}

        <Button label="Add a flight" onPress={() => router.push('/add')} />
      </ScrollView>
    </ScreenSafe>
  );
}

function ScreenSafe({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {children}
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  kicker: {
    color: colors.accent,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: 12,
    marginBottom: 4,
  },
  settingsButton: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
  },
  settingsLabel: {
    color: colors.text,
    fontWeight: '600',
  },
  notice: {
    gap: spacing.md,
  },
  noticeTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: colors.bgElevated,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  flight: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  person: {
    color: colors.accent,
    fontWeight: '600',
    marginBottom: 4,
  },
  route: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  landing: {
    color: colors.textMuted,
    marginTop: 4,
  },
  leaveRow: {
    marginTop: spacing.md,
  },
  leaveEyebrow: {
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 12,
    fontWeight: '700',
  },
  leaveValue: {
    color: colors.accent,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingVertical: 4,
  },
  deleteLabel: {
    color: colors.danger,
    fontWeight: '700',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 12,
  },
});
