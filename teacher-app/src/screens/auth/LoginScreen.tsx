import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Spacing } from '../../theme';
import Input from '../../components/ui/Input';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const insets = useSafeAreaInsets();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = () => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1500);
  };

  return (
    <View style={styles.root}>
      {/* ── Top section ──────────────────────────────────────────────── */}
      <View style={[styles.topSection, { paddingTop: insets.top + 20 }]}>
        {/* Logo box — gradient simulation (primary → accent diagonal split) */}
        <View style={styles.logoBox}>
          <View style={styles.logoGradientLeft} />
          <View style={styles.logoGradientRight} />
          <Text style={styles.logoEmoji}>🎓</Text>
        </View>

        <Text style={styles.appName}>EduConnect</Text>
        <Text style={styles.appSub}>Espace Enseignant</Text>
      </View>

      {/* ── Form card ────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.formCard,
            { paddingBottom: Math.max(insets.bottom + 24, 32) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Text style={styles.formTitle}>Connexion</Text>

          <Input
            label="EMAIL"
            placeholder="vous@ecole.edu.dz"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <Input
            label="MOT DE PASSE"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Forgot password */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.forgotRow}
            onPress={() => {}}
          >
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* Connect button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading}
            style={[styles.loginBtn, loading && styles.loginBtnLoading]}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.loginBtnText}>Se connecter →</Text>
            )}
          </TouchableOpacity>

          {/* Footer note */}
          <Text style={styles.footerNote}>
            Compte créé par votre administration
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D1B3E',
    justifyContent: 'flex-end',
  },

  // Top section
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },

  // Logo box with gradient simulation
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoGradientLeft: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary,
  },
  logoGradientRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 80,
    height: 80,
    backgroundColor: Colors.accent,
    opacity: 0.55,
    borderRadius: 20,
    transform: [{ rotate: '45deg' }, { translateX: 20 }],
  },
  logoEmoji: {
    fontSize: 40,
    zIndex: 1,
  },

  appName: {
    fontSize: 32,
    fontFamily: Fonts.extraBold,
    color: Colors.white,
    marginTop: 16,
  },
  appSub: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },

  // Form card
  formCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  formTitle: {
    fontSize: 22,
    fontFamily: Fonts.extraBold,
    color: Colors.gray900,
    marginBottom: 24,
  },

  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },

  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  loginBtnLoading: {
    opacity: 0.75,
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },

  footerNote: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.gray500,
    textAlign: 'center',
    marginTop: 16,
  },
});
