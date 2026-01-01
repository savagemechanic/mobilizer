import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type OrgLevel = 'STATE' | 'LGA' | 'WARD' | 'POLLING_UNIT';

interface LocationCircle {
  id: string;
  level: OrgLevel;
  name: string;
  isActive?: boolean;
  hasNewPosts?: boolean;
}

interface LocationCirclesProps {
  circles: LocationCircle[];
  onCirclePress: (circle: LocationCircle) => void;
  activeLevel?: OrgLevel;
  onInfoPress?: () => void;
}

const CIRCLE_SIZES = {
  STATE: 80,
  LGA: 70,
  WARD: 60,
  POLLING_UNIT: 50,
};

const LEVEL_LABELS = {
  STATE: 'State',
  LGA: 'LGA',
  WARD: 'Ward',
  POLLING_UNIT: 'PU',
};

// All levels use the same blue color
const UNIFIED_COLOR = '#007AFF';
const LEVEL_COLORS = {
  STATE: UNIFIED_COLOR,
  LGA: UNIFIED_COLOR,
  WARD: UNIFIED_COLOR,
  POLLING_UNIT: UNIFIED_COLOR,
};

export default function LocationCircles({
  circles,
  onCirclePress,
  activeLevel,
  onInfoPress,
}: LocationCirclesProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
        {circles.map((circle) => {
          const size = CIRCLE_SIZES[circle.level];
          const color = LEVEL_COLORS[circle.level];
          const isActive = activeLevel === circle.level;

          return (
            <TouchableOpacity
              key={circle.id}
              style={styles.circleContainer}
              onPress={() => onCirclePress(circle)}
            >
              <View style={styles.circleWrapper}>
                <View
                  style={[
                    styles.circle,
                    {
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      borderColor: color,
                      borderWidth: isActive ? 3 : circle.hasNewPosts ? 2 : 1,
                      backgroundColor: isActive ? `${color}20` : '#F9F9F9',
                    },
                  ]}
                >
                  <Ionicons
                    name="location"
                    size={size * 0.4}
                    color={isActive ? color : '#666'}
                  />
                  {circle.hasNewPosts && !isActive && (
                    <View
                      style={[
                        styles.newPostsBadge,
                        { backgroundColor: color },
                      ]}
                    />
                  )}
                </View>
              </View>
              <Text style={styles.levelLabel} numberOfLines={1}>
                {LEVEL_LABELS[circle.level]}
              </Text>
              <Text style={styles.nameLabel} numberOfLines={1}>
                {circle.name}
              </Text>
            </TouchableOpacity>
          );
        })}
        </ScrollView>
        {onInfoPress && (
          <TouchableOpacity
            style={styles.infoButton}
            onPress={onInfoPress}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingRight: 8,
    gap: 12,
    alignItems: 'center',
    flex: 1,
  },
  infoButton: {
    padding: 8,
    marginRight: 8,
  },
  circleContainer: {
    alignItems: 'center',
    width: 90,
  },
  circleWrapper: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  newPostsBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  levelLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    fontWeight: '600',
  },
  nameLabel: {
    fontSize: 11,
    color: '#333',
    marginTop: 2,
    textAlign: 'center',
  },
});
