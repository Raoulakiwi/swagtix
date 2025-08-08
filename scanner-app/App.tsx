import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStateProvider, useAppState } from './src/state/AppState';
import { colors } from './src/utils/theme';
import LoginScreen from './src/screens/LoginScreen';
import EventLockScreen from './src/screens/EventLockScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import ResultScreen from './src/screens/ResultScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Text, Pressable } from 'react-native';

export type RootStackParamList = {
  Login: undefined;
  EventLock: undefined;
  Scanner: undefined;
  Result: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { user, eventLock } = useAppState();

  return (
    <Stack.Navigator>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : !eventLock ? (
        <Stack.Screen name="EventLock" component={EventLockScreen} options={{ title: 'Event Lock', headerShown: false }} />
      ) : (
        <>
          <Stack.Screen 
            name="Scanner" 
            component={ScannerScreen} 
            options={{ 
              title: 'SwagTix Scanner', 
              headerBackVisible: false,
              headerRight: () => <SettingsButton />
            }} 
          />
          <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Ticket Result' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

function SettingsButton() {
  const navigation = useNavigation();
  return (
    <Pressable 
      onPress={() => navigation.navigate('Settings')}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Text style={{ fontSize: 24, marginRight: 10 }}>⚙️</Text>
    </Pressable>
  );
}

export default function App() {
  const theme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.background, text: colors.text }
  };

  return (
    <AppStateProvider>
      <NavigationContainer theme={theme}>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
    </AppStateProvider>
  );
}
