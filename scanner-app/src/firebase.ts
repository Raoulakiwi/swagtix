import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra || {}) as any;

const firebaseConfig = {
  apiKey: extra.FIREBASE_API_KEY,
  authDomain: extra.FIREBASE_AUTH_DOMAIN,
  projectId: extra.FIREBASE_PROJECT_ID,
  storageBucket: extra.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: extra.FIREBASE_MESSAGING_SENDER_ID,
  appId: extra.FIREBASE_APP_ID,
  measurementId: extra.FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const functions = getFunctions(app, extra.FIREBASE_REGION || 'us-central1');

export type CheckInRequest = { ticketId: string; eventId: string };
export type CheckInResponse = { status: 'valid' | 'already' | 'invalid'; message?: string; ticket?: any };

export const checkInTicket = httpsCallable<CheckInRequest, CheckInResponse>(functions, 'checkInTicket');
