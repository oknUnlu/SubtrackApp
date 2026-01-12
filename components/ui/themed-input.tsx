import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

export function ThemedInput(props: TextInputProps) {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <TextInput
      {...props}
      placeholderTextColor={Colors[colorScheme].placeholder}
      style={[styles.input, props.style, { borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    minHeight: 40,
  },
});

export default ThemedInput;
