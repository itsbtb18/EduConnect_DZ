import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import useStore from './src/store/useStore';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/auth/LoginScreen';

export default function App() {
  const isLoggedIn = useStore(s => s.isLoggedIn);
  const login      = useStore(s => s.login);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {isLoggedIn ? (
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        ) : (
          <LoginScreen onLogin={login} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
