import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui';
import { GET_POST_WITH_COMMENTS } from '@/lib/graphql/queries/feed';
import { CREATE_COMMENT, LIKE_POST, LIKE_COMMENT, SHARE_POST } from '@/lib/graphql/mutations/feed';
import { Post as PostType, Comment } from '@/types';

interface PostWithComments extends PostType {
  comments?: Comment[];
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const commentInputRef = useRef<TextInput>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedCommentId, setFocusedCommentId] = useState<string | null>(null);

  // Fetch post with comments
  const { data, loading, error, refetch } = useQuery(GET_POST_WITH_COMMENTS, {
    variables: { id },
    skip: !id,
  });

  // Mutations
  const [likePostMutation] = useMutation(LIKE_POST);
  const [likeCommentMutation] = useMutation(LIKE_COMMENT, {
    refetchQueries: [{ query: GET_POST_WITH_COMMENTS, variables: { id } }],
  });
  const [createCommentMutation] = useMutation(CREATE_COMMENT, {
    refetchQueries: [{ query: GET_POST_WITH_COMMENTS, variables: { id } }],
  });
  const [sharePostMutation] = useMutation(SHARE_POST, {
    refetchQueries: [{ query: GET_POST_WITH_COMMENTS, variables: { id } }],
  });

  const post: PostWithComments | null = data?.post || null;

  // Handle back
  const handleBack = () => {
    router.back();
  };

  // Handle like
  const handleLike = async () => {
    if (!post) return;

    try {
      await likePostMutation({
        variables: { postId: post.id },
      });
      refetch();
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post');
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async () => {
    if (!post || !commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createCommentMutation({
        variables: {
          postId: post.id,
          content: commentText.trim(),
          parentId: focusedCommentId,
        },
      });
      setCommentText('');
      setFocusedCommentId(null);

      // Scroll to top to see the new comment
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Error creating comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reply to comment
  const handleReply = (commentId: string) => {
    setFocusedCommentId(commentId);
    // TODO: Could scroll to comment input or show focused UI
  };

  // Handle comment like
  const handleCommentLike = async (commentId: string) => {
    try {
      await likeCommentMutation({
        variables: { commentId },
      });
    } catch (error) {
      console.error('Error liking comment:', error);
      Alert.alert('Error', 'Failed to like comment');
    }
  };

  // Handle share
  const handleShare = async () => {
    if (!post) return;

    const authorName = getAuthorName(post.author);
    const shareMessage = post.content
      ? `${authorName} shared: "${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}"`
      : `Check out this post by ${authorName}`;

    try {
      const result = await Share.share({
        message: shareMessage,
      });

      if (result.action === Share.sharedAction) {
        const platform = result.activityType || 'other';
        await sharePostMutation({
          variables: { postId: post.id, platform },
        });
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      Alert.alert('Error', 'Failed to share post');
    }
  };

  // Handle comment button press - focus the input
  const handleCommentPress = () => {
    commentInputRef.current?.focus();
  };

  // Handle author press
  const handleAuthorPress = (authorId: string) => {
    router.push(`/user/${authorId}`);
  };

  // Format author name
  const getAuthorName = (author: any) => {
    return (
      author?.displayName ||
      `${author?.firstName} ${author?.lastName}`.trim() ||
      'Anonymous'
    );
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Post',
            headerLeft: () => (
              <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            ),
          }}
        />
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Render error state
  if (error || !post) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Post',
            headerLeft: () => (
              <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            ),
          }}
        />
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Failed to load post</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const authorName = getAuthorName(post.author);
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Post',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Post Content */}
        <View style={styles.postContainer}>
          {/* Author Header */}
          <TouchableOpacity
            style={styles.authorHeader}
            onPress={() => handleAuthorPress(post.author.id)}
            activeOpacity={0.7}
          >
            <Avatar uri={post.author?.avatar} name={authorName} size={48} />
            <View style={styles.authorInfo}>
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

          {/* Post Content */}
          {post.content && (
            <Text style={styles.postContent}>{post.content}</Text>
          )}

          {/* Post Stats */}
          <View style={styles.statsContainer}>
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

          {/* Post Actions */}
          <View style={styles.actionsContainer}>
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
              <Text
                style={[styles.actionText, post.isLiked && styles.actionTextLiked]}
              >
                Like
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCommentPress}
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
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            Comments ({post.comments?.length || 0})
          </Text>

          {post.comments && post.comments.length > 0 ? (
            post.comments.map((comment) => {
              const commentAuthorName = getAuthorName(comment.author);
              const commentTimeAgo = formatDistanceToNow(
                new Date(comment.createdAt),
                { addSuffix: true }
              );

              return (
                <View key={comment.id} style={styles.commentCard}>
                  {/* Comment Header */}
                  <TouchableOpacity
                    style={styles.commentHeader}
                    onPress={() => handleAuthorPress(comment.author.id)}
                    activeOpacity={0.7}
                  >
                    <Avatar
                      uri={comment.author?.avatar}
                      name={commentAuthorName}
                      size={36}
                    />
                    <View style={styles.commentHeaderInfo}>
                      <Text style={styles.commentAuthorName}>
                        {commentAuthorName}
                      </Text>
                      <Text style={styles.commentTimestamp}>
                        {commentTimeAgo}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Comment Content */}
                  <Text style={styles.commentContent}>{comment.content}</Text>

                  {/* Comment Actions */}
                  <View style={styles.commentActions}>
                    <TouchableOpacity
                      style={styles.commentActionButton}
                      onPress={() => handleCommentLike(comment.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={comment.isLiked ? 'heart' : 'heart-outline'}
                        size={16}
                        color={comment.isLiked ? '#FF3B30' : '#666'}
                      />
                      <Text
                        style={[
                          styles.commentActionText,
                          comment.isLiked && styles.commentActionTextLiked,
                        ]}
                      >
                        {comment.likeCount > 0 ? comment.likeCount : 'Like'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.commentActionButton}
                      onPress={() => handleReply(comment.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="arrow-undo-outline"
                        size={16}
                        color="#666"
                      />
                      <Text style={styles.commentActionText}>Reply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyComments}>
              <Ionicons name="chatbubbles-outline" size={48} color="#CCC" />
              <Text style={styles.emptyCommentsText}>No comments yet</Text>
              <Text style={styles.emptyCommentsSubtext}>
                Be the first to comment
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={[styles.commentInputContainer, { paddingBottom: insets.bottom }]}>
        {focusedCommentId && (
          <View style={styles.replyingToBar}>
            <Text style={styles.replyingToText}>Replying to comment</Text>
            <TouchableOpacity onPress={() => setFocusedCommentId(null)}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.commentInputRow}>
          <TextInput
            ref={commentInputRef}
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor="#999"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!commentText.trim() || isSubmitting) && styles.sendButtonDisabled,
            ]}
            onPress={handleCommentSubmit}
            disabled={!commentText.trim() || isSubmitting}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={commentText.trim() ? '#007AFF' : '#CCC'}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  headerButton: {
    padding: 8,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Post styles
  postContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    marginBottom: 8,
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  authorInfo: {
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
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#000',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    marginRight: 16,
  },
  actionsContainer: {
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

  // Comments styles
  commentsSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  commentCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentHeaderInfo: {
    flex: 1,
    marginLeft: 10,
  },
  commentAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  commentTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 8,
    paddingLeft: 46,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 46,
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  commentActionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  commentActionTextLiked: {
    color: '#FF3B30',
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },

  // Comment input styles
  commentInputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
  },
  replyingToBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
  },
  replyingToText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
