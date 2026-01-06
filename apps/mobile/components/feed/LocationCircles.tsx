import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
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
  onLocationInfoPress?: (circle: LocationCircle) => void;
  activeLevel?: OrgLevel;
  orgLogo?: string; // The selected organization's logo
  hideInfoIcon?: boolean; // Hide the info icon badge (for "All Organizations" view)
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
  onLocationInfoPress,
  activeLevel,
  orgLogo,
  hideInfoIcon,
}: LocationCirclesProps) {
  const handleCirclePress = (circle: LocationCircle) => {
    const isActive = activeLevel === circle.level;

    if (isActive && onLocationInfoPress && !hideInfoIcon) {
      // Already active - show location info (only if info icon is shown)
      onLocationInfoPress(circle);
    } else {
      // Not active - toggle/select this location
      // Or if already active but info icon is hidden, toggle it off
      onCirclePress(circle);
    }
  };

  return (
    <View style={styles.container}>
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
              onPress={() => handleCirclePress(circle)}
            >
              {/* Circle */}
              <View style={styles.circleWrapper}>
                <View
                  style={[
                    styles.circle,
                    {
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      borderColor: isActive ? color : '#E0E0E0',
                      borderWidth: isActive ? 5 : circle.hasNewPosts ? 2 : 1,
                      backgroundColor: isActive ? `${color}20` : '#F9F9F9',
                      overflow: 'visible',
                    },
                  ]}
                >
                  {orgLogo ? (
                    <Image
                      source={{ uri: orgLogo }}
                      style={{
                        width: size - 12,
                        height: size - 12,
                        borderRadius: (size - 12) / 2,
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons
                      name="location"
                      size={size * 0.4}
                      color={isActive ? color : '#666'}
                    />
                  )}

                  {/* Info icon badge - attached to top-right of circle (hidden in "All Organizations" view) */}
                  {isActive && !hideInfoIcon && (
                    <View style={styles.infoIconBadge}>
                      <Ionicons
                        name="information-circle"
                        size={30}
                        color={color}
                      />
                    </View>
                  )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'flex-start',
  },
  circleContainer: {
    alignItems: 'center',
    width: 80,
  },
  circleWrapper: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIconBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 0,
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
  // Name label - below circle, uppercase, bold only when active
  nameLabel: {
    fontSize: 13,
    color: '#333',
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 6,
  },
  nameLabelActive: {
    color: '#007AFF',
    fontWeight: '700',
  },
  // Level label - at bottom, title case, NOT bold even when active
  levelLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontWeight: '400',
    textAlign: 'center',
  },
  levelLabelActive: {
    color: '#007AFF',
    // Keep fontWeight: '400' - don't bold the location type
  },
});
