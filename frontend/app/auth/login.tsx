import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { CustomInput } from '../../src/components/CustomInput';
import { CustomButton } from '../../src/components/CustomButton';
import { AuthShell } from '../../src/components/AuthShell';
import { theme } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login, error, clearError } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Clean and validate phone number
  const cleanPhoneNumber = (phone: string): string => {
    return phone.replace(/[^\d]/g, '');
  };

  const handlePhoneChange = (text: string) => {
    const cleaned = cleanPhoneNumber(text);
    if (cleaned.length <= 10) {
      setPhoneNumber(cleaned);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = cleanPhoneNumber(phone);
    return cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned);
  };

  const handleLogin = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number starting with 6, 7, 8, or 9');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Invalid Password', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    clearError();

    try {
      // Send phone number with +91 prefix to match signup format
      const fullPhoneNumber = `+91${cleanPhoneNumber(phoneNumber)}`;
      await login(fullPhoneNumber, undefined, password);
      // Navigate to home on success - use a small delay to ensure auth state is updated
      setTimeout(() => {
        router.replace('/');
      }, 100);
    } catch (err) {
      let errorMessage = 'Login failed. Please try again.';
      let errorTitle = 'Login Failed';
      
      if (err instanceof Error) {
        const message = err.message.toLowerCase();
        
        if (message.includes('network') || message.includes('fetch')) {
          errorTitle = 'Network Error';
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (message.includes('invalid credentials') || message.includes('401') || message.includes('unauthorized')) {
          errorTitle = 'Invalid Credentials';
          errorMessage = 'Incorrect phone number or password. Please check your credentials and try again.';
        } else if (message.includes('not found') || message.includes('404')) {
          errorTitle = 'Account Not Found';
          errorMessage = 'No account found with this phone number. Please sign up first.';
        } else if (message.includes('timeout')) {
          errorTitle = 'Request Timeout';
          errorMessage = 'The request took too long. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      <AuthShell
        title="Welcome Back"
        subtitle="Sign in to continue building your network."
        footer={
          <>
            <Text style={styles.signupText}>
              Don&apos;t have an account?{' '}
              <Text
                style={styles.signupLink}
                onPress={() => router.push('/auth/signup')}
              >
                Sign up
              </Text>
            </Text>
            <Text style={styles.forgotText}>
              <Text
                style={styles.forgotLink}
                onPress={() => Alert.alert('Coming Soon', 'Password reset will be available soon.')}
              >
                Forgot password?
              </Text>
            </Text>
          </>
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <View style={styles.inputRow}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>+91</Text>
          </View>
          <CustomInput
            placeholder="Phone Number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            containerStyle={styles.phoneInput}
            maxLength={10}
            editable={!loading}
          />
        </View>

        <CustomInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        <CustomButton
          title="Login"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
          animationType="glow"
        />
      </AuthShell>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 36,
  },
  errorContainer: {
    width: '100%',
    backgroundColor: '#FFECEC',
    borderLeftWidth: 4,
    borderLeftColor: '#D94141',
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
  },
  errorText: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: '#A53030',
  },
  inputRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  countryCode: {
    width: 60,
    height: 56,
    backgroundColor: '#FFF3E9',
    borderWidth: 1.5,
    borderColor: '#E6CDB8',
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  countryCodeText: {
    fontFamily: theme.fonts.regular,
    fontSize: 18,
    color: theme.colors.text,
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
  },
  button: {
    marginTop: 14,
    marginBottom: 18,
  },
  signupText: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  signupLink: {
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primaryDark,
    textDecorationLine: 'underline',
  },
  forgotText: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  forgotLink: {
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primaryDark,
    textDecorationLine: 'underline',
  },
});
