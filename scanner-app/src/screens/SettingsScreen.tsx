import React from 'react';
import { View, Text, Switch, Pressable } from 'react-native';
import { useAppState } from '../state/AppState';
import { colors } from '../utils/theme';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function SettingsScreen() {
  const { preferences, setPreferences, eventLock, setEventLock } = useAppState();

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 16 }}>Preferences</Text>

      <Row label="Haptics" value={preferences.haptics} onChange={(v) => setPreferences({ haptics: v })} />
      <Row label="Sound" value={preferences.beep} onChange={(v) => setPreferences({ beep: v })} />
      <Row label="Torch" value={preferences.torch} onChange={(v) => setPreferences({ torch: v })} />

      <View style={{ height: 24 }} />
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 8 }}>Event</Text>
      <Text style={{ color: colors.muted, marginBottom: 12 }}>Current lock: {eventLock || 'None'}</Text>
      <Pressable onPress={() => setEventLock(null)} style={({ pressed }) => ({ borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, opacity: pressed ? 0.7 : 1 })}>
        <Text style={{ textAlign: 'center' }}>Clear Event Lock</Text>
      </Pressable>

      <View style={{ height: 24 }} />
      <Pressable onPress={() => signOut(auth)} style={({ pressed }) => ({ backgroundColor: colors.error, padding: 12, borderRadius: 8, opacity: pressed ? 0.7 : 1 })}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
      <Text>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}
