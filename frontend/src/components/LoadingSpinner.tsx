import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'spinner' | 'pulse' | 'dots' | 'gradient' | 'orbit';
  color?: string;
  text?: string;
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  variant = 'spinner',
  color = theme.colors.primary,
  text,
  style,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0.8)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const orbitValue = useRef(new Animated.Value(0)).current;

  const getSizeValues = () => {
    switch (size) {
      case 'small':
        return { size: 24, dotSize: 6, fontSize: 12 };
      case 'large':
        return { size: 64, dotSize: 12, fontSize: 16 };
      case 'medium':
      default:
        return { size: 40, dotSize: 8, fontSize: 14 };
    }
  };

  const { size: spinnerSize, dotSize, fontSize } = getSizeValues();

  useEffect(() => {
    let animation: Animated.CompositeAnimation;

    switch (variant) {
      case 'spinner':
        animation = Animated.loop(
          Animated.timing(spinValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        );
        break;
      case 'pulse':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseValue, {
              toValue: 1.2,
              duration: 600,
              easing: Easing.bezier(0.4, 0, 0.6, 1),
              useNativeDriver: true,
            }),
            Animated.timing(pulseValue, {
              toValue: 0.8,
              duration: 600,
              easing: Easing.bezier(0.4, 0, 0.6, 1),
              useNativeDriver: true,
            }),
          ])
        );
        break;
      case 'dots':
        animation = Animated.loop(
          Animated.stagger(200, [
            Animated.sequence([
              Animated.timing(dot1, {
                toValue: 1,
                duration: 400,
                easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
                useNativeDriver: true,
              }),
              Animated.timing(dot1, {
                toValue: 0.5,
                duration: 400,
                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(dot2, {
                toValue: 1,
                duration: 400,
                easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
                useNativeDriver: true,
              }),
              Animated.timing(dot2, {
                toValue: 0.5,
                duration: 400,
                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(dot3, {
                toValue: 1,
                duration: 400,
                easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
                useNativeDriver: true,
              }),
              Animated.timing(dot3, {
                toValue: 0.5,
                duration: 400,
                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                useNativeDriver: true,
              }),
            ]),
          ])
        );
        break;
      case 'gradient':
        animation = Animated.loop(
          Animated.timing(spinValue, {
            toValue: 1,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        );
        break;
      case 'orbit':
        animation = Animated.loop(
          Animated.timing(orbitValue, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        );
        break;
    }

    // Set initial values for dots
    if (variant === 'dots') {
      dot1.setValue(0.5);
      dot2.setValue(0.5);
      dot3.setValue(0.5);
    }

    animation.start();

    return () => {
      animation.stop();
    };
  }, [variant]);

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <Animated.View
            style={[
              styles.spinner,
              {
                width: spinnerSize,
                height: spinnerSize,
                borderColor: `${color}20`,
                borderTopColor: color,
                transform: [
                  {
                    rotate: spinValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          />
        );

      case 'pulse':
        return (
          <Animated.View
            style={[
              styles.pulseCircle,
              {
                width: spinnerSize,
                height: spinnerSize,
                backgroundColor: color,
                borderRadius: spinnerSize / 2,
                transform: [{ scale: pulseValue }],
              },
            ]}
          />
        );

      case 'dots':
        return (
          <View style={styles.dotsContainer}>
            {[dot1, dot2, dot3].map((dotAnim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: dotSize,
                    height: dotSize,
                    backgroundColor: color,
                    borderRadius: dotSize / 2,
                    transform: [{ scale: dotAnim }],
                  },
                ]}
              />
            ))}
          </View>
        );

      case 'gradient':
        return (
          <Animated.View
            style={[
              {
                width: spinnerSize,
                height: spinnerSize,
                transform: [
                  {
                    rotate: spinValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['#FF6B6B', '#4ECDC4', '#45B7D1', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.gradientSpinner,
                {
                  width: spinnerSize,
                  height: spinnerSize,
                  borderRadius: spinnerSize / 2,
                },
              ]}
            />
          </Animated.View>
        );

      case 'orbit':
        return (
          <View style={[styles.orbitContainer, { width: spinnerSize, height: spinnerSize }]}>
            <Animated.View
              style={[
                styles.orbitDot,
                {
                  width: dotSize,
                  height: dotSize,
                  backgroundColor: color,
                  borderRadius: dotSize / 2,
                  transform: [
                    {
                      rotate: orbitValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                    { translateX: spinnerSize / 2 - dotSize / 2 },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.orbitDot,
                {
                  width: dotSize * 0.7,
                  height: dotSize * 0.7,
                  backgroundColor: `${color}80`,
                  borderRadius: (dotSize * 0.7) / 2,
                  transform: [
                    {
                      rotate: orbitValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['180deg', '540deg'],
                      }),
                    },
                    { translateX: (spinnerSize / 2 - (dotSize * 0.7) / 2) * 0.6 },
                  ],
                },
              ]}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {renderSpinner()}
      {text && (
        <Text style={[styles.text, { fontSize, color }]}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    borderWidth: 3,
    borderRadius: 50,
  },
  pulseCircle: {
    // Styles applied inline
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    marginHorizontal: 2,
  },
  gradientSpinner: {
    // Styles applied inline
  },
  orbitContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  orbitDot: {
    position: 'absolute',
  },
  text: {
    fontFamily: theme.fonts.medium,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});