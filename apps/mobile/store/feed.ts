import { create } from 'zustand';
import { Post, Organization, LocationLevel } from '@/types';

export type OrgLevel = 'GLOBAL' | 'COUNTRY' | 'STATE' | 'LGA' | 'WARD' | 'POLLING_UNIT';

// Feed view type - which organization context the user is viewing
export type FeedViewType = 'all' | 'public' | 'org';

export interface LocationFilter {
  countryId?: string;
  stateId?: string;
  lgaId?: string;
  wardId?: string;
  pollingUnitId?: string;
}

interface FeedState {
  // State
  posts: Post[];
  offset: number;
  limit: number;
  hasMore: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  locationFilter: LocationFilter | null;
  currentViewingOrg: Organization | null;
  currentViewType: FeedViewType;
  currentLocationLevel: LocationLevel | null;

  // Actions
  setPosts: (posts: Post[]) => void;
  addPosts: (posts: Post[], replace?: boolean) => void;
  addPost: (post: Post) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  removePost: (postId: string) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
  incrementOffset: () => void;
  resetFeed: () => void;
  setLocationFilter: (filter: LocationFilter | null) => void;
  setCurrentViewingOrg: (org: Organization | null) => void;
  setCurrentViewType: (type: FeedViewType) => void;
  setCurrentLocationLevel: (level: LocationLevel | null) => void;
  setFeedContext: (org: Organization | null, viewType: FeedViewType, locationLevel?: LocationLevel | null) => void;

  // Optimistic updates
  optimisticLike: (postId: string, isLiked: boolean) => void;
  optimisticComment: (postId: string) => void;
  optimisticVote: (postId: string, pollId: string, optionId: string) => void;
  optimisticRepost: (postId: string) => void;
  optimisticShare: (postId: string) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  // Initial state
  posts: [],
  offset: 0,
  limit: 20,
  hasMore: true,
  isLoading: false,
  isRefreshing: false,
  error: null,
  locationFilter: null,
  currentViewingOrg: null,
  currentViewType: 'all' as FeedViewType,
  currentLocationLevel: null,

  // Set posts (replace all)
  setPosts: (posts: Post[]) => {
    set({ posts });
  },

  // Add posts (append or replace)
  addPosts: (posts: Post[], replace = false) => {
    set((state) => ({
      posts: replace ? posts : [...state.posts, ...posts],
      hasMore: posts.length === state.limit,
    }));
  },

  // Add a single post (typically for new posts at the top)
  addPost: (post: Post) => {
    set((state) => ({
      posts: [post, ...state.posts],
    }));
  },

  // Update a post by ID
  updatePost: (postId: string, updates: Partial<Post>) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId ? { ...post, ...updates } : post
      ),
    }));
  },

  // Remove a post by ID
  removePost: (postId: string) => {
    set((state) => ({
      posts: state.posts.filter((post) => post.id !== postId),
    }));
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Set refreshing state
  setRefreshing: (refreshing: boolean) => {
    set({ isRefreshing: refreshing });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },

  // Set hasMore flag
  setHasMore: (hasMore: boolean) => {
    set({ hasMore });
  },

  // Increment offset for pagination
  incrementOffset: () => {
    set((state) => ({
      offset: state.offset + state.limit,
    }));
  },

  // Reset feed to initial state
  resetFeed: () => {
    set({
      posts: [],
      offset: 0,
      hasMore: true,
      isLoading: false,
      isRefreshing: false,
      error: null,
    });
  },

  // Set location filter
  setLocationFilter: (filter: LocationFilter | null) => {
    set({ locationFilter: filter });
  },

  // Set current viewing organization
  setCurrentViewingOrg: (org: Organization | null) => {
    set({ currentViewingOrg: org });
  },

  // Set current view type (all, public, or org)
  setCurrentViewType: (type: FeedViewType) => {
    set({ currentViewType: type });
  },

  // Set current location level being viewed
  setCurrentLocationLevel: (level: LocationLevel | null) => {
    set({ currentLocationLevel: level });
  },

  // Set full feed context at once (for convenience)
  setFeedContext: (org: Organization | null, viewType: FeedViewType, locationLevel?: LocationLevel | null) => {
    set((state) => ({
      currentViewingOrg: org,
      currentViewType: viewType,
      // Only update currentLocationLevel if explicitly provided, otherwise keep existing
      currentLocationLevel: locationLevel !== undefined ? locationLevel : state.currentLocationLevel,
    }));
  },

  // Optimistic like update
  optimisticLike: (postId: string, isLiked: boolean) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: isLiked,
              likeCount: isLiked ? post.likeCount + 1 : post.likeCount - 1,
            }
          : post
      ),
    }));
  },

  // Optimistic comment update (increment comment count)
  optimisticComment: (postId: string) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              commentCount: post.commentCount + 1,
            }
          : post
      ),
    }));
  },

  // Optimistic vote update (increment vote count for selected option)
  optimisticVote: (postId: string, pollId: string, optionId: string) => {
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id === postId && post.poll) {
          return {
            ...post,
            poll: {
              ...post.poll,
              options: post.poll.options?.map((option) =>
                option.id === optionId
                  ? { ...option, voteCount: option.voteCount + 1 }
                  : option
              ),
            },
          };
        }
        return post;
      }),
    }));
  },

  // Optimistic repost update (increment repost count)
  optimisticRepost: (postId: string) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              repostCount: (post.repostCount || 0) + 1,
            }
          : post
      ),
    }));
  },

  // Optimistic share update (increment share count)
  optimisticShare: (postId: string) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              shareCount: post.shareCount + 1,
            }
          : post
      ),
    }));
  },
}));
