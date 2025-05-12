import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { PortfolioItem, InsertPortfolioItem } from '@shared/schema';

export function useProviderPortfolio(providerId?: number) {
  const portfolioQuery = useQuery<PortfolioItem[]>({
    queryKey: ['/api/providers/portfolio', providerId],
    queryFn: async ({ queryKey }) => {
      const url = providerId 
        ? `/api/providers/portfolio?provider_id=${providerId}` 
        : '/api/providers/portfolio';
      const res = await apiRequest('GET', url);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to load portfolio items');
      }
      return await res.json();
    },
  });

  const addPortfolioItemMutation = useMutation({
    mutationFn: async (itemData: Partial<InsertPortfolioItem>) => {
      const res = await apiRequest('POST', '/api/providers/portfolio', itemData);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to add portfolio item');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Portfolio item added',
        description: 'Your portfolio item has been added successfully',
      });
      // Invalidate portfolio query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/providers/portfolio'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error adding portfolio item',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Group items by type (image, video, link)
  const groupedItems = {
    images: portfolioQuery.data?.filter(item => item.type === 'image') || [],
    videos: portfolioQuery.data?.filter(item => item.type === 'video') || [],
    links: portfolioQuery.data?.filter(item => item.type === 'link') || [],
  };

  return {
    portfolioItems: portfolioQuery.data || [],
    groupedItems,
    isLoading: portfolioQuery.isLoading,
    error: portfolioQuery.error,
    addPortfolioItem: addPortfolioItemMutation.mutate,
    isAdding: addPortfolioItemMutation.isPending,
  };
}