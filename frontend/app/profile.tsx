import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { InteractiveCard } from '../src/components/InteractiveCard';
import { useAuth } from '../src/context/AuthContext';
import { theme } from '../src/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDesktop = width >= 820;

  const sidebarX = useRef(new Animated.Value(-320)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(24)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(34)).current;
  const avatarFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(heroY, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
        }),
        Animated.spring(contentY, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarFloat, {
          toValue: -6,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(avatarFloat, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, [avatarFloat, contentOpacity, contentY, heroOpacity, heroY]);

  const profile = useMemo(() => {
    const name = `${user?.firstName || 'Guest'} ${user?.lastName || 'User'}`.trim();
    const profileFields = [
      user?.firstName,
      user?.lastName,
      user?.phoneNumber,
      user?.bio,
      user?.location,
      user?.company,
      user?.school,
      user?.interests?.length,
    ];
    const completed = profileFields.filter(Boolean).length;

    return {
      name,
      handle: `@${(user?.firstName || 'guest').toLowerCase()}`,
      phone: user?.phoneNumber || 'Not added yet',
      bio: user?.bio || 'Tell your network what you are building, learning, or looking for.',
      location: user?.location || 'Add your location',
      company: user?.company || 'Add your company',
      school: user?.school || 'Add your school',
      interests: user?.interests || [],
      hubs: user?.hubs || [],
      completeness: Math.round((completed / profileFields.length) * 100),
    };
  }, [user]);

  const toggleSidebar = () => {
    const open = !sidebarOpen;
    setSidebarOpen(open);
    Animated.spring(sidebarX, {
      toValue: open ? 0 : -320,
      friction: 8,
      tension: 90,
      useNativeDriver: true,
    }).start();
  };

  const handleLogout = async () => {
    setSidebarOpen(false);
    await logout();
    router.replace('/');
  };

  const menuItems = [
    { label: 'Home', icon: 'home-outline' as const, onPress: () => router.push('/') },
    { label: 'Network', icon: 'git-network-outline' as const, onPress: () => router.push('/graph') },
    { label: 'Profile', icon: 'person-outline' as const, onPress: toggleSidebar },
  ];

  return (
    <View style={styles.page}>
      <LinearGradient colors={theme.colors.pageGradient as any} style={StyleSheet.absoluteFillObject} />
      <View style={styles.orbOne} />
      <View style={styles.orbTwo} />

      <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarX }] }]}>
        <LinearGradient colors={['#211713', '#3E241B']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.sidebarBrand}>
          <Image source={require('../assets/images/hotake-logo.png')} style={styles.sidebarLogo} />
          <View>
            <Text style={styles.sidebarName}>{profile.name}</Text>
            <Text style={styles.sidebarHandle}>{profile.handle}</Text>
          </View>
        </View>
        <View style={styles.sidebarMenu}>
          {menuItems.map((item) => (
            <Pressable key={item.label} style={styles.sidebarItem} onPress={item.onPress}>
              <Ionicons name={item.icon} size={20} color="#FFF7F0" />
              <Text style={styles.sidebarItemText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.logoutItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FFB39A" />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </Animated.View>

      {sidebarOpen && <Pressable style={styles.overlay} onPress={toggleSidebar} />}

      <View style={styles.topBar}>
        <View style={styles.topBarInner}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleSidebar}>
            <Ionicons name="menu" size={22} color={theme.colors.ink} />
          </TouchableOpacity>
          <View style={styles.topBarTitleWrap}>
            <Text style={styles.eyebrow}>HOTake</Text>
            <Text style={styles.topBarTitle}>Profile</Text>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/graph')}>
            <Ionicons name="git-network-outline" size={22} color={theme.colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.heroWrap,
            {
              opacity: heroOpacity,
              transform: [{ translateY: heroY }],
            },
          ]}
        >
          <LinearGradient colors={theme.colors.heroGradient as any} style={styles.hero}>
            <View style={styles.heroGlow} />
            <View style={[styles.heroContent, !isDesktop && styles.heroContentMobile]}>
              <Animated.View style={[styles.avatarRing, { transform: [{ translateY: avatarFloat }] }]}>
                <View style={styles.avatarInner}>
                  <Image source={require('../assets/images/hotake-logo.png')} style={styles.avatarImage} />
                </View>
              </Animated.View>
              <View style={styles.heroText}>
                <View style={styles.heroBadge}>
                  <Ionicons name="sparkles" size={14} color="#FFD0BD" />
                  <Text style={styles.heroBadgeText}>Network builder</Text>
                </View>
                <Text style={styles.heroName}>{profile.name}</Text>
                <Text style={styles.heroHandle}>{profile.handle}</Text>
                <Text style={styles.heroBio}>{profile.bio}</Text>
                <View style={styles.heroActions}>
                  <Pressable style={styles.primaryAction}>
                    <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryActionText}>Edit profile</Text>
                  </Pressable>
                  <Pressable style={styles.secondaryAction} onPress={() => router.push('/graph')}>
                    <Ionicons name="git-network-outline" size={18} color="#FFF7F0" />
                    <Text style={styles.secondaryActionText}>View network</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentY }],
            },
          ]}
        >
          <View style={[styles.statsGrid, !isDesktop && styles.stack]}>
            <InteractiveCard style={styles.statCard}>
              <View style={styles.statCardInner}>
                <View style={[styles.statIcon, styles.statIconTeal]}>
                  <Ionicons name="people-outline" size={22} color={theme.colors.accentDark} />
                </View>
                <Text style={styles.statValue}>{profile.hubs.length}</Text>
                <Text style={styles.statLabel}>Active hubs</Text>
              </View>
            </InteractiveCard>
            <InteractiveCard style={styles.statCard}>
              <View style={styles.statCardInner}>
                <View style={[styles.statIcon, styles.statIconOrange]}>
                  <Ionicons name="checkmark-circle-outline" size={22} color={theme.colors.primaryDark} />
                </View>
                <Text style={styles.statValue}>{profile.completeness}%</Text>
                <Text style={styles.statLabel}>Profile strength</Text>
              </View>
            </InteractiveCard>
            <InteractiveCard style={styles.statCard} onPress={() => router.push('/graph')}>
              <View style={styles.statCardInner}>
                <View style={[styles.statIcon, styles.statIconDark]}>
                  <Ionicons name="git-network-outline" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.statValue}>Explore</Text>
                <Text style={styles.statLabel}>Your mutual network</Text>
              </View>
            </InteractiveCard>
          </View>

          <View style={[styles.mainGrid, !isDesktop && styles.stack]}>
            <InteractiveCard style={styles.panel}>
              <View style={styles.panelInner}>
                <View style={styles.panelHeader}>
                  <View>
                    <Text style={styles.panelEyebrow}>ABOUT YOU</Text>
                    <Text style={styles.panelTitle}>Profile overview</Text>
                  </View>
                  <View style={styles.panelHeaderIcon}>
                    <Ionicons name="person-outline" size={20} color={theme.colors.primaryDark} />
                  </View>
                </View>
                <Text style={styles.aboutText}>{profile.bio}</Text>
                <View style={styles.interestWrap}>
                  {(profile.interests.length ? profile.interests : ['Add interests']).map((interest) => (
                    <View key={interest} style={styles.interestChip}>
                      <Text style={styles.interestText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </InteractiveCard>

            <InteractiveCard style={styles.panel}>
              <View style={styles.panelInner}>
                <View style={styles.panelHeader}>
                  <View>
                    <Text style={styles.panelEyebrow}>DETAILS</Text>
                    <Text style={styles.panelTitle}>Connection context</Text>
                  </View>
                  <View style={styles.panelHeaderIcon}>
                    <Ionicons name="compass-outline" size={20} color={theme.colors.accentDark} />
                  </View>
                </View>
                <DetailRow icon="call-outline" label="Phone" value={profile.phone} />
                <DetailRow icon="location-outline" label="Location" value={profile.location} />
                <DetailRow icon="business-outline" label="Company" value={profile.company} />
                <DetailRow icon="school-outline" label="School" value={profile.school} />
              </View>
            </InteractiveCard>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={18} color={theme.colors.textSecondary} />
      </View>
      <View style={styles.detailTextWrap}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  orbOne: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(224, 91, 45, 0.08)',
  },
  orbTwo: {
    position: 'absolute',
    bottom: -140,
    left: -100,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(15, 159, 154, 0.07)',
  },
  topBar: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0E2D7',
    backgroundColor: 'rgba(255, 253, 250, 0.94)',
  },
  topBarInner: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarTitleWrap: {
    alignItems: 'center',
  },
  eyebrow: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: theme.colors.primary,
  },
  topBarTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: theme.colors.ink,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBD8CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },
  scrollContentDesktop: {
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 26,
  },
  heroWrap: {
    width: '100%',
  },
  hero: {
    minHeight: 310,
    borderRadius: 30,
    overflow: 'hidden',
    padding: 28,
  },
  heroGlow: {
    position: 'absolute',
    right: -80,
    top: -100,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(255, 200, 175, 0.16)',
  },
  heroContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 34,
  },
  heroContentMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 22,
  },
  avatarRing: {
    width: 178,
    height: 178,
    borderRadius: 89,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.34)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  avatarInner: {
    flex: 1,
    borderRadius: 81,
    backgroundColor: '#FFF7F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '78%',
    height: '78%',
    resizeMode: 'contain',
  },
  heroText: {
    flex: 1,
    maxWidth: 650,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  heroBadgeText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 12,
    color: '#FFDCCF',
  },
  heroName: {
    marginTop: 14,
    fontFamily: theme.fonts.bold,
    fontSize: 42,
    lineHeight: 46,
    color: '#FFFFFF',
  },
  heroHandle: {
    marginTop: 2,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    color: '#FFD7C6',
  },
  heroBio: {
    marginTop: 12,
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: '#FFECE3',
    maxWidth: 560,
  },
  heroActions: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  primaryAction: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryActionText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    color: theme.colors.primaryDark,
  },
  secondaryAction: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryActionText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    color: '#FFF7F0',
  },
  content: {
    marginTop: 18,
    gap: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  stack: {
    flexDirection: 'column',
  },
  statCard: {
    flex: 1,
    minHeight: 142,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEDFD2',
  },
  statCardInner: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statIconTeal: {
    backgroundColor: theme.colors.surfaceAccent,
  },
  statIconOrange: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  statIconDark: {
    backgroundColor: theme.colors.ink,
  },
  statValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 26,
    color: theme.colors.ink,
  },
  statLabel: {
    marginTop: 3,
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  mainGrid: {
    flexDirection: 'row',
    gap: 18,
  },
  panel: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEDFD2',
  },
  panelInner: {
    padding: 22,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  panelEyebrow: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: theme.colors.primary,
  },
  panelTitle: {
    marginTop: 2,
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: theme.colors.ink,
  },
  panelHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutText: {
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.textSecondary,
  },
  interestWrap: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    borderRadius: 999,
    backgroundColor: '#FFF6EF',
    borderWidth: 1,
    borderColor: '#F0DDCF',
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  interestText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 12,
    color: theme.colors.primaryDark,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4EAE2',
  },
  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FAF4EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textPlaceholder,
  },
  detailValue: {
    marginTop: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    color: theme.colors.text,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 300,
    zIndex: 100,
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  sidebarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 26,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  sidebarLogo: {
    width: 52,
    height: 52,
    resizeMode: 'contain',
  },
  sidebarName: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  sidebarHandle: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: '#D9C0B5',
  },
  sidebarMenu: {
    marginTop: 20,
    gap: 8,
  },
  sidebarItem: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  sidebarItemText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    color: '#FFF7F0',
  },
  logoutItem: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 30,
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 120, 90, 0.1)',
  },
  logoutText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    color: '#FFB39A',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    backgroundColor: 'rgba(20, 13, 10, 0.45)',
  },
});
