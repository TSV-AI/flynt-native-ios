import { createContext, type PropsWithChildren, useContext, useMemo, useState } from 'react';

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
  const [reminders, setReminders] = useState(true);
  const [reminderTime, setReminderTime] = useState('8:00 AM');
  const [progression, setProgression] = useState(true);
  const [progressionStyle, setProgressionStyle] = useState('Balanced');
  const [restTimers, setRestTimers] = useState(true);
  const [restLength, setRestLength] = useState('Adaptive');
  const [spotifyDisplay, setSpotifyDisplay] = useState('Pill');
  const value = useMemo(() => ({
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
  }), [reminders, reminderTime, progression, progressionStyle, restTimers, restLength, spotifyDisplay]);

  return <SettingsPreferencesContext.Provider value={value}>{children}</SettingsPreferencesContext.Provider>;
}

export function useSettingsPreferences() {
  const context = useContext(SettingsPreferencesContext);
  if (!context) throw new Error('useSettingsPreferences must be used within SettingsPreferencesProvider');
  return context;
}
