import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

export type Preferences = {
  haptics: boolean;
  beep: boolean;
  torch: boolean;
};

export type ScanStatus = 'valid' | 'already' | 'invalid';
export type ScanResult = { status: ScanStatus; message?: string; ticket?: any } | null;

type AppStateValue = {
  user: User | null;
  eventLock: string | null;
  setEventLock: (eventId: string | null) => void;
  preferences: Preferences;
  setPreferences: (p: Partial<Preferences>) => void;
  lastResult: ScanResult;
  setLastResult: (r: ScanResult) => void;
};

const AppStateContext = createContext<AppStateValue | undefined>(undefined);

const PREFS_KEY = 'swagtix_prefs_v1';
const EVENT_LOCK_KEY = 'swagtix_event_lock_v1';

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [eventLock, _setEventLock] = useState<string | null>(null);
  const [preferences, _setPreferences] = useState<Preferences>({ haptics: true, beep: false, torch: false });
  const [lastResult, setLastResult] = useState<ScanResult>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    (async () => {
      const savedPrefs = await AsyncStorage.getItem(PREFS_KEY);
      if (savedPrefs) _setPreferences(JSON.parse(savedPrefs));
      const savedLock = await AsyncStorage.getItem(EVENT_LOCK_KEY);
      if (savedLock) _setEventLock(savedLock);
    })();
  }, []);

  const setPreferences = (p: Partial<Preferences>) => {
    _setPreferences((prev) => {
      const next = { ...prev, ...p };
      AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const setEventLock = (eventId: string | null) => {
    _setEventLock(eventId);
    if (eventId) AsyncStorage.setItem(EVENT_LOCK_KEY, eventId).catch(() => {});
    else AsyncStorage.removeItem(EVENT_LOCK_KEY).catch(() => {});
  };

  const value = useMemo<AppStateValue>(() => ({ user, eventLock, setEventLock, preferences, setPreferences, lastResult, setLastResult }), [user, eventLock, preferences, lastResult]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
