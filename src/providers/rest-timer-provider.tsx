import { AppState } from 'react-native';
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

export type RestTimer = {
  endsAt: number;
  exercise: string;
  seconds: number;
  total: number;
};

type RestTimerValue = {
  adjust: (delta: number) => void;
  expand: () => void;
  isExpanded: boolean;
  minimize: () => void;
  start: (exercise: string, total: number) => void;
  stop: () => void;
  timer: RestTimer | null;
};

const RestTimerContext = createContext<RestTimerValue | null>(null);

export function RestTimerProvider({ children }: PropsWithChildren) {
  const [timer, setTimer] = useState<RestTimer | null>(null);
  const [isExpanded, setExpanded] = useState(false);

  useEffect(() => {
    const endsAt = timer?.endsAt;
    if (!endsAt) return;

    function updateRemainingTime() {
      setTimer((current) => {
        if (!current) return null;
        const seconds = Math.max(0, Math.ceil((current.endsAt - Date.now()) / 1000));
        return seconds === current.seconds ? current : { ...current, seconds };
      });
    }

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 500);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') updateRemainingTime();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [timer?.endsAt]);

  useEffect(() => {
    if (timer?.seconds !== 0) return;
    const timeout = setTimeout(() => {
      setTimer(null);
      setExpanded(false);
    }, 1250);
    return () => clearTimeout(timeout);
  }, [timer?.seconds]);

  const value = useMemo<RestTimerValue>(() => ({
    adjust(delta) {
      setTimer((current) => {
        if (!current) return null;
        const seconds = Math.max(0, current.seconds + delta);
        return {
          ...current,
          endsAt: Date.now() + seconds * 1000,
          seconds,
          total: Math.max(1, current.total + delta),
        };
      });
    },
    expand() {
      if (timer) setExpanded(true);
    },
    isExpanded,
    minimize() {
      if (timer) setExpanded(false);
    },
    start(exercise, total) {
      setTimer({
        endsAt: Date.now() + total * 1000,
        exercise,
        seconds: total,
        total,
      });
      setExpanded(true);
    },
    stop() {
      setTimer(null);
      setExpanded(false);
    },
    timer,
  }), [isExpanded, timer]);

  return <RestTimerContext.Provider value={value}>{children}</RestTimerContext.Provider>;
}

export function useRestTimer() {
  const value = useContext(RestTimerContext);
  if (!value) throw new Error('useRestTimer must be used within RestTimerProvider');
  return value;
}
