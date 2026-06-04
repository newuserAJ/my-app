import React, { useState, createElement } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { CustomInput } from '../../src/components/CustomInput';
import { CustomButton } from '../../src/components/CustomButton';
import { AuthShell } from '../../src/components/AuthShell';
import { theme } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';

/** YYYY-MM-DD in local calendar (correct for `<input type="date">`). */
function toDateOnlyString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Expo Router can pass repeated keys as string[] — normalize for API / URL building. */
function paramToString(
  value: string | string[] | undefined
): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function dateFromYYYYMMDD(value: string): Date | undefined {
  const [yStr, mStr, dStr] = value.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const day = Number(dStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(day)) return undefined;
  const next = new Date(y, m - 1, day);
  return next.getFullYear() === y && next.getMonth() === m - 1 && next.getDate() === day
    ? next
    : undefined;
}

const webDateInputStyle: Record<string, string | number> = {
  flex: 1,
  width: '100%',
  padding: '14px 0',
  fontSize: 16,
  fontFamily: `${theme.fonts.regular}, system-ui, sans-serif`,
  color: theme.colors.text,
  borderWidth: 0,
  outline: 'none',
  margin: 0,
  boxSizing: 'border-box',
  backgroundColor: 'transparent',
};

export default function DetailsScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const raw = useLocalSearchParams<{
    phoneNumber: string | string[];
    firstName: string | string[];
    lastName: string | string[];
  }>();
  const phoneNumber = paramToString(raw.phoneNumber);
  const firstName = paramToString(raw.firstName);
  const lastName = paramToString(raw.lastName);

  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say'>('prefer_not_to_say');
  const [dateOfBirth, setDateOfBirth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [language, setLanguage] = useState('');
  const [occupation, setOccupation] = useState('');
  const [school, setSchool] = useState('');
  const [company, setCompany] = useState('');
  const [interests, setInterests] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDateChange = (event: { type?: string } | undefined, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate && event?.type !== 'dismissed') {
      setDateOfBirth(selectedDate);
    }
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
  };

  const calculateAge = () => {
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const validateAge = () => {
    const age = calculateAge();
    if (age < 13) {
      Alert.alert('Age Requirement', 'You must be at least 13 years old to create an account');
      return false;
    }
    return true;
  };

  const getAgeGroupFromAge = (age: number): '13-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+' => {
    if (age >= 13 && age <= 17) return '13-17';
    if (age >= 18 && age <= 24) return '18-24';
    if (age >= 25 && age <= 34) return '25-34';
    if (age >= 35 && age <= 44) return '35-44';
    if (age >= 45 && age <= 54) return '45-54';
    if (age >= 55 && age <= 64) return '55-64';
    return '65+';
  };

  const validatePasswords = () => {
    if (password.length < 8) {
      Alert.alert('Invalid Password', 'Password must be at least 8 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!phoneNumber?.trim()) {
      Alert.alert('Missing information', 'Please start sign-up again from the phone step.');
      return;
    }
    if (!firstName?.trim() || !lastName?.trim()) {
      Alert.alert('Missing information', 'Please go back and enter your name.');
      return;
    }

    if (!validateAge() || !validatePasswords()) return;

    setLoading(true);
    try {
      const fullPhoneNumber = `+91${phoneNumber.trim()}`;
      const age = calculateAge();
      const calculatedAgeGroup = getAgeGroupFromAge(age);
      
      // Parse interests from comma-separated string
      const parsedInterests = interests
        .split(',')
        .map(interest => interest.trim())
        .filter(interest => interest.length > 0);
      
      await signup({
        phoneNumber: fullPhoneNumber,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        dateOfBirth: dateOfBirth.toISOString(),
        location: location.trim() || undefined,
        language: language.trim() || undefined,
        occupation: occupation.trim() || undefined,
        school: school.trim() || undefined,
        company: company.trim() || undefined,
        interests: parsedInterests.length > 0 ? parsedInterests : undefined,
        age,
        ageGroup: calculatedAgeGroup,
      });

      Alert.alert('Success', 'Account created successfully! Redirecting...');
      setTimeout(() => {
        router.push('/auth/contacts-permission');
      }, 500);
    } catch (error) {
      let errorMessage = 'Signup failed. Please try again.';
      let errorTitle = 'Signup Failed';
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('network') || message.includes('fetch')) {
          errorTitle = 'Network Error';
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (message.includes('already exists') || message.includes('duplicate') || message.includes('409')) {
          errorTitle = 'Account Already Exists';
          errorMessage = 'An account with this phone number already exists. Try logging in instead.';
        } else if (message.includes('invalid') || message.includes('400')) {
          errorTitle = 'Invalid Information';
          errorMessage = 'Please check your information and try again. Make sure all fields are filled correctly.';
        } else if (message.includes('timeout')) {
          errorTitle = 'Request Timeout';
          errorMessage = 'The request took too long. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <ScrollView
        style={styles.flexScroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AuthShell
          title="Build Your Profile"
          subtitle="A polished profile helps trusted people find and connect with you."
        >
        <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>Gender</Text>
        <View style={styles.genderContainer}>
          {(['male', 'female', 'other', 'prefer_not_to_say'] as const).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.genderButton,
                gender === option && styles.genderButtonActive,
              ]}
              onPress={() => setGender(option)}
            >
              <Text
                style={[
                  styles.genderButtonText,
                  gender === option && styles.genderButtonTextActive,
                ]}
              >
                {option === 'prefer_not_to_say' ? 'Prefer not to say' : option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Date of Birth</Text>
        {Platform.OS === 'web' ? (
          <View style={[styles.datePickerButton, styles.webDateOuter]}>
            {createElement('input', {
              type: 'date',
              disabled: loading,
              value: toDateOnlyString(dateOfBirth),
              min: '1900-01-01',
              max: toDateOnlyString(new Date()),
              onChange: (e: { target: { value: string } }) => {
                const parsed = dateFromYYYYMMDD(e.target.value);
                if (parsed) setDateOfBirth(parsed);
              },
              style: webDateInputStyle,
            })}
            <Text style={styles.datePickerIcon}>📅</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.datePickerButton, showDatePicker && styles.datePickerButtonActive]}
              onPress={() => setShowDatePicker(true)}
              disabled={loading}
            >
              <Text style={styles.datePickerText}>
                {dateOfBirth.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Text>
              <Text style={styles.datePickerIcon}>📅</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <Text style={styles.datePickerTitle}>Select Date of Birth</Text>
                </View>
                <DateTimePicker
                  value={dateOfBirth}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  textColor={Platform.OS === 'ios' ? theme.colors.text : undefined}
                />
                {Platform.OS === 'ios' && (
                  <View style={styles.datePickerActions}>
                    <TouchableOpacity style={styles.cancelButton} onPress={closeDatePicker}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.doneButton} onPress={closeDatePicker}>
                      <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </>
        )}
        </View>

        <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>Location (Optional)</Text>
        <CustomInput
          placeholder="City, Country"
          value={location}
          onChangeText={setLocation}
          editable={!loading}
        />

        <Text style={styles.sectionLabel}>Language (Optional)</Text>
        <CustomInput
          placeholder="Preferred language"
          value={language}
          onChangeText={setLanguage}
          editable={!loading}
        />

        <Text style={styles.sectionLabel}>Occupation (Optional)</Text>
        <CustomInput
          placeholder="Your job or profession"
          value={occupation}
          onChangeText={setOccupation}
          editable={!loading}
        />

        <Text style={styles.sectionLabel}>School (Optional)</Text>
        <CustomInput
          placeholder="School or university name"
          value={school}
          onChangeText={setSchool}
          editable={!loading}
        />

        <Text style={styles.sectionLabel}>Company (Optional)</Text>
        <CustomInput
          placeholder="Company or organization"
          value={company}
          onChangeText={setCompany}
          editable={!loading}
        />

        <Text style={styles.sectionLabel}>Interests (Optional)</Text>
        <CustomInput
          placeholder="Separate interests with commas (e.g. music, sports, travel)"
          value={interests}
          onChangeText={setInterests}
          editable={!loading}
          multiline
        />
        </View>

        <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>Create Password</Text>
        <CustomInput
          placeholder="Password (min 8 characters)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        <CustomInput
          placeholder="Confirm Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!loading}
        />

        <CustomButton 
          title="Create Account" 
          onPress={handleSignup} 
          loading={loading}
          disabled={!password || !confirmPassword || loading}
          style={styles.button}
          animationType="glow"
        />
        </View>

        <Text style={styles.loginText}>
          Already have an account?{' '}
          <Text 
            style={styles.loginLink}
            onPress={() => router.push('/auth/login')}
          >
            Login here
          </Text>
        </Text>
        </AuthShell>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flexScroll: {
    flex: 1,
  },
  container: {
    paddingVertical: 24,
    paddingHorizontal: 18,
  },
  sectionCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: '#EEDFD2',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },
  sectionLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  genderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 10,
  },
  genderButton: {
    flex: 1,
    minWidth: '45%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  genderButtonText: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semiBold,
  },
  datePickerButton: {
    width: '100%',
    height: 56,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  datePickerButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF8F5',
  },
  datePickerText: {
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  datePickerIcon: {
    fontSize: 18,
    marginLeft: 10,
  },
  webDateOuter: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  button: {
    marginTop: 10,
    marginBottom: 4,
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
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  datePickerHeader: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  datePickerTitle: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: theme.colors.gray[100],
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
    fontSize: 16,
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
  },
});
