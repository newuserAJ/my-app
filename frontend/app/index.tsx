import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Animated, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  useFonts, 
  Afacad_400Regular, 
  Afacad_600SemiBold, 
  Afacad_700Bold 
} from '@expo-google-fonts/afacad';
import { useAuth } from '../src/context/AuthContext';

export default function App() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading } = useAuth();
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  let [fontsLoaded] = useFonts({
    'Afacad-Regular': Afacad_400Regular,
    'Afacad-SemiBold': Afacad_600SemiBold,
    'Afacad-Bold': Afacad_700Bold,
  });

  useEffect(() => {
    if (!isLoading && fontsLoaded) {
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true, 
        }).start(() => {
          setIsSplashFinished(true);
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [fadeAnim, isLoading, fontsLoaded]);

  useEffect(() => {
    if (isSplashFinished && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [isSplashFinished, isLoggedIn, router]);

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleSignUp = () => {
    router.push('/auth/signup');
  };

  if (!fontsLoaded || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C35129" />
      </View>
    );
  }

  if (!isSplashFinished) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={[
          styles.splashCenter, 
          { opacity: fadeAnim }
        ]}>
          <Image 
            source={require('../assets/images/hotake-logo.png')} 
            style={styles.splashLogo}
            resizeMode="contain" 
          />
        </Animated.View>
      </View>
    );
  }

  if (isLoggedIn && user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} bounces={false}>
          <View style={styles.header}>
            <View style={styles.navGroup}>
              <Pressable onPress={() => console.log('Go Home')}>
                {({ pressed }) => (
                  <Text style={[
                    styles.navText, 
                    { color: pressed ? 'rgba(0, 0, 0, 0.5)' : 'rgb(0, 0, 0)' }
                  ]}>
                    Home
                  </Text>
                )}
              </Pressable>

              <Pressable onPress={() => router.push('/profile')}>
                {({ pressed }) => (
                  <Text style={[
                    styles.navText, 
                    { color: pressed ? 'rgba(0, 0, 0, 0.5)' : 'rgb(0, 0, 0)' }
                  ]}>
                    Profile
                  </Text>
                )}
              </Pressable>

              <Pressable onPress={() => router.push('/graph')}>
                {({ pressed }) => (
                  <Text style={[
                    styles.navText, 
                    { color: pressed ? 'rgba(0, 0, 0, 0.5)' : 'rgb(0, 0, 0)' }
                  ]}>
                    Network
                  </Text>
                )}
              </Pressable>
            </View>
            
          </View>

          <View style={styles.logoContainer}>
            <Text style={styles.welcomeText}>Welcome, {user?.firstName || 'User'}!</Text>
             <Image 
               source={require('../assets/images/hotake-logo.png')} 
               style={styles.footerLogo}
               resizeMode="contain" 
             />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center', 
  },

  splashCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 250,
    height: 250,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
  },
  navGroup: {
    flexDirection: 'row',
    gap: 15,
  },
  headerText: {
    fontFamily: 'Afacad-Bold',
    fontSize: 20,
  },
  navText: {
    fontFamily: 'Afacad-Bold',
    fontSize: 16,
  },
  headerTextActive: { color: '#000000' },

  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontFamily: 'Afacad-Bold',
    fontSize: 24,
    color: '#C35129',
    marginBottom: 20,
    textAlign: 'center',
  },
  footerLogo: {
    width: 60,
    height: 60,
  }
});