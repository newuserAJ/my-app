import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface InteractiveCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function InteractiveCard({
  children,
  onPress,
  style,
  disabled = false,
}: InteractiveCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(0)).current;

  const animate = (pressed: boolean) => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: pressed ? 0.985 : 1,
        friction: 7,
        tension: 180,
        useNativeDriver: true,
      }),
      Animated.spring(lift, {
        toValue: pressed ? 2 : 0,
        friction: 7,
        tension: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        style,
        {
          transform: [{ translateY: lift }, { scale }],
        },
      ]}
    >
      <Pressable
        disabled={disabled || !onPress}
        onPress={onPress}
        onPressIn={() => animate(true)}
        onPressOut={() => animate(false)}
        style={styles.pressable}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  pressable: {
    flex: 1,
    width: '100%',
  },
});
