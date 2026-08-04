import { createContext, type PropsWithChildren, useContext, useState } from 'react';

import { useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';

type SettingsPreferencesContextValue = {
  reminders: boolean;
  setReminders: (value: boolean) => void;
  reminderTime: string;
  setReminderTime: (value: string) => void;
  progression: boolean;
  setProgression: (value: boolean) => void;
  progressionStyle: string;
  setProgressionStyle: (value: string) => void;
  restTimers: boolean;
  setRestTimers: (value: boolean) => void;
  restLength: string;
  setRestLength: (value: string) => void;
  spotifyDisplay: string;
  setSpotifyDisplay: (value: string) => void;
};

const SettingsPreferencesContext = createContext<SettingsPreferencesContextValue | null>(null);

export function SettingsPreferencesProvider({ children }: PropsWithChildren) {
  const { appState } = useLifecycleNavigation();
  const accountKey = appState?.profile.email ?? 'signed-out';
  const preferences = appState?.preferences;
  const [hourValue, minute = '00'] = (preferences?.reminderTime ?? '08:00').split(':');
  const hour = Number(hourValue);
  const displayHour = hour % 12 || 12;
  const authoritative = {
    reminders: preferences?.reminderEnabled ?? true,
    reminderTime: `${displayHour}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`,
    progression: preferences?.progressionEnabled ?? true,
    progressionStyle: preferences ? preferences.progressionMode.charAt(0).toUpperCase() + preferences.progressionMode.slice(1) : 'Balanced',
    restTimers: preferences?.restTimersEnabled ?? true,
    restLength: preferences?.restTimerMode === 'full_recovery' ? 'Full recovery' : preferences?.restTimerMode === 'quick' ? 'Quick' : 'Adaptive',
    spotifyDisplay: preferences ? preferences.spotifyPlayerDisplay.charAt(0).toUpperCase() + preferences.spotifyPlayerDisplay.slice(1) : 'Pill',
  };
  const [local, setLocal] = useState<{ accountKey: string; values: typeof authoritative } | null>(null);
  const values = local?.accountKey === accountKey ? local.values : authoritative;
  const update = <Key extends keyof typeof authoritative>(key: Key, value: typeof authoritative[Key]) => {
    setLocal((current) => ({
      accountKey,
      values: { ...(current?.accountKey === accountKey ? current.values : authoritative), [key]: value },
    }));
  };
  const { reminders, reminderTime, progression, progressionStyle, restTimers, restLength, spotifyDisplay } = values;
  const setReminders = (value: boolean) => update('reminders', value);
  const setReminderTime = (value: string) => update('reminderTime', value);
  const setProgression = (value: boolean) => update('progression', value);
  const setProgressionStyle = (value: string) => update('progressionStyle', value);
  const setRestTimers = (value: boolean) => update('restTimers', value);
  const setRestLength = (value: string) => update('restLength', value);
  const setSpotifyDisplay = (value: string) => update('spotifyDisplay', value);
  const value = {
    reminders,
    setReminders,
    reminderTime,
    setReminderTime,
    progression,
    setProgression,
    progressionStyle,
    setProgressionStyle,
    restTimers,
    setRestTimers,
    restLength,
    setRestLength,
    spotifyDisplay,
    setSpotifyDisplay,
  };

  return <SettingsPreferencesContext.Provider value={value}>{children}</SettingsPreferencesContext.Provider>;
}

export function useSettingsPreferences() {
  const context = useContext(SettingsPreferencesContext);
  if (!context) throw new Error('useSettingsPreferences must be used within SettingsPreferencesProvider');
  return context;
}
