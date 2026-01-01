import { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter, useSegments } from 'expo-router';
import { GET_MY_ORGANIZATIONS } from '@/lib/graphql/queries/organizations';
import { useAuthStore } from '@/store/auth';

/**
 * Hook to enforce organization membership requirement.
 * Redirects unauthenticated or organization-less users to appropriate screens.
 */
export function useRequireOrganization() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  const { data, loading: orgsLoading } = useQuery(GET_MY_ORGANIZATIONS, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  const organizations = data?.myOrganizations || [];
  const hasOrganizations = organizations.length > 0;
  const isLoading = authLoading || orgsLoading;

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // Don't redirect if not authenticated
    if (!isAuthenticated) return;

    // Don't redirect if user has organizations
    if (hasOrganizations) return;

    // Don't redirect if already on join-organization page
    const currentPath = segments.join('/');
    if (currentPath.includes('join-organization')) return;

    // Redirect to join organization with onboarding flag
    router.replace('/join-organization?onboarding=true');
  }, [isLoading, isAuthenticated, hasOrganizations, segments, router]);

  return {
    isLoading,
    hasOrganizations,
    organizations,
  };
}
