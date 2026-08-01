import type { LifecycleStatus } from '@/contracts/app-state';

export const lifecycleDestinations = [
  'signed-out',
  'consultation',
  'building',
  'ready',
  'attention',
] as const;

export type LifecycleDestination = (typeof lifecycleDestinations)[number];

export function destinationForLifecycle(
  lifecycle: LifecycleStatus,
): Exclude<LifecycleDestination, 'signed-out'> {
  switch (lifecycle) {
    case 'account_required':
    case 'consultation_required':
    case 'consultation_in_progress':
      return 'consultation';
    case 'program_building':
      return 'building';
    case 'ready':
      return 'ready';
    case 'build_attention':
      return 'attention';
  }
}

export function routeForDestination(destination: LifecycleDestination) {
  switch (destination) {
    case 'signed-out':
      return '/';
    case 'consultation':
      return '/consultation';
    case 'building':
      return '/program-building';
    case 'ready':
      return '/today';
    case 'attention':
      return '/build-attention';
  }
}
