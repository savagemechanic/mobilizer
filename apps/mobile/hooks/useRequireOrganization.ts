import { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter, useSegments } from 'expo-router';
import { GET_ORGANIZATIONS_FOR_SELECTOR } from '@/lib/graphql/queries/organizations';
import { useAuthStore } from '@/store/auth';

/**
 * Hook to enforce organization membership requirement.
 * Redirects unauthenticated or organization-less users to appropriate screens.
 * Note: Public organization doesn't count - users must join a real organization.
 */
export function useRequireOrganization() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  const { data, loading: orgsLoading } = useQuery(GET_ORGANIZATIONS_FOR_SELECTOR, {
    skip: !isAuthenticated,
    fetchPolicy: 'network-only',
  });

  // organizations array excludes public org - only contains user's actual joined orgs
  const organizations = data?.myOrganizationsForSelector?.organizations || [];
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
