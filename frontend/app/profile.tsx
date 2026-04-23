import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme';
import { Ionicons } from '@expo/vector-icons';

interface UserProfile {
  name: string;
  handle: string;
  phoneNumber: string;
  bio: string;
  hubs: string[];
  diamonds: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarAnimation = new Animated.Value(sidebarOpen ? 0 : -280);

  // Get user data from session/storage (mock for now)
  const userProfile: UserProfile = {
    name: 'User Name',
    handle: '@username',
    phoneNumber: '+91 00000 00000',
    bio: 'Welcome to Hotake!',
    hubs: [],
    diamonds: 0,
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    Animated.timing(sidebarAnimation, {
      toValue: !sidebarOpen ? 0 : -280,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const menuItems = [
    { id: '1', label: 'Profile', icon: 'person' as any, onPress: () => {} },
    { id: '2', label: 'My Hubs', icon: 'map' as any, onPress: () => {} },
    { id: '3', label: 'Settings', icon: 'settings' as any, onPress: () => {} },
    { id: '4', label: 'Help', icon: 'help-circle' as any, onPress: () => {} },
    { id: '5', label: 'Log Out', icon: 'log-out' as any, onPress: handleLogout },
  ];

  function handleLogout() {
    setSidebarOpen(false);
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <Animated.View 
        style={[
          styles.sidebar,
          { transform: [{ translateX: sidebarAnimation }] }
        ]}
      >
        <View style={styles.sidebarHeader}>
          <View style={styles.sidebarProfileImage}>
            <Image 
              source={require('../assets/images/hotake-logo.png')} 
              style={styles.sidebarLogo}
              resizeMode="contain" 
            />
          </View>
          <Text style={styles.sidebarName}>{userProfile.name}</Text>
          <Text style={styles.sidebarHandle}>{userProfile.handle}</Text>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <Ionicons 
                name={item.label === 'Log Out' ? 'log-out' : item.icon} 
                size={22} 
                color={item.label === 'Log Out' ? '#FF3B30' : '#000000'} 
              />
              <Text style={[
                styles.menuLabel,
                item.label === 'Log Out' && { color: '#FF3B30' }
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Overlay */}
      {sidebarOpen && (
        <TouchableOpacity 
          style={styles.overlay}
          onPress={handleToggleSidebar}
          activeOpacity={1}
        />
      )}

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Header with Hamburger */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleToggleSidebar}>
            <Ionicons name="menu" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <Image 
                source={require('../assets/images/hotake-logo.png')} 
                style={styles.profileImage}
                resizeMode="cover" 
              />
            </View>
            <Text style={styles.name}>{userProfile.name}</Text>
            <Text style={styles.handle}>{userProfile.handle}</Text>
          </View>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userProfile.diamonds}</Text>
              <Text style={styles.statLabel}>Diamonds 💎</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userProfile.hubs.length}</Text>
              <Text style={styles.statLabel}>Hubs</Text>
            </View>
          </View>

          {/* About Section */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{userProfile.bio}</Text>
          </View>

          {/* Account Details Section */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.detailText}>{userProfile.phoneNumber}</Text>
            </View>
            {userProfile.hubs.length > 0 && (
              <View style={styles.detailRow}>
                <Ionicons name="business-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.detailText}>{userProfile.hubs.join(', ')}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 280,
    height: '100%',
    backgroundColor: '#F5F5F5',
    zIndex: 1000,
    paddingTop: 60,
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
  },
  sidebarHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sidebarProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#C35129',
  },
  sidebarLogo: {
    width: '70%',
    height: '70%',
  },
  sidebarName: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#000000',
  },
  sidebarHandle: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  menuContainer: {
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#C35129',
  },
  profileImage: {
    width: '80%',
    height: '80%',
  },
  name: {
    fontFamily: theme.fonts.bold,
    fontSize: 28,
    color: '#000000',
  },
  handle: {
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 20,
    paddingVertical: 20,
    marginBottom: 30,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E5E5',
  },
  statValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    color: '#000000',
  },
  statLabel: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  infoSection: {
    width: '100%',
    marginBottom: 25,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#000000',
    marginBottom: 12,
  },
  bioText: {
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: '#444444',
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: '#444444',
    marginLeft: 12,
  },
});
