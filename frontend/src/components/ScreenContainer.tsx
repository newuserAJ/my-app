import React, { useEffect, useRef } from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  View, 
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollable?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  contentContainerStyle,
  scrollable = true,
}) => {
  const fadeValue = useRef(new Animated.Value(0)).current;
  const riseValue = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(riseValue, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeValue, riseValue]);

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <LinearGradient
        colors={theme.colors.pageGradient as any}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.glowOrbTop} />
      <View style={styles.glowOrbBottom} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {scrollable ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.container,
              contentContainerStyle,
            ]}
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={{
                opacity: fadeValue,
                transform: [{ translateY: riseValue }],
              }}
            >
              {children}
            </Animated.View>
          </ScrollView>
        ) : (
          <Animated.View
            style={[
              styles.flex,
              styles.container,
              contentContainerStyle,
              {
                opacity: fadeValue,
                transform: [{ translateY: riseValue }],
              },
            ]}
          >
            {children}
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  glowOrbTop: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 120,
    backgroundColor: 'rgba(200, 100, 50, 0.12)',
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: -80,
    left: -50,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(29, 142, 155, 0.08)',
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
});
