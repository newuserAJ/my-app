import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { NetworkButton } from '../../src/components/NetworkButton';
import { theme } from '../../src/theme';
import { SignUpState } from '../../src/services/navigationStack';

const NETWORK_OPTIONS = [
  {
    title: 'Studying & Prepping.',
    subtitle: 'Schools, Universities & Competitive exams',
    id: 'studying',
    dark: false,
  },
  {
    title: 'Working & Exploring',
    subtitle: 'Careers, Business ventures & Figuring out',
    id: 'working',
    dark: true,
  },
];

interface NetworkScreenProps {
  onStateUpdate?: (state: Partial<SignUpState>) => void;
}

export default function NetworkScreen(props?: NetworkScreenProps) {
  const router = useRouter();
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetwork(networkId);
    props?.onStateUpdate?.({
      network: networkId,
      currentStep: 'details',
    });

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/auth/details');
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
        <Text style={styles.title}>Choose your network</Text>
        <Text style={styles.subtitle}>
          This will shape your feed. You can change it later.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {NETWORK_OPTIONS.map((option) => (
          <NetworkButton 
            key={option.id}
            title={option.title} 
            subtitle={option.subtitle}
            onPress={() => handleNetworkSelect(option.id)}
            dark={option.dark}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
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
  },
  buttonContainer: {
    width: '100%',
  },
});
