import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ImageBackground } from 'react-native';
import { theme } from '../theme';

interface NetworkButtonProps {
  title: string;
  subtitle: string;
  onPress: () => void;
  dark?: boolean;
}

export const NetworkButton: React.FC<NetworkButtonProps> = ({
  title,
  subtitle,
  onPress,
  dark = false,
}) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress} 
      style={[
        styles.container,
        dark ? styles.darkContainer : styles.lightContainer
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, dark && styles.darkText]}>{title}</Text>
        <Text style={[styles.subtitle, dark && styles.darkTextSecondary]}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 100,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lightContainer: {
    backgroundColor: '#E3F2FD', // Light blue/glassy look from image
  },
  darkContainer: {
    backgroundColor: '#1A1A1A',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 24,
    color: '#000000',
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 4,
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkTextSecondary: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
