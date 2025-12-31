import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/ui';
import { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';

const { width: screenWidth } = Dimensions.get('window');
const IMAGE_WIDTH = screenWidth - 32; // Account for padding

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onPress?: (postId: string) => void;
  onVote?: (postId: string, pollId: string, optionId: string) => void;
  onAuthorPress?: (authorId: string) => void;
}

export function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  onPress,
  onVote,
  onAuthorPress,
}: PostCardProps) {
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Format timestamp
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  // Get author display name
  const authorName = post.author?.displayName ||
    `${post.author?.firstName} ${post.author?.lastName}`.trim() ||
    'Anonymous';

  // Handle author press
  const handleAuthorPress = () => {
    if (post.author?.id) {
      if (onAuthorPress) {
        onAuthorPress(post.author.id);
      } else {
        router.push(`/user/${post.author.id}`);
      }
    }
  };

  // Handle like press
  const handleLike = () => {
    onLike?.(post.id);
  };

  // Handle comment press
  const handleComment = () => {
    onComment?.(post.id);
  };

  // Handle share press
  const handleShare = () => {
    onShare?.(post.id);
  };

  // Handle post press
  const handlePress = () => {
    onPress?.(post.id);
  };

  // Handle vote
  const handleVote = (optionId: string) => {
    if (post.poll) {
      onVote?.(post.id, post.poll.id, optionId);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.95}
    >
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleAuthorPress}
        activeOpacity={0.7}
      >
        <Avatar uri={post.author?.avatar} name={authorName} size={44} />
        <View style={styles.headerInfo}>
          <Text style={styles.authorName}>{authorName}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.timestamp}>{timeAgo}</Text>
            {post.organization && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.orgName}>{post.organization.name}</Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Content */}
      {post.content && (
        <Text style={styles.content} numberOfLines={10}>
          {post.content}
        </Text>
      )}

      {/* Media */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <View style={styles.mediaContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / IMAGE_WIDTH
              );
              setSelectedImageIndex(index);
            }}
          >
            {post.mediaUrls.map((url, index) => (
              <Image
                key={index}
                source={{ uri: url }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Media indicator */}
          {post.mediaUrls.length > 1 && (
            <View style={styles.mediaIndicator}>
              {post.mediaUrls.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === selectedImageIndex && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Poll */}
      {post.poll && (
        <View style={styles.pollContainer}>
          <Text style={styles.pollQuestion}>{post.poll.question}</Text>
          {post.poll.options?.map((option) => {
            const totalVotes = post.poll!.options?.reduce(
              (sum, opt) => sum + opt.voteCount,
              0
            ) || 1;
            const percentage = (option.voteCount / totalVotes) * 100;

            // Check if user has voted and if this is a single-vote poll
            const hasVoted = post.poll!.hasVoted;
            const isUserVote = post.poll!.userVotedOptionId === option.id;
            const isSingleVotePoll = !post.poll!.allowMultipleVotes;
            const isPollEnded = post.poll!.endsAt && new Date(post.poll!.endsAt) < new Date();
            const isDisabled = isPollEnded || (isSingleVotePoll && hasVoted);

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.pollOption,
                  isUserVote && styles.pollOptionVoted,
                  isDisabled && styles.pollOptionDisabled,
                ]}
                onPress={() => !isDisabled && handleVote(option.id)}
                activeOpacity={isDisabled ? 1 : 0.7}
                disabled={isDisabled}
              >
                <View style={styles.pollOptionContent}>
                  <View style={styles.pollOptionTextContainer}>
                    {isUserVote && (
                      <Ionicons name="checkmark-circle" size={16} color="#007AFF" style={styles.pollCheckIcon} />
                    )}
                    <Text style={[styles.pollOptionText, isUserVote && styles.pollOptionTextVoted]}>
                      {option.text}
                    </Text>
                  </View>
                  <Text style={styles.pollVoteCount}>
                    {option.voteCount} ({percentage.toFixed(0)}%)
                  </Text>
                </View>
                <View
                  style={[
                    styles.pollProgress,
                    { width: `${percentage}%` },
                    isUserVote && styles.pollProgressVoted,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
          {post.poll.hasVoted && (
            <Text style={styles.pollVotedIndicator}>
              You have voted in this poll
            </Text>
          )}
          {post.poll.endsAt && (
            <Text style={styles.pollEndsAt}>
              {new Date(post.poll.endsAt) < new Date()
                ? 'Poll ended'
                : `Ends ${formatDistanceToNow(new Date(post.poll.endsAt), { addSuffix: true })}`}
            </Text>
          )}
        </View>
      )}

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
        </Text>
        <Text style={styles.statsText}>
          {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
        </Text>
        <Text style={styles.statsText}>
          {post.shareCount} {post.shareCount === 1 ? 'share' : 'shares'}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLike}
          activeOpacity={0.7}
        >
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={post.isLiked ? '#FF3B30' : '#333'}
          />
          <Text style={[styles.actionText, post.isLiked && styles.actionTextLiked]}>
            Like
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleComment}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#333" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={24} color="#333" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    marginHorizontal: 6,
    color: '#666',
  },
  orgName: {
    fontSize: 14,
    color: '#007AFF',
  },
  content: {
    fontSize: 15,
    lineHeight: 20,
    color: '#000',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  mediaContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  mediaImage: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH * 0.75,
    marginHorizontal: 16,
  },
  mediaIndicator: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
  },
  pollContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  pollQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  pollOption: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  pollOptionVoted: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  pollOptionDisabled: {
    opacity: 0.8,
  },
  pollOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    zIndex: 1,
  },
  pollOptionTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pollCheckIcon: {
    marginRight: 6,
  },
  pollOptionText: {
    fontSize: 15,
    color: '#000',
    flex: 1,
  },
  pollOptionTextVoted: {
    fontWeight: '600',
    color: '#007AFF',
  },
  pollVoteCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  pollProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  pollProgressVoted: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  pollVotedIndicator: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 4,
  },
  pollEndsAt: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    marginRight: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 6,
    fontWeight: '500',
  },
  actionTextLiked: {
    color: '#FF3B30',
  },
});
