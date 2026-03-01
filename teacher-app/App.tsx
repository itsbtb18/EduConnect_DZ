import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Navigation from './src/navigation';
import LoginScreen from './src/screens/auth/LoginScreen';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {isLoggedIn ? (
        <Navigation />
      ) : (
        <LoginScreen onLogin={() => setIsLoggedIn(true)} />
      )}
      <Toast />
    </SafeAreaProvider>
  );
}
