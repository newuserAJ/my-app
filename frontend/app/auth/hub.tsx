import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { CustomButton } from '../../src/components/CustomButton';
import { theme } from '../../src/theme';
import { Ionicons } from '@expo/vector-icons';
import { SignUpState } from '../../src/services/navigationStack';

const SAMPLE_HUBS = [
  { id: '1', name: 'Delhi University (North)' },
  { id: '2', name: 'Delhi University (South)' },
  { id: '3', name: 'Delhi Public School' },
  { id: '4', name: 'St. Stephen\'s College' },
];

interface HubScreenProps {
  onStateUpdate?: (state: Partial<SignUpState>) => void;
}

export default function HubScreen(props?: HubScreenProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedHub, setSelectedHub] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredHubs = SAMPLE_HUBS.filter(hub =>
    hub.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleContinue = () => {
    if (!selectedHub) return;

    props?.onStateUpdate?.({
      hub: selectedHub,
      currentStep: 'network',
    });

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/auth/network');
    }, 1000);
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container} scrollable={false}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/hotake-logo.png')} 
          style={styles.logo}
          resizeMode="contain" 
        />
        <Text style={styles.title}>Select your hub</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          value={search}
          onChangeText={setSearch}
        />
        <Ionicons name="search" size={24} color={theme.colors.textSecondary} style={styles.searchIcon} />
      </View>

      <View style={styles.listContainer}>
        {filteredHubs.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[
              styles.hubItem,
              selectedHub === item.id && styles.selectedHub
            ]}
            onPress={() => setSelectedHub(item.id)}
          >
            <View style={styles.hubIconContainer}>
               <Ionicons name="location" size={20} color="#666" />
            </View>
            <Text style={styles.hubName}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <CustomButton 
        title="Continue" 
        onPress={handleContinue}
        loading={loading}
        disabled={!selectedHub}
        style={styles.button}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 80,
    flex: 1,
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
  },
  searchContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 20,
  },
  searchInput: {
    height: 56,
    backgroundColor: 'rgba(235, 235, 245, 0.3)',
    borderRadius: 28,
    paddingLeft: 20,
    paddingRight: 50,
    fontSize: 24,
    fontFamily: theme.fonts.regular,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  searchIcon: {
    position: 'absolute',
    right: 20,
    top: 15,
  },
  listContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  hubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedHub: {
    backgroundColor: 'rgba(195, 81, 41, 0.05)',
  },
  hubIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  hubName: {
    fontFamily: theme.fonts.regular,
    fontSize: 18,
    color: '#000000',
  },
  button: {
    marginTop: 'auto',
    marginBottom: 20,
  },
});
