import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useAppState } from '../state/AppState';
import { useNavigation } from '@react-navigation/native';
import { statusToColor, colors } from '../utils/theme';

export default function ResultScreen() {
  const { lastResult } = useAppState();
  const navigation = useNavigation();

  if (!lastResult) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>No result yet</Text>
        <Pressable onPress={() => navigation.navigate('Scanner' as never)} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.primary }}>Back to Scanner</Text>
        </Pressable>
      </View>
    );
  }

  const seatID = lastResult.ticket?.seatID;
  const seatIdentifier = lastResult.ticket?.seatIdentifier;

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: statusToColor(lastResult.status), marginBottom: 12 }}>{lastResult.status.toUpperCase()}</Text>
      {lastResult.message ? <Text style={{ marginBottom: 12 }}>{lastResult.message}</Text> : null}
      <Text style={{ fontWeight: '600' }}>Ticket ID:</Text>
      <Text style={{ marginBottom: 8 }}>{String(lastResult.ticket?.ticketId || lastResult.ticket?.id || '')}</Text>
      <Text style={{ fontWeight: '600' }}>Event ID:</Text>
      <Text style={{ marginBottom: 8 }}>{String(lastResult.ticket?.eventId || '')}</Text>
      {(seatID || seatIdentifier) ? (
        <>
          <Text style={{ fontWeight: '600' }}>Seat:</Text>
          <Text style={{ fontSize: 28, fontWeight: '800' }}>{seatIdentifier || seatID}</Text>
        </>
      ) : (
        <Text style={{ fontStyle: 'italic', color: colors.muted }}>Standing</Text>
      )}

      <Pressable onPress={() => navigation.navigate('Scanner' as never)} style={({ pressed }) => ({ marginTop: 24, backgroundColor: colors.primary, padding: 12, borderRadius: 8, opacity: pressed ? 0.7 : 1 })}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>Back to Scanner</Text>
      </Pressable>
    </View>
  );
}
