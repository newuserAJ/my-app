import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Animated, Pressable } from 'react-native';
import { 
  useFonts, 
  Afacad_400Regular, 
  Afacad_600SemiBold, 
  Afacad_700Bold 
} from '@expo-google-fonts/afacad';

// ==========================================
// MOCK DATABASE
// ==========================================
const mockPollData = {
  id: "poll_001",
  author: "from our team <3",
  question: "Most likely to survive WW3",
  imageSource: require('../assets/images/poll-ww3.jpg'), // Ensure this exists!
  options: [
    { id: "opt_1", name: "Adith Jose", mutuals: "5+ Mutuals" },
    { id: "opt_2", name: "Arul Babu", mutuals: "1 Mutual" },
    { id: "opt_3", name: "Dilengchapbou Newmai", mutuals: "2 Mutuals" },
    { id: "opt_4", name: "Sidharth Gupta", mutuals: "3 Mutuals" }
  ]
};

export default function App() {
  // 1. STATE & ANIMATION REFS
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // 2. LOAD FONTS IN THE BACKGROUND
  let [fontsLoaded] = useFonts({
    'Afacad-Regular': Afacad_400Regular,
    'Afacad-SemiBold': Afacad_600SemiBold,
    'Afacad-Bold': Afacad_700Bold,
  });

  // 3. THE SPLASH SCREEN TIMER LOGIC
  useEffect(() => {
    // Wait 2.5 seconds, then trigger the fade animation
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500, // Fades out over 0.5 seconds
        useNativeDriver: true, 
      }).start(() => {
        // Once the fade is done, switch to the main app
        setIsSplashFinished(true);
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim]);

  // A helper function for when a button is tapped
  const handleVote = (selectedName: string) => {
    console.log(`Voted for: ${selectedName}`);
  };

  // ==========================================
  // RENDER PHASE 1: LOADING SPINNER
  // ==========================================
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C35129" />
      </View>
    );
  }

  // ==========================================
  // RENDER PHASE 2: THE SPLASH SCREEN
  // ==========================================
  if (!isSplashFinished) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={[styles.splashCenter, { opacity: fadeAnim }]}>
          <Image 
            source={require('../assets/images/hotake-logo.png')} 
            style={styles.splashLogo}
            resizeMode="contain" 
          />
        </Animated.View>
      </View>
    );
  }

  // ==========================================
  // RENDER PHASE 3: THE MAIN POLLING APP
  // ==========================================
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        
        {/* HEADER WITH PRESSABLE */}
        <View style={styles.header}>
          <Pressable onPress={() => console.log('Go Home')}>
            {({ pressed }) => (
              <Text style={[
                styles.headerText, 
                { color: pressed ? 'rgba(0, 0, 0, 0.5)' : 'rgb(0, 0, 0)' } // Keeping it faded to match your design
              ]}>
                Home
              </Text>
            )}
          </Pressable>

          <Text style={[styles.headerText, styles.headerTextActive]}>Polls</Text>
          
          <View style={styles.walletContainer}>
            <Text style={styles.walletText}>156</Text>
            <Text style={styles.diamondEmoji}>💎</Text> 
          </View>
        </View>

        {/* IMAGE & QUESTION */}
        <View style={styles.pollContainer}>
          <View style={styles.imageFrame}>
            <Image 
              source={mockPollData.imageSource} 
              style={styles.pollImage} 
              resizeMode="cover" 
            />
          </View>
          <Text style={styles.authorText}>{mockPollData.author}</Text>
          <Text style={styles.questionText}>{mockPollData.question}</Text>
        </View>

        {/* 2x2 GRID */}
        <View style={styles.gridContainer}>
          {mockPollData.options.map((option) => (
            <View key={option.id} style={styles.buttonWrapper}>
              <TouchableOpacity 
                style={styles.voteButton} 
                activeOpacity={0.7}
                onPress={() => handleVote(option.name)}
              >
                <Text style={styles.voteButtonText}>{option.name}</Text>
              </TouchableOpacity>
              <View style={styles.mutualsTag}>
                <Text style={styles.mutualsText}>{option.mutuals}</Text>
                <Text style={styles.mutualsArrow}>→</Text>
              </View>
            </View>
          ))}
        </View>

        {/* FOOTER */}
        <TouchableOpacity style={styles.submitIdeaButton}>
          <Text style={styles.submitIdeaText}>Submit a Poll Idea</Text>
        </TouchableOpacity>

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

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  // Base Layout
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
    maxWidth: 480, // Keeps it phone-sized on web browsers
    alignSelf: 'center', 
  },

  // Splash Screen specific
  splashCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 250,
    height: 250,
  },
  
  // Header
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
  headerTextInactive: { color: 'rgba(0, 0, 0, 0.4)' },
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

  // Poll Section
  pollContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  imageFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
  },
  pollImage: {
    width: '100%',
    height: '100%',
  },
  authorText: {
    fontFamily: 'Afacad-Regular',
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 5,
  },
  questionText: {
    fontFamily: 'Afacad-Bold',
    fontSize: 32,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 35,
    paddingHorizontal: 10,
  },

  // Buttons Grid
  gridContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  buttonWrapper: {
    width: '48%', 
    marginBottom: 15,
  },
  voteButton: {
    backgroundColor: '#C35129',
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 15,
    minHeight: 80,
    justifyContent: 'center',
  },
  voteButtonText: {
    fontFamily: 'Afacad-SemiBold',
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  mutualsTag: {
    backgroundColor: 'rgba(60, 60, 67, 0.3)',
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 5,
  },
  mutualsText: {
    fontFamily: 'Afacad-SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  mutualsArrow: {
    color: '#FFFFFF',
    fontSize: 12,
  },

  // Footer
  submitIdeaButton: {
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    borderRadius: 1000,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 30,
    alignSelf: 'center',
  },
  submitIdeaText: {
    fontFamily: 'Afacad-SemiBold',
    fontSize: 16,
    color: 'rgba(60, 60, 67, 0.5)',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLogo: {
    width: 60,
    height: 60,
  }
});