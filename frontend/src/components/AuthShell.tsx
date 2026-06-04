import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentStyle?: ViewStyle;
}

export function AuthShell({ title, subtitle, children, footer, contentStyle }: AuthShellProps) {
  const fadeValue = useRef(new Animated.Value(0)).current;
  const slideValue = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(slideValue, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeValue, slideValue]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeValue,
          transform: [{ translateY: slideValue }],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.88)']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.brandWrap}>
        <Image
          source={require('../../assets/images/hotake-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={[styles.content, contentStyle]}>{children}</View>
      {footer}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    borderColor: '#EBDACB',
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.88)',
    shadowColor: '#AA6A45',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  brandWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFF3E9',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0DCC7',
    marginBottom: 14,
  },
  logo: {
    width: 44,
    height: 44,
  },
  title: {
    textAlign: 'center',
    color: '#251A14',
    fontFamily: theme.fonts.bold,
    fontSize: 32,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 18,
    textAlign: 'center',
    color: '#5E4D41',
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  content: {
    width: '100%',
  },
});
