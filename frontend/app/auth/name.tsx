import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { CustomInput } from '../../src/components/CustomInput';
import { CustomButton } from '../../src/components/CustomButton';
import { theme } from '../../src/theme';
import { SignUpState } from '../../src/services/navigationStack';

interface NameScreenProps {
  onStateUpdate?: (state: Partial<SignUpState>) => void;
}

export default function NameScreen(props?: NameScreenProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    if (!firstName || !lastName) return;
    
    // Update parent state if available
    props?.onStateUpdate?.({
      firstName,
      lastName,
      currentStep: 'focus',
    });

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/auth/focus');
    }, 1000);
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/hotake-logo.png')} 
          style={styles.logo}
          resizeMode="contain" 
        />
        <Text style={styles.title}>Here we go!</Text>
        <Text style={styles.subtitle}>
          Please provide us with your First Name and your Last Name
        </Text>
      </View>

      <CustomInput
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      <CustomInput
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />

      <CustomButton 
        title="Continue" 
        onPress={handleContinue} 
        loading={loading}
        disabled={!firstName || !lastName}
        style={styles.button}
      />
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
});
