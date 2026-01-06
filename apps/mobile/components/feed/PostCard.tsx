import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Avatar, LeaderBadge } from '@/components/ui';
import { Post } from '@/types';
import { differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays, differenceInWeeks } from 'date-fns';

const { width: screenWidth } = Dimensions.get('window');
const IMAGE_WIDTH = screenWidth - 32; // Account for padding

// Format count for X/Twitter style display
const formatCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

// Format time in short format (19m, 2h, 3d, 2w)
const formatTimeShort = (date: Date): string => {
  const now = new Date();
  const seconds = differenceInSeconds(now, date);

  if (seconds < 60) return `${seconds}s`;

  const minutes = differenceInMinutes(now, date);
  if (minutes < 60) return `${minutes}m`;

  const hours = differenceInHours(now, date);
  if (hours < 24) return `${hours}h`;

  const days = differenceInDays(now, date);
  if (days < 7) return `${days}d`;

  const weeks = differenceInWeeks(now, date);
  if (weeks < 52) return `${weeks}w`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onRepost?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onPress?: (postId: string) => void;
  onVote?: (postId: string, pollId: string, optionId: string) => void;
  onAuthorPress?: (authorId: string) => void;
  showOrgInfo?: boolean; // Show organization name as clickable link (for "All Organizations" view)
  onOrgPress?: (orgSlug: string) => void;
  onDelete?: (postId: string) => void;
  currentUserId?: string; // Current user ID to check ownership for delete
}

export function PostCard({
  post,
  onLike,
  onComment,
  onRepost,
  onShare,
  onPress,
  onVote,
  onAuthorPress,
  showOrgInfo,
  onOrgPress,
  onDelete,
  currentUserId,
}: PostCardProps) {
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Check if current user owns this post
  const isOwnPost = currentUserId && post.author?.id === currentUserId;

  // Format timestamp
  const timeAgo = formatTimeShort(new Date(post.createdAt));

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

  // Handle organization press
  const handleOrgPress = () => {
    if (post.organization?.id) {
      if (onOrgPress) {
        onOrgPress(post.organization.id);
      } else {
        // Navigate to org page using id (slug not available in summary)
        router.push(`/organization/${post.organization.id}`);
      }
    }
  };

  // Handle delete press
  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(post.id),
        },
      ]
    );
  };

  // Handle like press
  const handleLike = () => {
    onLike?.(post.id);
  };

  // Handle comment press
  const handleComment = () => {
    onComment?.(post.id);
  };

  // Handle repost press (internal repost)
  const handleRepost = () => {
    onRepost?.(post.id);
  };

  // Handle share press (external share)
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerMain}
          onPress={handleAuthorPress}
          activeOpacity={0.7}
        >
          <Avatar uri={post.author?.avatar} name={authorName} size={44} />
          <View style={styles.headerInfo}>
            <View style={styles.headerTop}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>{authorName}</Text>
                {post.author?.isLeader && (
                  <LeaderBadge level={post.author.leaderLevel} size="small" />
                )}
                <Text style={styles.timestamp}>· {timeAgo}</Text>
              </View>
            </View>
            {post.author?.email && (
              <Text style={styles.authorHandle} numberOfLines={1}>
                @{post.author.email.split('@')[0]}
              </Text>
            )}
            {/* Organization info for "All Organizations" view */}
            {showOrgInfo && post.organization?.name && (
              <TouchableOpacity onPress={handleOrgPress} activeOpacity={0.7}>
                <Text style={styles.orgLink} numberOfLines={1}>
                  in {post.organization.name}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
        {/* Delete button (only for own posts) */}
        {isOwnPost && onDelete && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>

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

      {/* Actions - Comment, Like, Repost, Share */}
      <View style={styles.actions}>
        {/* Comment */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleComment}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#536471" />
          {post.commentCount > 0 && (
            <Text style={styles.actionCount}>{formatCount(post.commentCount)}</Text>
          )}
        </TouchableOpacity>

        {/* Like */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLike}
          activeOpacity={0.7}
        >
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={post.isLiked ? '#F91880' : '#536471'}
          />
          {post.likeCount > 0 && (
            <Text style={[styles.actionCount, post.isLiked && styles.actionCountLiked]}>
              {formatCount(post.likeCount)}
            </Text>
          )}
        </TouchableOpacity>

        {/* Repost (retweet icon) */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleRepost}
          activeOpacity={0.7}
        >
          <Ionicons name="repeat-outline" size={22} color="#536471" />
          {post.repostCount > 0 && (
            <Text style={styles.actionCount}>{formatCount(post.repostCount)}</Text>
          )}
        </TouchableOpacity>

        {/* Share (actual share icon) */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Ionicons name="share-social-outline" size={20} color="#536471" />
          {post.shareCount > 0 && (
            <Text style={styles.actionCount}>{formatCount(post.shareCount)}</Text>
          )}
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
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
    marginLeft: 4,
    marginTop: -4,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F1419',
  },
  timestamp: {
    fontSize: 13,
    color: '#536471',
  },
  authorHandle: {
    fontSize: 13,
    color: '#536471',
    marginTop: 1,
  },
  orgLink: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 2,
    fontWeight: '500',
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFF3F4',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    minWidth: 50,
  },
  actionCount: {
    fontSize: 13,
    color: '#536471',
    marginLeft: 4,
    fontWeight: '400',
  },
  actionCountLiked: {
    color: '#F91880',
  },
});
