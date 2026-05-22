import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Animated,
  Dimensions,
  Easing,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Animation values
  const sidebarAnimation = useRef(new Animated.Value(-280)).current;
  const fadeInValue = useRef(new Animated.Value(0)).current;
  const slideUpValue = useRef(new Animated.Value(50)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const profileImageRotate = useRef(new Animated.Value(0)).current;
  const statsAnimationValue = useRef(new Animated.Value(0)).current;
  const floatingAnimation = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  
  // Entrance animations
  useEffect(() => {
    // Main entrance animation sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeInValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
        Animated.timing(slideUpValue, {
          toValue: 0,
          duration: 800,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
      ]),
      // Profile image rotation after main animation
      Animated.timing(profileImageRotate, {
        toValue: 1,
        duration: 600,
        easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
        useNativeDriver: true,
      }),
      // Stats counter animation
      Animated.timing(statsAnimationValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: false,
      }),
    ]).start();

    // Continuous floating animation
    const floatingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnimation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.bezier(0.445, 0.05, 0.55, 0.95),
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnimation, {
          toValue: 0,
          duration: 2000,
          easing: Easing.bezier(0.445, 0.05, 0.55, 0.95),
          useNativeDriver: true,
        }),
      ])
    );
    floatingLoop.start();

    // Sparkle animation
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleOpacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleOpacity, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    sparkleLoop.start();

    return () => {
      floatingLoop.stop();
      sparkleLoop.stop();
    };
  }, []);

  // Use actual user data from context
  const userProfile = user ? {
    name: `${user.firstName || 'User'} ${user.lastName || ''}`.trim(),
    handle: `@${(user.firstName || 'user').toLowerCase()}`,
    phoneNumber: user.phoneNumber || '+91 00000 00000',
    bio: user.bio || 'Welcome to Hotake!',
    hubs: user.hubs || [],
  } : {
    name: 'Guest User',
    handle: '@guest',
    phoneNumber: '+91 00000 00000',
    bio: 'Welcome to Hotake!',
    hubs: [],
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    Animated.spring(sidebarAnimation, {
      toValue: !sidebarOpen ? 0 : -280,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleStatPress = (statType: string) => {
    // Bounce animation for stats
    const bounceAnimation = Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
    ]);
    bounceAnimation.start();
  };

  const menuItems = [
    { id: '1', label: 'Profile', icon: 'person' as any, onPress: () => {} },
    { id: '2', label: 'My Hubs', icon: 'map' as any, onPress: () => {} },
    { id: '3', label: 'Settings', icon: 'settings' as any, onPress: () => {} },
    { id: '4', label: 'Help', icon: 'help-circle' as any, onPress: () => {} },
    { id: '5', label: 'Log Out', icon: 'log-out' as any, onPress: handleLogout },
  ];

  async function handleLogout() {
    setSidebarOpen(false);
    await logout();
    router.replace('/');
  }


  const animatedHubsCount = statsAnimationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, userProfile.hubs.length],
  });

  return (
    <View style={styles.container}>
      {/* Clean White Background */}
      <View style={StyleSheet.absoluteFillObject} />
      
      {/* Floating Particles - Disabled for clean look */}
      {false && (
        <View style={styles.particlesContainer}>
          {[...Array(6)].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  left: `${15 + index * 15}%`,
                  top: `${20 + (index % 3) * 25}%`,
                  opacity: sparkleOpacity,
                  transform: [
                    {
                      translateY: floatingAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -20 - index * 3],
                      }),
                    },
                    {
                      rotate: floatingAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.particleText}>✨</Text>
            </Animated.View>
          ))}
        </View>
      )}

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
      <Animated.View 
        style={[
          styles.mainContent,
          {
            opacity: fadeInValue,
            transform: [
              { translateY: slideUpValue },
              { scale: scaleValue },
            ],
          },
        ]}
      >
        {/* Header with Hamburger */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleToggleSidebar} style={styles.menuButton}>
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: sidebarAnimation.interpolate({
                      inputRange: [-280, 0],
                      outputRange: ['0deg', '90deg'],
                    }),
                  },
                ],
              }}
            >
              <Ionicons name="menu" size={28} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          {/* Profile Section */}
          <Animated.View style={styles.profileSection}>
            <Animated.View 
              style={[
                styles.profileImageContainer,
                {
                  transform: [
                    {
                      rotate: profileImageRotate.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                    {
                      translateY: floatingAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -8],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.profileImageGradient}>
                <Image 
                  source={require('../assets/images/hotake-logo.png')} 
                  style={styles.profileImage}
                  resizeMode="cover" 
                />
              </View>
            </Animated.View>
            
            <Animated.Text 
              style={[
                styles.name,
                {
                  transform: [
                    {
                      translateY: slideUpValue.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, 20],
                      }),
                    },
                  ],
                },
              ]}
            >
              {userProfile.name}
            </Animated.Text>
            
            <Animated.Text 
              style={[
                styles.handle,
                {
                  transform: [
                    {
                      translateY: slideUpValue.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, 30],
                      }),
                    },
                  ],
                },
              ]}
            >
              {userProfile.handle}
            </Animated.Text>
          </Animated.View>

          {/* Stats Section */}
          <Animated.View style={styles.statsContainer}>
            
            <TouchableOpacity 
              style={styles.statItem} 
              onPress={() => handleStatPress('hubs')}
              activeOpacity={0.8}
            >
              <View
                style={[styles.statBackground, { backgroundColor: '#4ECDC4' }]}
              >
                <Animated.Text style={styles.statValue}>
                  {animatedHubsCount.interpolate({
                    inputRange: [0, userProfile.hubs.length || 1],
                    outputRange: [0, userProfile.hubs.length || 0],
                  }).interpolate({
                    inputRange: [0, userProfile.hubs.length || 1],
                    outputRange: ['0', String(userProfile.hubs.length || 0)],
                  })}
                </Animated.Text>
                <Text style={styles.statLabel}>Hubs</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

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
      </Animated.View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particleText: {
    fontSize: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
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
    paddingVertical: 18,
    minHeight: 50,
  },
  menuLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
    lineHeight: 22,
    flexShrink: 0,
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
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  menuButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
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
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  profileImageGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F0F0F0',
  },
  profileImage: {
    width: '85%',
    height: '85%',
    borderRadius: 60,
  },
  name: {
    fontFamily: theme.fonts.bold,
    fontSize: 28,
    color: '#000000',
    textAlign: 'center',
  },
  handle: {
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 15,
    paddingVertical: 5,
    marginBottom: 30,
    width: '100%',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statBackground: {
    width: '100%',
    paddingVertical: 20,
    alignItems: 'center',
    borderRadius: 12,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E5E5',
  },
  statValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 24,
    color: '#000000',
  },
  statLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
  },
  infoSection: {
    width: '100%',
    marginBottom: 25,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
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
    color: '#555555',
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
    color: '#555555',
    marginLeft: 12,
  },
});
