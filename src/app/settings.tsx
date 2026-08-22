import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, Field, Muted, Title } from '@/components/ui';
import { usePickups } from '@/context/PickupContext';
import { goBackOrHome } from '@/lib/navigation';
import { colors, spacing } from '@/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, refreshAll } = usePickups();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Title>Settings</Title>
          <Pressable onPress={() => goBackOrHome(router)}>
            <Text style={styles.back}>Back</Text>
          </Pressable>
        </View>
        <Muted>
          Keys stay on this device. Google Maps estimates traffic-aware drive time. A flight API lets
          you look up a number and date instead of typing the landing time.
        </Muted>

        <Field
          label="Google Maps API key"
          placeholder="Required for live drive times"
          value={settings.googleMapsKey}
          onChangeText={(googleMapsKey) => void updateSettings({ googleMapsKey })}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Muted>
          In Google Cloud, enable Routes API (or Distance Matrix) and create an API key. Restrict it
          to those APIs.
        </Muted>

        <Text style={styles.section}>Flight lookup</Text>
        <Muted>
          AviationStack’s free plan only has flights that are already operating today. For tomorrow
          and later, use AeroDataBox — it has a free RapidAPI plan (600 units/month, about 300
          lookups) and supports flight number + date, including future schedules.
        </Muted>
        <View style={styles.row}>
          <Chip
            label="AeroDataBox (recommended)"
            selected={settings.flightProvider === 'aerodatabox'}
            onPress={() => void updateSettings({ flightProvider: 'aerodatabox' })}
          />
          <Chip
            label="AviationStack (today only)"
            selected={settings.flightProvider === 'aviationstack'}
            onPress={() => void updateSettings({ flightProvider: 'aviationstack' })}
          />
        </View>
        <Field
          label="AeroDataBox RapidAPI key"
          placeholder="Paste the X-RapidAPI-Key"
          value={settings.aeroDataBoxKey}
          onChangeText={(aeroDataBoxKey) => {
            void updateSettings({
              aeroDataBoxKey,
              flightProvider: aeroDataBoxKey.trim() ? 'aerodatabox' : settings.flightProvider,
            });
          }}
          autoCapitalize="none"
        />
        <Button
          label="Get a free AeroDataBox key"
          variant="secondary"
          onPress={() =>
            void Linking.openURL('https://rapidapi.com/aedbx-aedbx/api/aerodatabox/pricing')
          }
        />
        <Field
          label="AviationStack key"
          placeholder="Live flights only on the free plan"
          value={settings.aviationStackKey}
          onChangeText={(aviationStackKey) => void updateSettings({ aviationStackKey })}
          autoCapitalize="none"
        />

        <Text style={styles.section}>Timing</Text>
        <Field
          label="Minutes after landing until they're ready"
          keyboardType="number-pad"
          value={String(settings.readyMinutes)}
          onChangeText={(value) => {
            const readyMinutes = Number(value);
            if (Number.isFinite(readyMinutes)) void updateSettings({ readyMinutes });
          }}
        />
        <Field
          label="Extra buffer before you should leave"
          keyboardType="number-pad"
          value={String(settings.extraBufferMinutes)}
          onChangeText={(value) => {
            const extraBufferMinutes = Number(value);
            if (Number.isFinite(extraBufferMinutes)) void updateSettings({ extraBufferMinutes });
          }}
        />
        <Field
          label="Heads-up notification (minutes before leave time)"
          keyboardType="number-pad"
          value={String(settings.earlyWarningMinutes)}
          onChangeText={(value) => {
            const earlyWarningMinutes = Number(value);
            if (Number.isFinite(earlyWarningMinutes)) void updateSettings({ earlyWarningMinutes });
          }}
        />

        <View style={styles.row}>
          <Chip
            label={settings.notificationsEnabled ? 'Notifications on' : 'Notifications off'}
            selected={settings.notificationsEnabled}
            onPress={() => void updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
          />
        </View>

        <Button
          label="Save and refresh pickups"
          onPress={() => {
            void refreshAll();
            goBackOrHome(router);
          }}
        />
      </ScrollView>
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
  back: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 16,
  },
  section: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
