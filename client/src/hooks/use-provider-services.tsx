import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Service, InsertService } from '@shared/schema';

export function useProviderServices(providerId?: number) {
  const servicesQuery = useQuery<Service[]>({
    queryKey: ['/api/providers/services', providerId],
    queryFn: async ({ queryKey }) => {
      // Important: We need to use the base URL for authenticated provider
      // The provider_id query param is only needed when requesting another provider's services
      const url = providerId 
        ? `/api/providers/services?provider_id=${providerId}` 
        : '/api/providers/services';
      
      console.log('Fetching services with URL:', url);
      const res = await apiRequest('GET', url);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error fetching services:', errorText);
        throw new Error(errorText || 'Failed to load services');
      }
      
      const data = await res.json();
      console.log('Services data received:', data);
      return data;
    },
    // Critical: Do not disable the query when providerId is undefined
    // The server will use the authenticated user's ID instead
  });

  const addServiceMutation = useMutation({
    mutationFn: async (serviceData: Partial<InsertService>) => {
      // Log service data before making the request
      console.log('Adding service with data:', serviceData);
      
      // Keep providerId if present, critical for validation
      // Convert basePrice to string if it's a number
      const formattedData = {
        ...serviceData,
        basePrice: serviceData.basePrice !== undefined 
          ? String(serviceData.basePrice) 
          : undefined,
        priceExclusions: serviceData.priceExclusions || ''
      };
      
      console.log('Formatted service data:', formattedData);
      
      const res = await apiRequest('POST', '/api/providers/services', formattedData);
      
      // Log response status
      console.log('Service add response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Service add error response:', errorText);
        throw new Error(errorText || 'Failed to add service');
      }
      
      const result = await res.json();
      console.log('Service add success response:', result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Service added',
        description: 'Your service has been added successfully',
      });
      // Invalidate services query to refresh data - include providerId in query key invalidation
      console.log('Invalidating queries with providerId included');
      queryClient.invalidateQueries({ queryKey: ['/api/providers/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/providers/services', providerId] });
    },
    onError: (error: Error) => {
      console.error('Service add mutation error:', error);
      toast({
        title: 'Error adding service',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async (serviceData: Partial<Service>) => {
      // Log service data before making the request
      console.log('Updating service with data:', serviceData);
      
      // Keep providerId if present, critical for validation
      // Convert basePrice to string if it's a number
      const formattedData = {
        ...serviceData,
        basePrice: serviceData.basePrice !== undefined 
          ? String(serviceData.basePrice) 
          : undefined,
        priceExclusions: serviceData.priceExclusions || ''
      };
      
      console.log('Formatted service data for update:', formattedData);
      
      // Server uses same endpoint for create and update, just include the id in the data
      const res = await apiRequest('POST', `/api/providers/services`, formattedData);
      
      // Log response status
      console.log('Service update response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Service update error response:', errorText);
        throw new Error(errorText || 'Failed to update service');
      }
      
      const result = await res.json();
      console.log('Service update success response:', result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Service updated',
        description: 'Your service has been updated successfully',
      });
      // Invalidate services query to refresh data - include providerId in query key invalidation
      console.log('Invalidating queries with providerId included for update');
      queryClient.invalidateQueries({ queryKey: ['/api/providers/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/providers/services', providerId] });
    },
    onError: (error: Error) => {
      console.error('Service update mutation error:', error);
      toast({
        title: 'Error updating service',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create Promise-based wrapper functions for mutations
  const addService = (data: InsertService) => {
    return new Promise((resolve, reject) => {
      addServiceMutation.mutate(data, {
        onSuccess: (result) => resolve(result),
        onError: (error) => reject(error),
      });
    });
  };

  const updateService = (data: Partial<Service>) => {
    return new Promise((resolve, reject) => {
      updateServiceMutation.mutate(data, {
        onSuccess: (result) => resolve(result),
        onError: (error) => reject(error),
      });
    });
  };

  return {
    services: servicesQuery.data || [],
    isLoading: servicesQuery.isLoading,
    error: servicesQuery.error,
    addService,
    updateService,
    isUpdating: addServiceMutation.isPending || updateServiceMutation.isPending,
  };
}