import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
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
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
}) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

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
        <ActivityIndicator color={isOutline || isGhost ? theme.colors.primary : '#FFFFFF'} />
      ) : (
        <Text style={[
          styles.text,
          (isOutline || isGhost) && styles.outlineText,
          textStyle
        ]}>
          {title}
        </Text>
      )}
    </>
  );

  if (isPrimary && !disabled) {
    return (
      <TouchableOpacity 
        activeOpacity={0.8} 
        onPress={onPress} 
        disabled={disabled || loading}
        style={[styles.button, style]}
      >
        <LinearGradient
          colors={theme.colors.buttonGradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, styles.primaryButton]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={onPress} 
      disabled={disabled || loading}
      style={containerStyle}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  primaryButton: {
    // Gradient handles background
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
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
  },
  text: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: '#FFFFFF',
  },
  outlineText: {
    color: theme.colors.primary,
  },
  ghostText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontFamily: theme.fonts.semiBold,
  },
});
