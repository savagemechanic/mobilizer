import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type OrgLevel = 'GLOBAL' | 'COUNTRY' | 'STATE' | 'LGA' | 'WARD' | 'POLLING_UNIT';

interface LocationCircle {
  id: string;
  level: OrgLevel;
  name: string;
  code?: string; // e.g. "NGA" for Nigeria
  isActive?: boolean;
  hasNewPosts?: boolean;
}

interface LocationCirclesProps {
  circles: LocationCircle[];
  onCirclePress: (circle: LocationCircle) => void;
  activeLevel?: OrgLevel;
  onInfoPress?: () => void;
}

const CIRCLE_SIZES: Record<OrgLevel, number> = {
  GLOBAL: 90,
  COUNTRY: 85,
  STATE: 80,
  LGA: 70,
  WARD: 60,
  POLLING_UNIT: 50,
};

const LEVEL_LABELS: Record<OrgLevel, string> = {
  GLOBAL: 'Global',
  COUNTRY: 'Country',
  STATE: 'State',
  LGA: 'LGA',
  WARD: 'Ward',
  POLLING_UNIT: 'Polling Unit',
};

// All levels use the same blue color
const UNIFIED_COLOR = '#007AFF';
const LEVEL_COLORS: Record<OrgLevel, string> = {
  GLOBAL: UNIFIED_COLOR,
  COUNTRY: UNIFIED_COLOR,
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
          nestedScrollEnabled={true}
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
              {/* Circle on TOP */}
              <View style={styles.circleWrapper}>
                <View
                  style={[
                    styles.circle,
                    {
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      borderColor: isActive ? color : '#E0E0E0',
                      borderWidth: isActive ? 3 : circle.hasNewPosts ? 2 : 1,
                      backgroundColor: isActive ? `${color}15` : '#F9F9F9',
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

              {/* Location name - below circle, bold, uppercase, blue when active */}
              <Text
                style={[
                  styles.nameLabel,
                  isActive && styles.nameLabelActive
                ]}
                numberOfLines={1}
              >
                {circle.name.toUpperCase()}
              </Text>

              {/* Location type - at bottom, title case, not bold, blue when active */}
              <Text
                style={[
                  styles.levelLabel,
                  isActive && styles.levelLabelActive
                ]}
                numberOfLines={1}
              >
                {LEVEL_LABELS[circle.level]}
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
    paddingVertical: 12,
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
    gap: 16,
    alignItems: 'center',
    flexGrow: 1,
    minWidth: '100%',
  },
  infoButton: {
    padding: 8,
    marginRight: 8,
  },
  circleContainer: {
    alignItems: 'center',
    width: 95,
    paddingVertical: 4,
  },
  circleWrapper: {
    height: 90,
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
  // Name label - below circle, bold, uppercase
  nameLabel: {
    fontSize: 11,
    color: '#333',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },
  nameLabelActive: {
    color: '#007AFF',
  },
  // Level label - at bottom, title case, not bold
  levelLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    fontWeight: '400',
    textAlign: 'center',
  },
  levelLabelActive: {
    color: '#007AFF',
  },
});
