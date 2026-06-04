import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { CustomInput } from '../../src/components/CustomInput';
import { CustomButton } from '../../src/components/CustomButton';
import { AuthShell } from '../../src/components/AuthShell';
import { theme } from '../../src/theme';

export default function NameScreen() {
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading] = useState(false);

  const handleContinue = async () => {
    if (!firstName || !lastName) return;
    
    router.push({
      pathname: '/auth/details',
      params: { 
        phoneNumber, 
        firstName, 
        lastName 
      },
    });
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      <AuthShell
        title="Tell Us Your Name"
        subtitle="This helps your contacts recognize you instantly."
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
        <CustomInput
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
          editable={!loading}
        />
        <CustomInput
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
          editable={!loading}
        />

        <CustomButton
          title="Continue"
          onPress={handleContinue}
          loading={loading}
          disabled={!firstName || !lastName || loading}
          style={styles.button}
          animationType="scale"
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
  button: {
    marginTop: 10,
  },
  loginText: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
  loginLink: {
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primaryDark,
    textDecorationLine: 'underline',
  },
});
