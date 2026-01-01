import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LeaderBadgeProps {
  level?: string;
  size?: 'small' | 'medium' | 'large';
}

const LEVEL_LABELS: Record<string, string> = {
  STATE: 'State',
  LGA: 'LGA',
  WARD: 'Ward',
  POLLING_UNIT: 'PU',
};

export function LeaderBadge({ level, size = 'small' }: LeaderBadgeProps) {
  const iconSize = size === 'large' ? 14 : size === 'medium' ? 12 : 10;
  const fontSize = size === 'large' ? 12 : size === 'medium' ? 11 : 10;

  const sizeStyle = size === 'large'
    ? styles.sizeLarge
    : size === 'medium'
      ? styles.sizeMedium
      : styles.sizeSmall;

  return (
    <View style={[styles.container, sizeStyle]}>
      <Ionicons name="star" size={iconSize} color="#FFD700" />
      <Text style={[styles.text, { fontSize }]}>
        {level ? `${LEVEL_LABELS[level] || level} Leader` : 'Leader'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  sizeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  sizeMedium: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  sizeLarge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  text: {
    color: '#B8860B',
    fontWeight: '600',
  },
});
