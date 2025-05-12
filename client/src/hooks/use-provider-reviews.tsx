import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Review } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';

interface ReviewWithCustomer {
  review: Review;
  customer: {
    id: number;
    name: string;
    avatarUrl: string | null;
  };
}

export function useProviderReviews(providerId?: number) {
  const { user } = useAuth();
  const providerIdToUse = providerId || (user?.role === 'provider' ? user.id : undefined);
  
  // Only fetch reviews for providers or when explicitly given a providerId
  const shouldFetchReviews = Boolean(providerIdToUse);
  
  const reviewsQuery = useQuery<ReviewWithCustomer[]>({
    queryKey: ['/api/providers/reviews', providerIdToUse],
    queryFn: async ({ queryKey }) => {
      // Only make the request if we have a provider ID
      if (!providerIdToUse) {
        return [];
      }
      
      const url = `/api/providers/reviews?provider_id=${providerIdToUse}`;
      const res = await apiRequest('GET', url);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to load reviews');
      }
      return await res.json();
    },
    enabled: shouldFetchReviews,
  });

  const respondToReviewMutation = useMutation({
    mutationFn: async ({ reviewId, response }: { reviewId: number; response: string }) => {
      const res = await apiRequest('POST', `/api/providers/reviews/${reviewId}/respond`, { response });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to respond to review');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Response added',
        description: 'Your response has been added to the review',
      });
      // Invalidate reviews query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/providers/reviews'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error responding to review',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Calculate average rating
  const averageRating = reviewsQuery.data && reviewsQuery.data.length > 0
    ? reviewsQuery.data.reduce((sum, item) => sum + item.review.rating, 0) / reviewsQuery.data.length
    : 0;

  return {
    reviews: reviewsQuery.data || [],
    averageRating,
    reviewCount: reviewsQuery.data?.length || 0,
    isLoading: reviewsQuery.isLoading,
    error: reviewsQuery.error,
    respondToReview: respondToReviewMutation.mutate,
    isResponding: respondToReviewMutation.isPending,
  };
}