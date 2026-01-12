import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Pressable, PressableProps, StyleSheet, Text, ViewStyle } from 'react-native';

type Props = PressableProps & { children: React.ReactNode; style?: ViewStyle | ViewStyle[] };

export function ThemedButton({ children, style, disabled, ...rest }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;
  const bgDisabled = Colors[colorScheme].border;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: disabled ? bgDisabled : tint },
        pressed && !disabled ? styles.pressed : null,
        style,
      ]}
      {...rest}
    >
      <Text style={[styles.text, { color: Colors[colorScheme].background, opacity: disabled ? 0.7 : 1 }]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  text: {
    fontWeight: '600',
  },
});

export default ThemedButton;
