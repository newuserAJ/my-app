import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Animated, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  useFonts, 
  Afacad_400Regular, 
  Afacad_600SemiBold, 
  Afacad_700Bold 
} from '@expo-google-fonts/afacad';

export default function App() {
  const router = useRouter();
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  let [fontsLoaded] = useFonts({
    'Afacad-Regular': Afacad_400Regular,
    'Afacad-SemiBold': Afacad_600SemiBold,
    'Afacad-Bold': Afacad_700Bold,
  });

  useEffect(() => {
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
  }, [fadeAnim]);

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleSignUp = () => {
    router.push('/auth/name');
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C35129" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={[
          styles.splashCenter, 
          !isSplashFinished ? { opacity: fadeAnim } : { opacity: 1 }
        ]}>
          <Image 
            source={require('../assets/images/hotake-logo.png')} 
            style={isSplashFinished ? styles.choiceLogo : styles.splashLogo}
            resizeMode="contain" 
          />
          
          {isSplashFinished && (
            <View style={styles.authChoiceContainer}>
              <TouchableOpacity 
                style={[styles.choiceButton, styles.loginButton]} 
                onPress={handleLogin}
              >
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.choiceButton, styles.signupButton]} 
                onPress={handleSignUp}
              >
                <Text style={styles.signupButtonText}>Sign-up</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <View style={styles.header}>
          <Pressable onPress={() => console.log('Go Home')}>
            {({ pressed }) => (
              <Text style={[
                styles.headerText, 
                { color: pressed ? 'rgba(0, 0, 0, 0.5)' : 'rgb(0, 0, 0)' }
              ]}>
                Home
              </Text>
            )}
          </Pressable>

          <Text style={[styles.headerText, styles.headerTextActive]}>Polls</Text>
          
          <View style={styles.walletContainer}>
            <Text style={styles.walletText}>0</Text>
            <Text style={styles.diamondEmoji}>💎</Text> 
          </View>
        </View>

        <View style={styles.logoContainer}>
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
  choiceLogo: {
    width: 150,
    height: 150,
    marginBottom: 50,
  },
  authChoiceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    gap: 15,
  },
  choiceButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C35129',
  },
  signupButton: {
    backgroundColor: '#C35129',
    borderColor: '#C35129',
  },
  loginButtonText: {
    fontFamily: 'Afacad-Bold',
    fontSize: 18,
    color: '#C35129',
  },
  signupButtonText: {
    fontFamily: 'Afacad-Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
  },
  headerText: {
    fontFamily: 'Afacad-Bold',
    fontSize: 20,
  },
  headerTextActive: { color: '#000000' },
  walletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletText: {
    fontFamily: 'Afacad-Bold',
    fontSize: 20,
    marginRight: 4,
  },
  diamondEmoji: { fontSize: 16 },

  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLogo: {
    width: 60,
    height: 60,
  }
});