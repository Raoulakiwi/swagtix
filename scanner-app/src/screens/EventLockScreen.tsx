import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useAppState } from '../state/AppState';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../utils/theme';

export default function EventLockScreen() {
  const { eventLock, setEventLock } = useAppState();
  const navigation = useNavigation();

  useEffect(() => {
    if (eventLock) navigation.navigate('Scanner' as never);
  }, [eventLock]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 12, color: colors.text }}>Event Lock</Text>
      <Text style={{ fontSize: 16, color: colors.muted, marginBottom: 24 }}>
        The scanner will lock to the event from the first ticket you scan, ensuring all
        subsequent scans are for the same event. You can clear the lock from Settings.
      </Text>
      <Pressable 
        onPress={() => navigation.navigate('Scanner' as never)} 
        style={({ pressed }) => ({ 
          backgroundColor: colors.primary, 
          padding: 14, 
          borderRadius: 10, 
          opacity: pressed ? 0.7 : 1 
        })}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Start Scanning</Text>
      </Pressable>

      {eventLock ? (
        <Pressable 
          onPress={() => setEventLock(null)} 
          style={({ pressed }) => ({ 
            marginTop: 16, 
            borderWidth: 1, 
            borderColor: '#ddd', 
            padding: 12, 
            borderRadius: 10, 
            opacity: pressed ? 0.7 : 1 
          })}
        >
          <Text style={{ textAlign: 'center' }}>Clear Event Lock ({eventLock})</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
