import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { CustomInput } from '../../src/components/CustomInput';
import { CustomButton } from '../../src/components/CustomButton';
import { AuthShell } from '../../src/components/AuthShell';
import { theme } from '../../src/theme';

export default function SignupScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
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

  const handleSignup = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number starting with 6, 7, 8, or 9');
      return;
    }

    setLoading(true);
    
    try {
      router.push({
        pathname: '/auth/name',
        params: { phoneNumber: cleanPhoneNumber(phoneNumber) },
      });
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      <AuthShell
        title="Create Account"
        subtitle="Start with your mobile number and let us set up your profile."
        footer={
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text
              style={styles.loginLink}
              onPress={() => router.push('/auth/login')}
            >
              Login
            </Text>
          </Text>
        }
      >
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

        <CustomButton
          title="Continue"
          onPress={handleSignup}
          loading={loading}
          disabled={!validatePhoneNumber(phoneNumber) || loading}
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
    marginTop: 10,
    marginBottom: 16,
  },
  loginText: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  loginLink: {
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primaryDark,
    textDecorationLine: 'underline',
  },
});
