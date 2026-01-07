import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFeedStore, LocationFilter } from '@/store/feed';
import { useAuthStore } from '@/store/auth';
import { PostCard, LocationCircles, OrganizationSelector } from '@/components/feed';
import type { OrgLevel } from '@/components/feed/LocationCircles';
import { GET_FEED, GET_POST_SHARE_TEXT, GET_POST_REPOST_TEXT } from '@/lib/graphql/queries/feed';
import {
  LIKE_POST,
  CREATE_COMMENT,
  CAST_VOTE,
  SHARE_POST,
  DELETE_POST,
} from '@/lib/graphql/mutations/feed';
import { Post } from '@/types';
import { usePolling } from '@/hooks/usePolling';

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const {
    posts,
    offset,
    limit,
    hasMore,
    isLoading,
    isRefreshing,
    locationFilter,
    addPosts,
    setLoading,
    setRefreshing,
    incrementOffset,
    resetFeed,
    setLocationFilter,
    setCurrentLocationLevel,
    setFeedContext,
    optimisticLike,
    optimisticComment,
    optimisticVote,
    optimisticRepost,
    optimisticShare,
    saveLastLocationForOrg,
    getLastLocationForOrg,
    markOrgAsVisited,
    hasVisitedOrg,
    removePost,
  } = useFeedStore();

  const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);
  const [activeLevel, setActiveLevel] = useState<OrgLevel | undefined>(undefined);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<'org' | 'all' | 'public'>('all');
  const [hasInitializedFilter, setHasInitializedFilter] = useState(false);

  // Get user's location circles in order: Country > State > Geopolitical Zone > LGA > Federal Constituency > Senatorial Zone > Ward > Polling Unit
  const locationCircles = React.useMemo(() => {
    if (!user?.location) return [];

    const circles = [];

    // Country level (first/leftmost) - default to Nigeria if country not set
    const countryData = user.location.country || { id: 'NGA', name: 'Nigeria' };
    circles.push({
      id: countryData.id,
      level: 'COUNTRY' as OrgLevel,
      name: countryData.name,
      code: 'NGA', // 3-letter country code
      hasNewPosts: false,
    });

    // State level
    if (user.location.state) {
      circles.push({
        id: user.location.state.id,
        level: 'STATE' as OrgLevel,
        name: user.location.state.name,
        hasNewPosts: false,
      });
    }

    // LGA level
    if (user.location.lga) {
      circles.push({
        id: user.location.lga.id,
        level: 'LGA' as OrgLevel,
        name: user.location.lga.name,
        hasNewPosts: false,
      });
    }

    // Ward level
    if (user.location.ward) {
      circles.push({
        id: user.location.ward.id,
        level: 'WARD' as OrgLevel,
        name: user.location.ward.name,
        hasNewPosts: false,
      });
    }

    // Polling Unit level (last/rightmost)
    if (user.location.pollingUnit) {
      circles.push({
        id: user.location.pollingUnit.id,
        level: 'POLLING_UNIT' as OrgLevel,
        name: user.location.pollingUnit.name,
        hasNewPosts: false,
      });
    }

    // Reverse the order so Polling Unit is leftmost and Country is rightmost
    return circles.reverse();
  }, [user]);

  // Auto-set to LGA location level on mount (default to LGA, not polling unit)
  useEffect(() => {
    if (!hasInitializedFilter && user?.location) {
      // Default to LGA level, not most specific
      if (user.location.lga) {
        setLocationFilter({ lgaId: user.location.lga.id });
        setCurrentLocationLevel('LGA');
        setActiveLevel('LGA');
      } else if (user.location.state) {
        setLocationFilter({ stateId: user.location.state.id });
        setCurrentLocationLevel('STATE');
        setActiveLevel('STATE');
      } else if (user.location.ward) {
        setLocationFilter({ wardId: user.location.ward.id });
        setCurrentLocationLevel('WARD');
        setActiveLevel('WARD');
      } else if (user.location.pollingUnit) {
        setLocationFilter({ pollingUnitId: user.location.pollingUnit.id });
        setCurrentLocationLevel('POLLING_UNIT');
        setActiveLevel('POLLING_UNIT');
      }
      setHasInitializedFilter(true);
    }
  }, [user, hasInitializedFilter, setLocationFilter, setCurrentLocationLevel]);

  // Build feed filter including both location and org filters
  const feedFilter = React.useMemo(() => {
    const filter: Record<string, string> = {};

    // Include location filter fields
    if (locationFilter?.countryId) filter.countryId = locationFilter.countryId;
    if (locationFilter?.stateId) filter.stateId = locationFilter.stateId;
    if (locationFilter?.lgaId) filter.lgaId = locationFilter.lgaId;
    if (locationFilter?.wardId) filter.wardId = locationFilter.wardId;
    if (locationFilter?.pollingUnitId) filter.pollingUnitId = locationFilter.pollingUnitId;

    // Add org filter
    if (selectedOrg?.id) filter.orgId = selectedOrg.id;

    const result = Object.keys(filter).length > 0 ? filter : null;
    console.log('📍 Feed filter:', JSON.stringify(result));
    return result;
  }, [locationFilter, selectedOrg]);

  // GraphQL query for feed
  const { data, loading, error, refetch, fetchMore } = useQuery(GET_FEED, {
    variables: { limit, offset: 0, filter: feedFilter },
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      if (data?.feed) {
        addPosts(data.feed, true); // Replace existing posts
      }
      setLoading(false);
      setRefreshing(false);
    },
    onError: (err) => {
      console.error('❌ Feed error message:', err.message);
      console.error('❌ Feed graphQLErrors:', JSON.stringify(err.graphQLErrors, null, 2));
      console.error('❌ Feed networkError:', err.networkError);
      console.error('❌ Feed filter used:', JSON.stringify(feedFilter));
      setLoading(false);
      setRefreshing(false);
    },
  });

  // Mutations
  const [likePostMutation] = useMutation(LIKE_POST);
  const [createCommentMutation] = useMutation(CREATE_COMMENT);
  const [castVoteMutation] = useMutation(CAST_VOTE);
  const [sharePostMutation] = useMutation(SHARE_POST);
  const [deletePostMutation] = useMutation(DELETE_POST);

  // Initial load
  useEffect(() => {
    setLoading(true);
  }, []);

  // Poll for new posts every 30 seconds
  usePolling(
    async () => {
      try {
        const { data } = await refetch({ limit, offset: 0, filter: feedFilter });
        if (data?.feed && data.feed.length > 0) {
          // Check if there are new posts
          const latestPostId = posts[0]?.id;
          const hasNewPosts = data.feed[0]?.id !== latestPostId;
          if (hasNewPosts) {
            setShowNewPostsBanner(true);
          }
        }
      } catch (error) {
        console.error('Error polling feed:', error);
      }
    },
    { interval: 30000, enabled: true }
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setShowNewPostsBanner(false);
    resetFeed();
    await refetch({ limit, offset: 0, filter: feedFilter });
  }, [refetch, limit, resetFeed, setRefreshing, feedFilter]);

  // Handle load more
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    try {
      const { data } = await fetchMore({
        variables: {
          limit,
          offset: posts.length,
        },
      });

      if (data?.feed) {
        addPosts(data.feed, false); // Append to existing posts
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    }
  }, [hasMore, loading, limit, posts.length, fetchMore, addPosts]);

  // Handle like
  const handleLike = useCallback(
    async (postId: string) => {
      // Find the post to get current like state
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const newLikedState = !post.isLiked;

      // Optimistic update
      optimisticLike(postId, newLikedState);

      try {
        const { data } = await likePostMutation({
          variables: { postId },
        });

        // Update with actual server response
        if (data?.likePost) {
          optimisticLike(postId, data.likePost.liked);
        }
      } catch (error) {
        console.error('Error liking post:', error);
        // Revert optimistic update
        optimisticLike(postId, post.isLiked ?? false);
      }
    },
    [posts, likePostMutation, optimisticLike]
  );

  // Handle comment - navigate to post detail page
  const handleComment = useCallback(
    (postId: string) => {
      router.push(`/post/${postId}`);
    },
    [router]
  );

  // Lazy query for share text
  const [getShareText] = useLazyQuery(GET_POST_SHARE_TEXT);
  const [getRepostText] = useLazyQuery(GET_POST_REPOST_TEXT);

  // Handle repost (internal share - opens create post with quoted text)
  const handleRepost = useCallback(
    async (postId: string) => {
      try {
        // Optimistic update for repost counter
        optimisticRepost(postId);

        // Fetch repost text - this is the only blocking request
        const { data } = await getRepostText({ variables: { postId } });
        const repostText = data?.postRepostText || '';

        // Navigate immediately - don't wait for tracking mutation
        router.push({
          pathname: '/(modals)/create-post',
          params: { repostText },
        });

        // Track the repost on the backend (fire and forget)
        sharePostMutation({
          variables: { postId, platform: 'internal' },
        }).catch((error) => console.error('Failed to track repost:', error));
      } catch (error) {
        console.error('Failed to get repost text:', error);
      }
    },
    [getRepostText, router, sharePostMutation, optimisticRepost]
  );

  // Handle external share (with marketing text)
  const handleExternalShare = useCallback(
    async (postId: string) => {
      try {
        const { data } = await getShareText({ variables: { postId } });
        const shareMessage = data?.postShareText || 'Check out this post on Mobilizer!';

        const result = await Share.share({
          message: shareMessage,
        });

        if (result.action === Share.sharedAction) {
          // Optimistic update for visible counter
          optimisticShare(postId);

          // Track the share on the backend
          const platform = result.activityType || 'other';
          await sharePostMutation({
            variables: { postId, platform },
          });
        }
      } catch (error) {
        console.error('Error sharing post:', error);
        Alert.alert('Error', 'Failed to share post');
      }
    },
    [getShareText, sharePostMutation, optimisticShare]
  );

  // Handle post press
  const handlePostPress = useCallback((postId: string) => {
    router.push(`/post/${postId}`);
  }, [router]);

  // Handle delete
  const handleDelete = useCallback(
    async (postId: string) => {
      // Optimistic update - remove from UI immediately
      removePost(postId);

      try {
        await deletePostMutation({
          variables: { postId },
        });
      } catch (error) {
        console.error('Error deleting post:', error);
        Alert.alert('Error', 'Failed to delete post. Please try again.');
        // Refetch to restore the post if deletion failed
        refetch();
      }
    },
    [deletePostMutation, removePost, refetch]
  );

  // Handle vote
  const handleVote = useCallback(
    async (postId: string, pollId: string, optionId: string) => {
      // Optimistic update
      optimisticVote(postId, pollId, optionId);

      try {
        await castVoteMutation({
          variables: { pollId, optionId },
        });
      } catch (error) {
        console.error('Error casting vote:', error);
        // TODO: Revert optimistic update
      }
    },
    [castVoteMutation, optimisticVote]
  );

  // Handle new posts banner press
  const handleNewPostsPress = () => {
    setShowNewPostsBanner(false);
    handleRefresh();
  };

  // Handle organization selector
  const handleOrgSelect = useCallback(async (org: any, type: 'org' | 'all' | 'public') => {
    // Save current location for the old organization before switching
    if (selectedOrg?.id && activeLevel) {
      saveLastLocationForOrg(selectedOrg.id, activeLevel as any);
    }

    setSelectedOrg(org);
    setSelectedType(type);

    // Update feed store so create-post can read the current org
    setFeedContext(org, type);

    // Determine which location level to show for the new org
    let targetLevel: OrgLevel | undefined = undefined;
    let targetFilter: LocationFilter | null = null;

    if (type === 'all') {
      // For "All Organizations" view, always have a location selected
      // Use current active level if available, otherwise default to LGA
      if (activeLevel) {
        targetLevel = activeLevel;
      } else if (user?.location?.lga) {
        targetLevel = 'LGA';
      } else if (user?.location?.state) {
        targetLevel = 'STATE';
      } else if (user?.location?.country) {
        targetLevel = 'COUNTRY';
      }
    } else if (org?.id) {
      // Check if user has visited this org before
      if (hasVisitedOrg(org.id)) {
        // Restore last location
        const lastLocation = getLastLocationForOrg(org.id);
        if (lastLocation) {
          targetLevel = lastLocation as OrgLevel;
        }
      } else {
        // First time visiting - default to LGA
        markOrgAsVisited(org.id);
        if (user?.location?.lga) {
          targetLevel = 'LGA';
        } else if (user?.location?.state) {
          targetLevel = 'STATE';
        }
      }
    }

    // Build location filter based on target level
    if (targetLevel && user?.location) {
      targetFilter = {};
      switch (targetLevel) {
        case 'COUNTRY':
          if (user.location.country) targetFilter.countryId = user.location.country.id;
          break;
        case 'STATE':
          if (user.location.state) targetFilter.stateId = user.location.state.id;
          break;
        case 'LGA':
          if (user.location.lga) targetFilter.lgaId = user.location.lga.id;
          break;
        case 'WARD':
          if (user.location.ward) targetFilter.wardId = user.location.ward.id;
          break;
        case 'POLLING_UNIT':
          if (user.location.pollingUnit) targetFilter.pollingUnitId = user.location.pollingUnit.id;
          break;
      }
    }

    // Update active level and location filter
    setActiveLevel(targetLevel);
    setCurrentLocationLevel(targetLevel || null);
    setLocationFilter(targetFilter);

    // Reset and refetch feed with new filter
    setLoading(true);
    resetFeed();

    // Refetch with the new filter (need to build it here since state hasn't updated yet)
    const newFilter: Record<string, string> = {};
    if (targetFilter?.countryId) newFilter.countryId = targetFilter.countryId;
    if (targetFilter?.stateId) newFilter.stateId = targetFilter.stateId;
    if (targetFilter?.lgaId) newFilter.lgaId = targetFilter.lgaId;
    if (targetFilter?.wardId) newFilter.wardId = targetFilter.wardId;
    if (targetFilter?.pollingUnitId) newFilter.pollingUnitId = targetFilter.pollingUnitId;
    if (org?.id) newFilter.orgId = org.id;

    try {
      await refetch({
        limit,
        offset: 0,
        filter: Object.keys(newFilter).length > 0 ? newFilter : null
      });
    } catch (error) {
      console.error('Error refetching feed after org change:', error);
    }
    setLoading(false);
  }, [selectedOrg, activeLevel, user, limit, refetch, resetFeed, setLoading, setFeedContext,
      setLocationFilter, setCurrentLocationLevel, saveLastLocationForOrg, getLastLocationForOrg,
      markOrgAsVisited, hasVisitedOrg]);

  // Handle location circle press (first tap - toggle selection)
  const handleLocationCirclePress = useCallback(async (circle: any) => {
    console.log('📍 Selected location level:', circle.level, circle.name);

    // In "All Organizations" view, don't allow un-selecting - always have a location selected
    // Clicking the same circle does nothing, clicking a different circle switches to it
    let newActiveLevel: OrgLevel | undefined;
    if (selectedType === 'all') {
      // In "All Organizations" view, always select (no toggle off)
      newActiveLevel = circle.level;
      if (circle.level === activeLevel) {
        // Already selected, do nothing
        return;
      }
    } else {
      // Normal toggle behavior for specific org views
      newActiveLevel = circle.level === activeLevel ? undefined : circle.level;
    }
    setActiveLevel(newActiveLevel);

    // Update current location level in store so create-post can read it
    setCurrentLocationLevel(newActiveLevel || null);

    // Save this location for the current org
    if (selectedOrg?.id && newActiveLevel) {
      saveLastLocationForOrg(selectedOrg.id, newActiveLevel as any);
    }

    // Build location filter based on selected level
    let filter: LocationFilter | null = null;
    if (newActiveLevel) {
      filter = {};
      switch (newActiveLevel) {
        case 'GLOBAL':
          // No filter for global level - shows all accessible posts
          filter = null;
          break;
        case 'COUNTRY':
          filter.countryId = circle.id;
          break;
        case 'STATE':
          filter.stateId = circle.id;
          break;
        case 'LGA':
          filter.lgaId = circle.id;
          break;
        case 'WARD':
          filter.wardId = circle.id;
          break;
        case 'POLLING_UNIT':
          filter.pollingUnitId = circle.id;
          break;
      }
    }

    // Update filter in store
    setLocationFilter(filter);

    // Reset and refetch feed with new filter
    setLoading(true);
    resetFeed();

    // Build new filter with org included
    const newFilter: Record<string, string> = {};
    if (filter?.countryId) newFilter.countryId = filter.countryId;
    if (filter?.stateId) newFilter.stateId = filter.stateId;
    if (filter?.lgaId) newFilter.lgaId = filter.lgaId;
    if (filter?.wardId) newFilter.wardId = filter.wardId;
    if (filter?.pollingUnitId) newFilter.pollingUnitId = filter.pollingUnitId;
    if (selectedOrg?.id) newFilter.orgId = selectedOrg.id;

    try {
      await refetch({
        limit,
        offset: 0,
        filter: Object.keys(newFilter).length > 0 ? newFilter : null
      });
    } catch (error) {
      console.error('Error refetching feed after location change:', error);
    }
    setLoading(false);
  }, [activeLevel, selectedOrg, selectedType, limit, refetch, setLocationFilter, setCurrentLocationLevel,
      resetFeed, setLoading, saveLastLocationForOrg]);

  // Handle location info press (second tap on already active location)
  const handleLocationInfoPress = useCallback((circle: any) => {
    console.log('📍 Opening location info:', circle.level, circle.name);

    // Build location hierarchy params
    const hierarchyParams: Record<string, string> = {};
    if (user?.location?.state?.name) hierarchyParams.stateName = user.location.state.name;
    if (user?.location?.lga?.name) hierarchyParams.lgaName = user.location.lga.name;
    if (user?.location?.ward?.name) hierarchyParams.wardName = user.location.ward.name;

    router.push({
      pathname: '/location-info',
      params: {
        id: circle.id,
        level: circle.level,
        name: circle.name,
        orgName: selectedOrg?.name || '',
        orgLogo: selectedOrg?.logo || '',
        ...hierarchyParams,
      },
    });
  }, [router, selectedOrg, user]);

  // Handle organization press from post card - switch to that org in the feed
  const handleOrgPress = useCallback((orgId: string) => {
    // Find the org in the user's organizations and switch to it
    // The org data should come from the post's organization field
    const post = posts.find(p => p.organization?.id === orgId);
    if (post?.organization) {
      // Create an org object compatible with handleOrgSelect
      const org = {
        id: post.organization.id,
        name: post.organization.name,
        logo: post.organization.logo,
      };
      handleOrgSelect(org, 'org');
    }
  }, [posts, handleOrgSelect]);

  // Render post item
  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        onLike={handleLike}
        onComment={handleComment}
        onRepost={handleRepost}
        onShare={handleExternalShare}
        onPress={handlePostPress}
        onVote={handleVote}
        showOrgInfo={selectedType === 'all'}
        onOrgPress={handleOrgPress}
        onDelete={handleDelete}
        currentUserId={user?.id}
      />
    ),
    [handleLike, handleComment, handleRepost, handleExternalShare, handlePostPress, handleVote, selectedType, handleOrgPress, handleDelete, user?.id]
  );

  // Render list footer
  const renderFooter = useCallback(() => {
    if (!hasMore) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }, [hasMore]);

  // Get current location name and type for empty state message
  const currentLocationInfo = React.useMemo(() => {
    if (!activeLevel || !locationCircles.length) return null;
    const circle = locationCircles.find((c) => c.level === activeLevel);
    if (!circle) return null;

    const levelLabels: Record<string, string> = {
      POLLING_UNIT: 'polling unit',
      WARD: 'ward',
      LGA: 'LGA',
      STATE: 'state',
      COUNTRY: 'country',
    };

    return {
      name: circle.name,
      type: levelLabels[circle.level] || circle.level.toLowerCase(),
    };
  }, [activeLevel, locationCircles]);

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
        <Text style={styles.emptyText}>No posts yet</Text>
        <Text style={styles.emptySubtext}>
          {currentLocationInfo
            ? `Say something to kick off a conversation in ${currentLocationInfo.name} ${currentLocationInfo.type}`
            : 'Be the first to start a conversation'}
        </Text>
      </View>
    );
  }, [loading, currentLocationInfo]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Failed to load feed</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/join-organization')}
            activeOpacity={0.7}
          >
            <Ionicons name="qr-code-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <OrganizationSelector
          selectedOrg={selectedOrg}
          selectedType={selectedType}
          onSelect={handleOrgSelect}
        />
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/(tabs)/messages')}
            activeOpacity={0.7}
          >
            <Ionicons name="mail-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Circles */}
      {locationCircles.length > 0 && (
        <LocationCircles
          circles={locationCircles}
          onCirclePress={handleLocationCirclePress}
          onLocationInfoPress={handleLocationInfoPress}
          activeLevel={activeLevel}
          orgLogo={selectedOrg?.logo}
          hideInfoIcon={selectedType === 'all'}
        />
      )}

      {/* New posts banner */}
      {showNewPostsBanner && (
        <TouchableOpacity
          style={styles.newPostsBanner}
          onPress={handleNewPostsPress}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
          <Text style={styles.newPostsText}>New posts available</Text>
        </TouchableOpacity>
      )}

      {/* Feed list */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        windowSize={10}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(modals)/create-post')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    width: 40,
  },
  headerRight: {
    width: 40,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  newPostsBanner: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  newPostsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F5F5F5',
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
