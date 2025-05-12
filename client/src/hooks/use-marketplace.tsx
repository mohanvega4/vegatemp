import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

export interface MarketplaceService {
  id: number;
  title: string;
  description: string;
  serviceType: string;
  serviceCategory: string;
  basePrice: string;
  provider: {
    id: number;
    name: string;
    rating: number;
    reviewCount: number;
    verified: boolean;
  };
}

export interface ServiceFilter {
  type?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  verified?: boolean;
}

export function useMarketplace() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<ServiceFilter>({});
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  // Fetch all services
  const { 
    data: services = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/marketplace/services'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/marketplace/services');
        if (!res.ok) throw new Error('Failed to fetch services');
        return await res.json();
      } catch (error) {
        console.error('Error fetching services:', error);
        return [];
      }
    }
  });

  // Get a single service by ID
  const { 
    data: selectedService,
    isLoading: isLoadingService
  } = useQuery({
    queryKey: ['/api/marketplace/services', selectedServiceId],
    queryFn: async () => {
      if (!selectedServiceId) return null;
      try {
        const res = await apiRequest('GET', `/api/marketplace/services/${selectedServiceId}`);
        if (!res.ok) throw new Error('Failed to fetch service details');
        return await res.json();
      } catch (error) {
        console.error('Error fetching service details:', error);
        return null;
      }
    },
    enabled: !!selectedServiceId
  });

  // Book a service
  const { 
    mutate: bookService,
    isPending: isBooking
  } = useMutation({
    mutationFn: async (bookingData: {
      serviceId: number;
      eventId: number;
      date: string;
      time: string;
      notes?: string;
    }) => {
      const res = await apiRequest('POST', '/api/customer/bookings', {
        serviceId: bookingData.serviceId,
        eventId: bookingData.eventId,
        startTime: `${bookingData.date}T${bookingData.time}`,
        notes: bookingData.notes || '',
        status: 'pending',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to book service');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Service Booked',
        description: 'Your booking request has been sent to the provider.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/bookings'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Book Service',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Group services by type
  const servicesByType = services.reduce((acc: Record<string, MarketplaceService[]>, service: MarketplaceService) => {
    const type = service.serviceType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(service);
    return acc;
  }, {});

  // Get unique service types and categories
  const availableTypes = [...new Set(services.map((s: MarketplaceService) => s.serviceType))];
  const availableCategories = [...new Set(services.map((s: MarketplaceService) => s.serviceCategory))];

  return {
    services,
    servicesByType,
    selectedService,
    isLoading,
    isLoadingService,
    error,
    setSelectedServiceId,
    bookService,
    isBooking,
    filters,
    setFilters,
    availableTypes,
    availableCategories,
  };
}