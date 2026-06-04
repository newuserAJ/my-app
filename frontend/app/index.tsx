import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { InteractiveCard } from '../src/components/InteractiveCard';
import { useAuth } from '../src/context/AuthContext';
import { theme } from '../src/theme';

export default function App() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, isLoggedIn, isLoading } = useAuth();
  const isDesktop = width >= 820;
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const introOpacity = useRef(new Animated.Value(0)).current;
  const introY = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }).start(() => setIsSplashFinished(true));
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isLoading, splashOpacity]);

  useEffect(() => {
    if (isSplashFinished && !isLoggedIn) router.replace('/auth/login');
  }, [isSplashFinished, isLoggedIn, router]);

  useEffect(() => {
    if (isSplashFinished && isLoggedIn) {
      Animated.parallel([
        Animated.timing(introOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(introY, { toValue: 0, friction: 8, tension: 65, useNativeDriver: true }),
      ]).start();
    }
  }, [introOpacity, introY, isLoggedIn, isSplashFinished]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!isSplashFinished) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={[styles.splashCenter, { opacity: splashOpacity }]}>
          <Image source={require('../assets/images/hotake-logo.png')} style={styles.splashLogo} resizeMode="contain" />
          <Text style={styles.splashText}>Connections with context.</Text>
        </Animated.View>
      </View>
    );
  }

  if (!isLoggedIn || !user) return null;

  return (
    <SafeAreaView style={styles.page}>
      <LinearGradient colors={theme.colors.pageGradient as any} style={StyleSheet.absoluteFillObject} />
      <View style={styles.orbOne} />
      <View style={styles.orbTwo} />
      <ScrollView
        contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: introOpacity, transform: [{ translateY: introY }] }}>
          <View style={styles.header}>
            <View style={styles.brand}>
              <Image source={require('../assets/images/hotake-logo.png')} style={styles.brandLogo} resizeMode="contain" />
              <View>
                <Text style={styles.brandEyebrow}>HOTake</Text>
                <Text style={styles.brandText}>Mutuals Network</Text>
              </View>
            </View>
            <View style={styles.nav}>
              <NavButton label="Network" icon="git-network-outline" onPress={() => router.push('/graph')} />
              <NavButton label="Profile" icon="person-outline" onPress={() => router.push('/profile')} />
            </View>
          </View>

          <LinearGradient colors={theme.colors.heroGradient as any} style={[styles.hero, !isDesktop && styles.heroMobile]}>
            <View style={styles.heroGlow} />
            <View style={styles.heroCopy}>
              <View style={styles.heroBadge}>
                <Ionicons name="sparkles-outline" size={15} color="#FFD8C8" />
                <Text style={styles.heroBadgeText}>Your relationship layer</Text>
              </View>
              <Text style={styles.heroTitle}>Welcome back, {user.firstName || 'there'}.</Text>
              <Text style={styles.heroSubtitle}>
                Discover who connects you, understand the strength of your network, and find warmer paths to new people.
              </Text>
              <View style={[styles.heroActions, !isDesktop && styles.heroActionsMobile]}>
                <Pressable style={styles.primaryAction} onPress={() => router.push('/graph')}>
                  <Text style={styles.primaryActionText}>Explore your network</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </Pressable>
                <Pressable style={styles.secondaryAction} onPress={() => router.push('/profile')}>
                  <Text style={styles.secondaryActionText}>View profile</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.heroVisual}>
              <View style={styles.networkRing}>
                <View style={styles.networkRingInner}>
                  <Image source={require('../assets/images/hotake-logo.png')} style={styles.heroLogo} resizeMode="contain" />
                </View>
                <View style={[styles.miniNode, styles.nodeOne]} />
                <View style={[styles.miniNode, styles.nodeTwo]} />
                <View style={[styles.miniNode, styles.nodeThree]} />
              </View>
            </View>
          </LinearGradient>

          <View style={[styles.quickGrid, !isDesktop && styles.stack]}>
            <FeatureCard
              icon="git-network-outline"
              title="Visual network"
              description="See direct relationships, mutuals, and the paths connecting your community."
              accent={theme.colors.primary}
              onPress={() => router.push('/graph')}
            />
            <FeatureCard
              icon="sparkles-outline"
              title="Smart suggestions"
              description="Find people worth meeting through shared connections and stronger context."
              accent={theme.colors.accent}
              onPress={() => router.push('/graph')}
            />
            <FeatureCard
              icon="person-circle-outline"
              title="Your identity"
              description="Keep your profile clear and useful so your network understands who you are."
              accent="#4C8EBF"
              onPress={() => router.push('/profile')}
            />
          </View>

          <View style={[styles.bottomGrid, !isDesktop && styles.stack]}>
            <View style={styles.focusPanel}>
              <Text style={styles.eyebrow}>TODAY&apos;S FOCUS</Text>
              <Text style={styles.panelTitle}>Grow with intention, not noise.</Text>
              <Text style={styles.panelText}>
                A useful network is not just large. It helps you understand where trust already exists and where a thoughtful introduction can begin.
              </Text>
              <Pressable style={styles.textAction} onPress={() => router.push('/graph')}>
                <Text style={styles.textActionLabel}>Find warm introductions</Text>
                <Ionicons name="arrow-forward" size={17} color={theme.colors.primary} />
              </Pressable>
            </View>
            <LinearGradient colors={theme.colors.tealGradient as any} style={styles.quotePanel}>
              <Ionicons name="people-outline" size={28} color="#C8FFFA" />
              <Text style={styles.quoteText}>Your next meaningful connection may already be one mutual away.</Text>
              <Text style={styles.quoteLabel}>HOTake network insight</Text>
            </LinearGradient>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function NavButton({ label, icon, onPress }: { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.navButton, pressed && styles.pressed]} onPress={onPress}>
      <Ionicons name={icon} size={17} color={theme.colors.text} />
      <Text style={styles.navButtonText}>{label}</Text>
    </Pressable>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  accent,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  accent: string;
  onPress: () => void;
}) {
  return (
    <InteractiveCard style={styles.featureCard} onPress={onPress}>
      <View style={styles.featureInner}>
        <View style={[styles.featureIcon, { backgroundColor: `${accent}15` }]}>
          <Ionicons name={icon} size={23} color={accent} />
        </View>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
        <View style={styles.featureLink}>
          <Text style={[styles.featureLinkText, { color: accent }]}>Open</Text>
          <Ionicons name="arrow-up-outline" size={16} color={accent} style={styles.diagonalArrow} />
        </View>
      </View>
    </InteractiveCard>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  splashCenter: { alignItems: 'center' },
  splashLogo: { width: 190, height: 190 },
  splashText: { marginTop: -24, fontFamily: theme.fonts.semiBold, fontSize: 15, color: theme.colors.textSecondary, letterSpacing: 0.5 },
  page: { flex: 1, backgroundColor: theme.colors.background },
  orbOne: { position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: 'rgba(255,122,69,0.09)', top: -120, right: -90 },
  orbTwo: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(15,159,154,0.07)', bottom: 10, left: -100 },
  container: { flexGrow: 1, width: '100%', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 42 },
  containerDesktop: { maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLogo: { width: 42, height: 42 },
  brandEyebrow: { fontFamily: theme.fonts.bold, fontSize: 11, letterSpacing: 1.5, color: theme.colors.primary },
  brandText: { fontFamily: theme.fonts.bold, fontSize: 18, color: theme.colors.ink },
  nav: { flexDirection: 'row', gap: 8 },
  navButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: '#F0DED1' },
  navButtonText: { fontFamily: theme.fonts.semiBold, fontSize: 14, color: theme.colors.text },
  pressed: { opacity: 0.72 },
  hero: { minHeight: 410, borderRadius: 34, padding: 42, flexDirection: 'row', overflow: 'hidden', alignItems: 'center' },
  heroMobile: { minHeight: 0, padding: 24, borderRadius: 28, flexDirection: 'column', alignItems: 'stretch' },
  heroGlow: { position: 'absolute', width: 360, height: 360, borderRadius: 180, backgroundColor: 'rgba(255,255,255,0.08)', right: -90, top: -140 },
  heroCopy: { flex: 1, zIndex: 1 },
  heroBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.11)', marginBottom: 20 },
  heroBadgeText: { fontFamily: theme.fonts.semiBold, fontSize: 13, color: '#FFD8C8' },
  heroTitle: { maxWidth: 560, fontFamily: theme.fonts.bold, fontSize: 48, lineHeight: 49, color: '#FFFFFF' },
  heroSubtitle: { maxWidth: 560, marginTop: 16, fontFamily: theme.fonts.regular, fontSize: 18, lineHeight: 26, color: 'rgba(255,255,255,0.78)' },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 28 },
  heroActionsMobile: { flexDirection: 'column' },
  primaryAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 999, backgroundColor: theme.colors.primary },
  primaryActionText: { fontFamily: theme.fonts.bold, fontSize: 15, color: '#FFFFFF' },
  secondaryAction: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 13, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.11)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  secondaryActionText: { fontFamily: theme.fonts.bold, fontSize: 15, color: '#FFFFFF' },
  heroVisual: { width: 300, height: 270, alignItems: 'center', justifyContent: 'center' },
  networkRing: { width: 220, height: 220, borderRadius: 110, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  networkRingInner: { width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', borderWidth: 8, borderColor: 'rgba(255,255,255,0.12)' },
  heroLogo: { width: 96, height: 96 },
  miniNode: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: '#7FE1DA', borderWidth: 4, borderColor: '#FFFFFF' },
  nodeOne: { top: 13, right: 32 },
  nodeTwo: { bottom: 18, left: 24 },
  nodeThree: { top: 79, left: -10, backgroundColor: '#FF9A70' },
  quickGrid: { flexDirection: 'row', gap: 16, marginTop: 18 },
  stack: { flexDirection: 'column' },
  featureCard: { flex: 1, minWidth: 0, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0DED1' },
  featureInner: { padding: 22 },
  featureIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  featureTitle: { fontFamily: theme.fonts.bold, fontSize: 20, color: theme.colors.ink },
  featureDescription: { fontFamily: theme.fonts.regular, fontSize: 15, lineHeight: 21, color: theme.colors.textSecondary, marginTop: 7 },
  featureLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 18 },
  featureLinkText: { fontFamily: theme.fonts.bold, fontSize: 14 },
  diagonalArrow: { transform: [{ rotate: '45deg' }] },
  bottomGrid: { flexDirection: 'row', gap: 16, marginTop: 18 },
  focusPanel: { flex: 1.25, padding: 26, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: '#F0DED1' },
  eyebrow: { fontFamily: theme.fonts.bold, fontSize: 11, letterSpacing: 1.5, color: theme.colors.primary },
  panelTitle: { fontFamily: theme.fonts.bold, fontSize: 27, color: theme.colors.ink, marginTop: 7 },
  panelText: { maxWidth: 620, fontFamily: theme.fonts.regular, fontSize: 16, lineHeight: 23, color: theme.colors.textSecondary, marginTop: 10 },
  textAction: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 20 },
  textActionLabel: { fontFamily: theme.fonts.bold, fontSize: 15, color: theme.colors.primary },
  quotePanel: { flex: 0.75, padding: 26, borderRadius: 26, justifyContent: 'space-between', minHeight: 210 },
  quoteText: { fontFamily: theme.fonts.bold, fontSize: 22, lineHeight: 27, color: '#FFFFFF', marginVertical: 22 },
  quoteLabel: { fontFamily: theme.fonts.semiBold, fontSize: 13, color: 'rgba(255,255,255,0.68)' },
});
