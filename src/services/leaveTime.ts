import type { Pickup, Settings } from '@/types';

export function computeReadyAt(
  arrivalIso: string,
  settings: Pick<Settings, 'readyMinutes'>,
): string {
  return new Date(new Date(arrivalIso).getTime() + settings.readyMinutes * 60_000).toISOString();
}

export function computeLeavePlan(
  arrivalIso: string,
  driveDurationSeconds: number | undefined,
  settings: Pick<Settings, 'readyMinutes' | 'extraBufferMinutes'>,
) {
  const readyAt = computeReadyAt(arrivalIso, settings);
  if (driveDurationSeconds == null) {
    return { readyAt, leaveAt: undefined as string | undefined };
  }
  const leaveAt = new Date(
    new Date(readyAt).getTime() - driveDurationSeconds * 1000 - settings.extraBufferMinutes * 60_000,
  );
  return {
    readyAt,
    leaveAt: leaveAt.toISOString(),
  };
}

export function applyTiming(pickup: Pickup, settings: Pick<Settings, 'readyMinutes' | 'extraBufferMinutes'>): Pickup {
  if (!pickup.estimatedArrival) return pickup;
  const plan = computeLeavePlan(pickup.estimatedArrival, effectiveDriveSeconds(pickup), settings);
  return {
    ...pickup,
    readyAt: plan.readyAt,
    leaveAt: plan.leaveAt,
  };
}

export function effectiveDriveSeconds(pickup: Pickup): number | undefined {
  if (pickup.driveOverrideMinutes != null) {
    return pickup.driveOverrideMinutes * 60;
  }
  return pickup.driveDurationSeconds;
}

export function arrivalTimestamp(pickup: Pickup): number {
  return new Date(pickup.estimatedArrival || pickup.scheduledArrival || 0).getTime();
}

export function isPickupActive(pickup: Pickup, now = Date.now()): boolean {
  if (pickup.status === 'cancelled') return false;
  return arrivalTimestamp(pickup) > now - 3 * 60 * 60_000;
}

export function comparePickups(a: Pickup, b: Pickup): number {
  const aTime = a.leaveAt ? new Date(a.leaveAt).getTime() : arrivalTimestamp(a);
  const bTime = b.leaveAt ? new Date(b.leaveAt).getTime() : arrivalTimestamp(b);
  return aTime - bTime;
}
