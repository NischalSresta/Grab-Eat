import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AlertProps {
  type: 'error' | 'success' | 'info';
  message: string;
}

export const Alert = ({ type, message }: AlertProps) => {
  const colors = {
    error: { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B' },
    success: { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46' },
    info: { bg: '#DBEAFE', border: '#93C5FD', text: '#1E40AF' },
  };

  const icons = {
    error: '⚠',
    success: '✓',
    info: 'ℹ',
  };

  const style = colors[type];

  return (
    <View style={[styles.container, { backgroundColor: style.bg, borderColor: style.border }]}>
      <Text style={[styles.icon, { color: style.text }]}>{icons[type]}</Text>
      <Text style={[styles.message, { color: style.text }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  message: {
    flex: 1,
    fontSize: 14,
  },
});
