import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { ProviderProfile } from '@shared/schema';

export interface ProviderProfileWithUser {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  status: string;
  avatar_url?: string;
  phone?: string;
  country?: string;
  city?: string;
  bio?: string;
  is_organization?: boolean;
  organization_name?: string;
  profile: ProviderProfile;
}

export function useProviderProfile(providerId?: number) {
  const profileQuery = useQuery<ProviderProfileWithUser>({
    queryKey: ['/api/providers/profile', providerId],
    queryFn: async ({ queryKey }) => {
      const url = providerId 
        ? `/api/providers/profile?provider_id=${providerId}` 
        : '/api/providers/profile';
      const res = await apiRequest('GET', url);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to load provider profile');
      }
      return await res.json();
    },
    enabled: providerId !== undefined,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<ProviderProfile>) => {
      const res = await apiRequest('POST', '/api/providers/profile', profileData);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to update profile');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
      // Invalidate profile query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/providers/profile'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
  };
}