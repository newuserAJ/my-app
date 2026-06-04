import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TextInputProps,
  ViewStyle,
  Animated,
} from 'react-native';
import { theme } from '../theme';

interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View
        style={[
          styles.inputShell,
          isFocused && styles.inputShellFocused,
          error && styles.inputShellError,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            error ? styles.inputError : null,
            style,
          ]}
          placeholderTextColor={theme.colors.textPlaceholder}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </Animated.View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  label: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    marginLeft: 4,
  },
  inputShell: {
    borderWidth: 1.5,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.inputBackground,
  },
  inputShellFocused: {
    borderColor: theme.colors.inputFocus,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 2,
  },
  inputShellError: {
    borderColor: theme.colors.error,
  },
  input: {
    height: 56,
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    fontFamily: theme.fonts.regular,
    fontSize: 17,
    color: theme.colors.text,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
});
