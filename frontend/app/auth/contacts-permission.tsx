import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { CustomButton } from '../../src/components/CustomButton';
import { AuthShell } from '../../src/components/AuthShell';
import { theme } from '../../src/theme';
import { UserAPI } from '../../src/services/api';
import { ContactsService } from '../../src/services/contacts';

export default function ContactsPermissionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAllowContacts = async () => {
    setLoading(true);
    try {
      const permissionGranted = await ContactsService.requestPermission();
      
      if (!permissionGranted) {
        Alert.alert('Permission Denied', 'Cannot access contacts without permission');
        handleSkip();
        return;
      }

      const deviceContacts = await ContactsService.readContacts();
      const dedupedContacts = ContactsService.deduplicateContacts(deviceContacts);
      const filteredContacts = await ContactsService.filterContactsByCountry(dedupedContacts);

      if (filteredContacts.length === 0) {
        Alert.alert('No Contacts', 'No contacts found with Indian phone numbers');
        handleSkip();
        return;
      }

      await UserAPI.uploadContacts({
        contacts: filteredContacts,
      });

      Alert.alert(
        'Success',
        `Uploaded ${filteredContacts.length} contacts! We'll help you connect with people you know.`
      );

      setTimeout(() => {
        router.replace('/');
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process contacts';
      Alert.alert('Error', errorMessage);
      handleSkip();
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/');
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <AuthShell
          title="Find Your People"
          subtitle="Allow contacts to instantly discover people you already know."
        >
          <View style={styles.benefitsContainer}>
            <View style={styles.benefit}>
              <Text style={styles.benefitEmoji}>👥</Text>
              <Text style={styles.benefitText}>Discover trusted mutuals faster</Text>
            </View>

            <View style={styles.benefit}>
              <Text style={styles.benefitEmoji}>🔐</Text>
              <Text style={styles.benefitText}>Private, secure, and encrypted matching</Text>
            </View>

            <View style={styles.benefit}>
              <Text style={styles.benefitEmoji}>⚡</Text>
              <Text style={styles.benefitText}>Build your network in one tap</Text>
            </View>
          </View>

          <View style={styles.privacyContainer}>
            <Text style={styles.privacyText}>
              We only access contacts to find existing users. Your data is never sold or shared.
            </Text>
          </View>

          <CustomButton
            title="Allow Access to Contacts"
            onPress={handleAllowContacts}
            loading={loading}
            disabled={loading}
            style={styles.button}
            animationType="glow"
          />

          <CustomButton
            title="Skip for Now"
            onPress={handleSkip}
            disabled={loading}
            style={[styles.button, styles.skipButton]}
            textStyle={styles.skipButtonText}
            animationType="scale"
          />
        </AuthShell>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 18,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#EEDFD2',
  },
  benefitEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  benefitText: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  privacyContainer: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#F6EFE8',
    borderRadius: theme.borderRadius.lg,
    marginBottom: 18,
  },
  privacyText: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  button: {
    marginBottom: 12,
  },
  skipButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2C8B5',
  },
  skipButtonText: {
    color: theme.colors.primary,
  },
});
