import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { FocusButton } from '../../src/components/FocusButton';
import { theme } from '../../src/theme';
import { SignUpState } from '../../src/services/navigationStack';

const FOCUS_OPTIONS = ['High School', 'Exam Prep', 'University'];

interface FocusScreenProps {
  onStateUpdate?: (state: Partial<SignUpState>) => void;
}

export default function FocusScreen(props?: FocusScreenProps) {
  const router = useRouter();
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFocusSelect = (focus: string) => {
    setSelectedFocus(focus);
    props?.onStateUpdate?.({
      focus,
      currentStep: 'hub',
    });

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/auth/hub');
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
        <Text style={styles.title}>What's the Focus?</Text>
      </View>

      <View style={styles.buttonContainer}>
        {FOCUS_OPTIONS.map((option) => (
          <FocusButton 
            key={option}
            title={option} 
            onPress={() => handleFocusSelect(option)}
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
    paddingTop: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 40,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 32,
    color: '#000000',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
});
