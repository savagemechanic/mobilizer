import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@apollo/client';
import { GET_ORGANIZATION_AI_SUMMARY } from '@/lib/graphql/queries/ai';
import { useUIStore } from '@/store/ui';

interface AISummaryProps {
  orgId: string;
}

export default function AISummary({ orgId }: AISummaryProps) {
  const { theme } = useUIStore();
  const isDark = theme === 'dark';

  const { data, loading, error, refetch } = useQuery(GET_ORGANIZATION_AI_SUMMARY, {
    variables: { orgId },
    fetchPolicy: 'cache-and-network',
  });

  const summary = data?.organizationAISummary;

  if (loading && !summary) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.header}>
          <Ionicons name="sparkles" size={20} color="#8B5CF6" />
          <Text style={[styles.title, isDark && styles.titleDark]}>AI Insights</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#8B5CF6" />
          <Text style={[styles.loadingText, isDark && styles.textDark]}>
            Generating insights...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !summary) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.header}>
          <Ionicons name="sparkles" size={20} color="#8B5CF6" />
          <Text style={[styles.title, isDark && styles.titleDark]}>AI Insights</Text>
        </View>
        <Text style={[styles.errorText, isDark && styles.textDark]}>
          Unable to load insights
        </Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={20} color="#8B5CF6" />
          <Text style={[styles.title, isDark && styles.titleDark]}>AI Insights</Text>
        </View>
        <TouchableOpacity onPress={() => refetch()} style={styles.refreshButton}>
          <Ionicons
            name="refresh-outline"
            size={18}
            color={isDark ? '#888' : '#666'}
          />
        </TouchableOpacity>
      </View>

      <Text style={[styles.summaryText, isDark && styles.textDark]}>
        {summary.summary}
      </Text>

      {summary.suggestions && summary.suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={[styles.suggestionsTitle, isDark && styles.textDark]}>
            Post Ideas
          </Text>
          {summary.suggestions.map((suggestion: string, index: number) => (
            <View key={index} style={styles.suggestionItem}>
              <Ionicons
                name="bulb-outline"
                size={16}
                color="#FFC107"
                style={styles.suggestionIcon}
              />
              <Text style={[styles.suggestionText, isDark && styles.textDark]}>
                {suggestion}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.timestamp, isDark && styles.timestampDark]}>
        Updated {formatTimestamp(summary.generatedAt)}
      </Text>
    </View>
  );
}

function formatTimestamp(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F5FF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  containerDark: {
    backgroundColor: '#1E1B2E',
    borderColor: '#3B3360',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  titleDark: {
    color: '#A78BFA',
  },
  refreshButton: {
    padding: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  retryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  textDark: {
    color: '#E0E0E0',
  },
  suggestionsContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9D5FF',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  suggestionIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  suggestionText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 12,
    textAlign: 'right',
  },
  timestampDark: {
    color: '#666',
  },
});
