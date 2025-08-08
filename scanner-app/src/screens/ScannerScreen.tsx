import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useAppState } from '../state/AppState';
import { parseQrPayload } from '../utils/qr';
import { checkInTicket } from '../firebase';
import { colors, statusToColor } from '../utils/theme';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { eventLock, setEventLock, preferences, setLastResult } = useAppState();
  const [processing, setProcessing] = useState(false);
  const [overlay, setOverlay] = useState<{ visible: boolean; color: string; text: string } | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    (async () => {
      if (preferences.beep) {
        const { sound } = await Audio.Sound.createAsync(require('../../assets/beep.mp3')).catch(() => ({ sound: null as any }));
        soundRef.current = sound;
      }
    })();
    return () => { soundRef.current?.unloadAsync(); };
  }, [preferences.beep]);

  const feedback = useCallback(async (status: 'valid'|'already'|'invalid') => {
    if (preferences.haptics) {
      const pattern = status === 'valid' ? Haptics.NotificationFeedbackType.Success : status === 'already' ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Error;
      Haptics.notificationAsync(pattern);
    }
    if (preferences.beep && soundRef.current) {
      try { await soundRef.current.replayAsync(); } catch {}
    }
  }, [preferences.haptics, preferences.beep]);

  const handleScan = useCallback(async (data: string) => {
    if (processing) return;
    setProcessing(true);
    try {
      const payload = parseQrPayload(data);
      if (!eventLock) {
        setEventLock(payload.eventId);
      } else if (eventLock !== payload.eventId) {
        setOverlay({ visible: true, color: colors.error, text: `Wrong event (locked to ${eventLock})` });
        await feedback('invalid');
        return;
      }

      const res = await checkInTicket({ ticketId: payload.ticketId, eventId: payload.eventId });
      const { status, message, ticket } = res.data as any;
      setLastResult({ status, message, ticket });
      setOverlay({ visible: true, color: statusToColor(status), text: status === 'valid' ? 'Checked In' : status === 'already' ? 'Already Checked In' : (message || 'Invalid') });
      await feedback(status);
    } catch (e: any) {
      setOverlay({ visible: true, color: colors.error, text: 'Invalid QR' });
      await feedback('invalid');
    } finally {
      setTimeout(() => setOverlay(null), 800);
      setProcessing(false);
    }
  }, [processing, eventLock]);

  if (!permission) return <View style={{ flex: 1 }} />;
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ marginBottom: 12 }}>We need your permission to use the camera</Text>
        <Pressable onPress={requestPermission} style={{ backgroundColor: colors.primary, padding: 12, borderRadius: 8 }}>
          <Text style={{ color: '#fff' }}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        torch={preferences.torch ? 'on' : 'off'}
        onBarcodeScanned={(result) => result.data && handleScan(result.data)}
      />

      {/* Overlay */}
      {overlay?.visible ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: overlay.color, padding: 16 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontSize: 18, fontWeight: '700' }}>{overlay.text}</Text>
        </View>
      ) : null}
    </View>
  );
}
