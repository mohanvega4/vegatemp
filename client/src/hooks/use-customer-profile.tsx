import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from './use-auth';

export interface CustomerProfile {
  id: number;
  userId: number;
  customerType: 'individual' | 'corporate' | 'planner';
  companyName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    app: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileData {
  customerType?: 'individual' | 'corporate' | 'planner';
  companyName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    app: boolean;
  };
}

export function useCustomerProfile() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch customer profile
  const { 
    data: profile,
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/customer/profile'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/customer/profile');
        if (!res.ok) throw new Error('Failed to fetch profile');
        return await res.json();
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Return a default profile with fallback values if none exists yet
        return {
          userId: user?.id,
          customerType: 'individual',
          notificationPreferences: {
            email: true,
            sms: false,
            app: true,
          }
        };
      }
    },
    enabled: !!user
  });

  // Update profile
  const { 
    mutate: updateProfile,
    isPending: isUpdating
  } = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const res = await apiRequest('PATCH', '/api/customer/profile', data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/profile'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Profile',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    isUpdating,
  };
}