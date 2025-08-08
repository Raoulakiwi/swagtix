import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { colors } from '../utils/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      setError(e?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 24, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 24, color: colors.primary }}>SwagTix Scanner</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={{ width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16 }}
      />
      {error ? <Text style={{ color: colors.error, marginBottom: 12 }}>{error}</Text> : null}
      <Pressable onPress={onSignIn} disabled={loading || !email || !password} style={({ pressed }) => ({
        width: '100%', backgroundColor: colors.primary, padding: 14, borderRadius: 10, opacity: pressed || loading || !email || !password ? 0.6 : 1
      })}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Sign In</Text>}
      </Pressable>
    </View>
  );
}
