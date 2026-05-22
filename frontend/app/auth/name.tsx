import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { CustomInput } from '../../src/components/CustomInput';
import { CustomButton } from '../../src/components/CustomButton';
import { theme } from '../../src/theme';

export default function NameScreen() {
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

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
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/hotake-logo.png')} 
          style={styles.logo}
          resizeMode="contain" 
        />
        <Text style={styles.title}>What's Your Name?</Text>
        <Text style={styles.subtitle}>
          Help us know you better
        </Text>
      </View>

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

      <Text style={styles.loginText}>
        Already have an account?{' '}
        <Text 
          style={styles.loginLink}
          onPress={() => router.push('/auth/login')}
        >
          Login here
        </Text>
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 32,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  button: {
    marginTop: 40,
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
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
});
