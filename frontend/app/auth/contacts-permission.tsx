import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { CustomButton } from '../../src/components/CustomButton';
import { theme } from '../../src/theme';
import { UserAPI } from '../../src/services/api';
import { ContactsService, ContactInfo } from '../../src/services/contacts';

export default function ContactsPermissionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

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

      setContacts(filteredContacts);
      
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
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/hotake-logo.png')} 
            style={styles.logo}
            resizeMode="contain" 
          />
          <Text style={styles.title}>Connect with Friends</Text>
          <Text style={styles.subtitle}>
            We can help you find people you already know
          </Text>
        </View>

        <View style={styles.benefitsContainer}>
          <View style={styles.benefit}>
            <Text style={styles.benefitEmoji}>👥</Text>
            <Text style={styles.benefitText}>Discover people you know</Text>
          </View>

          <View style={styles.benefit}>
            <Text style={styles.benefitEmoji}>🔐</Text>
            <Text style={styles.benefitText}>Your data is secure</Text>
          </View>

          <View style={styles.benefit}>
            <Text style={styles.benefitEmoji}>🚀</Text>
            <Text style={styles.benefitText}>Build your network instantly</Text>
          </View>
        </View>

        <View style={styles.privacyContainer}>
          <Text style={styles.privacyText}>
            We only access your contacts to find matches on our platform. Your contacts are never shared or used for any other purpose.
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
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 20,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 28,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: theme.borderRadius.md,
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
    backgroundColor: '#F0F4FF',
    borderRadius: theme.borderRadius.md,
    marginBottom: 30,
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
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  skipButtonText: {
    color: theme.colors.primary,
  },
});
