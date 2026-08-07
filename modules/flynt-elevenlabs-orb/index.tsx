import { requireNativeViewManager } from 'expo-modules-core';
import type { ViewProps } from 'react-native';

export type FlyntElevenLabsOrbState =
  | 'connecting'
  | 'disconnected'
  | 'initializing'
  | 'listening'
  | 'speaking'
  | 'thinking'
  | 'unknown';

export type FlyntElevenLabsOrbProps = ViewProps & {
  agentState?: FlyntElevenLabsOrbState;
  colorOne?: string;
  colorTwo?: string;
  inputVolume?: number;
  outputVolume?: number;
  previewActive?: boolean;
  previewMode?: boolean;
};

export const FlyntElevenLabsOrb = requireNativeViewManager<FlyntElevenLabsOrbProps>(
  'FlyntElevenLabsOrb',
  'FlyntElevenLabsOrbView',
);
