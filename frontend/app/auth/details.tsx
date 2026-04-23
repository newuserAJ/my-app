import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { CustomInput } from '../../src/components/CustomInput';
import { CustomButton } from '../../src/components/CustomButton';
import { theme } from '../../src/theme';
import { SignUpState } from '../../src/services/navigationStack';

const GENDER_OPTIONS = ['Male', 'Female', 'Others'];

interface DetailsScreenProps {
  onStateUpdate?: (state: Partial<SignUpState>) => void;
}

export default function DetailsScreen(props?: DetailsScreenProps) {
  const router = useRouter();
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    if (!day || !month || !year || !gender) return;
    
    props?.onStateUpdate?.({
      day,
      month,
      year,
      gender,
      currentStep: 'details',
    });

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/auth/login');
    }, 1500);
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/hotake-logo.png')} 
          style={styles.logo}
          resizeMode="contain" 
        />
        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.subtitle}>
          For safety checks and poll routing.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>When were you born?</Text>
      <View style={styles.birthdayContainer}>
        <CustomInput
          placeholder="DD"
          keyboardType="number-pad"
          maxLength={2}
          value={day}
          onChangeText={setDay}
          containerStyle={styles.birthdayInput}
        />
        <CustomInput
          placeholder="MM"
          keyboardType="number-pad"
          maxLength={2}
          value={month}
          onChangeText={setMonth}
          containerStyle={styles.birthdayInput}
        />
        <CustomInput
          placeholder="YYYY"
          keyboardType="number-pad"
          maxLength={4}
          value={year}
          onChangeText={setYear}
          containerStyle={styles.yearInput}
        />
      </View>

      <Text style={styles.sectionTitle}>How do you identify?</Text>
      <View style={styles.genderContainer}>
        {GENDER_OPTIONS.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.genderButton,
              gender === item && styles.selectedGenderButton
            ]}
            onPress={() => setGender(item)}
          >
            <Text style={[
              styles.genderButtonText,
              gender === item && styles.selectedGenderButtonText
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <CustomButton 
        title="Continue" 
        onPress={handleContinue} 
        loading={loading}
        disabled={!day || !month || !year || !gender}
        style={styles.button}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
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
  },
  sectionTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 20,
    color: '#000000',
    alignSelf: 'center',
    marginBottom: 15,
  },
  birthdayContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 30,
  },
  birthdayInput: {
    width: 70,
    marginHorizontal: 5,
  },
  yearInput: {
    width: 90,
    marginHorizontal: 5,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 40,
  },
  genderButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedGenderButton: {
    backgroundColor: '#555555',
    borderColor: '#555555',
  },
  genderButtonText: {
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: '#000000',
  },
  selectedGenderButtonText: {
    color: '#FFFFFF',
  },
  button: {
    marginTop: 'auto',
    marginBottom: 20,
  },
});
