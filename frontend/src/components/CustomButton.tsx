import React, { useRef, useEffect } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  style?: ViewStyle;
  textStyle?: TextStyle;
  animationType?: 'bounce' | 'pulse' | 'scale' | 'glow';
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  animationType = 'scale',
}) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  // Animation values
  const scaleValue = useRef(new Animated.Value(1)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const bounceValue = useRef(new Animated.Value(1)).current;
  const shimmerTranslateX = useRef(new Animated.Value(-100)).current;

  // Continuous glow animation for primary buttons
  useEffect(() => {
    if (isPrimary && !disabled && animationType === 'glow') {
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.8,
            duration: 1500,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: false,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.3,
            duration: 1500,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: false,
          }),
        ])
      );
      glowAnimation.start();
      return () => glowAnimation.stop();
    }
  }, [isPrimary, disabled, animationType]);

  // Continuous pulse animation
  useEffect(() => {
    if (animationType === 'pulse' && !disabled) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [animationType, disabled]);

  // Shimmer effect for loading
  useEffect(() => {
    if (loading) {
      const shimmerAnimation = Animated.loop(
        Animated.timing(shimmerTranslateX, {
          toValue: 100,
          duration: 1500,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        })
      );
      shimmerAnimation.start();
      return () => {
        shimmerAnimation.stop();
        shimmerTranslateX.setValue(-100);
      };
    }
  }, [loading]);

  const handlePress = () => {
    if (disabled || loading) return;

    switch (animationType) {
      case 'bounce':
        Animated.sequence([
          Animated.timing(bounceValue, {
            toValue: 0.95,
            duration: 100,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
          Animated.spring(bounceValue, {
            toValue: 1,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
          }),
        ]).start();
        break;
      case 'scale':
      default:
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 0.96,
            duration: 100,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 100,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
        ]).start();
        break;
    }

    setTimeout(onPress, 50);
  };

  const getAnimatedStyle = () => {
    const baseTransform = [];
    
    switch (animationType) {
      case 'bounce':
        baseTransform.push({ scale: bounceValue });
        break;
      case 'pulse':
        baseTransform.push({ scale: pulseValue });
        break;
      case 'scale':
      default:
        baseTransform.push({ scale: scaleValue });
        break;
    }

    return {
      transform: baseTransform,
    };
  };

  const containerStyle = [
    styles.button,
    isOutline && styles.outlineButton,
    isGhost && styles.ghostButton,
    disabled && styles.disabledButton,
    style,
  ];

  const content = (
    <>
      {loading ? (
        <Animated.View style={styles.loadingContainer}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslateX }],
              },
            ]}
          />
          <ActivityIndicator color={isOutline || isGhost ? theme.colors.primary : '#FFFFFF'} />
          <Text style={[
            styles.loadingText,
            (isOutline || isGhost) && styles.outlineText,
          ]}>
            Loading...
          </Text>
        </Animated.View>
      ) : (
        <Animated.Text style={[
          styles.text,
          (isOutline || isGhost) && styles.outlineText,
          textStyle,
          {
            transform: [
              {
                scale: animationType === 'pulse' ? pulseValue.interpolate({
                  inputRange: [1, 1.05],
                  outputRange: [1, 1.02],
                }) : 1
              }
            ]
          }
        ]}>
          {title}
        </Animated.Text>
      )}
    </>
  );

  if (isPrimary && !disabled) {
    return (
      <Animated.View style={getAnimatedStyle()}>
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={handlePress} 
          disabled={disabled || loading}
          style={[styles.button, style]}
        >
          <LinearGradient
            colors={theme.colors.buttonGradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.button, styles.primaryButton]}
          >
            {/* Glow effect overlay */}
            {animationType === 'glow' && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.glowOverlay,
                  {
                    opacity: glowOpacity,
                  },
                ]}
              />
            )}
            {content}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={getAnimatedStyle()}>
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={handlePress} 
        disabled={disabled || loading}
        style={containerStyle}
      >
        {content}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  primaryButton: {
    position: 'relative',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  ghostButton: {
    backgroundColor: 'transparent',
    height: 'auto',
    paddingVertical: theme.spacing.sm,
  },
  disabledButton: {
    backgroundColor: theme.colors.gray[300],
    borderColor: theme.colors.gray[300],
    opacity: 0.6,
  },
  text: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    flexShrink: 0,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  ghostText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontFamily: theme.fonts.semiBold,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  loadingText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: '30%',
  },
  glowOverlay: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: theme.borderRadius.lg + 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    ...Platform.select({
      android: {
        elevation: 20,
      },
    }),
  },
});
