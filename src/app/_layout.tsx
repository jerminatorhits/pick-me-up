import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { PickupProvider } from '@/context/PickupContext';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <PickupProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="add"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="settings" />
        <Stack.Screen name="pickup/[id]" />
      </Stack>
    </PickupProvider>
  );
}
