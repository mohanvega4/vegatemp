import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Booking, InsertBooking } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';

export interface BookingWithDetails {
  id: number;
  customerId: number;
  serviceId: number;
  eventId: number;
  startTime: string;
  endTime?: string;
  status: string;
  notes?: string;
  totalPrice?: string;
  createdAt?: string;
  updatedAt?: string;
  event: {
    name: string;
    location: string;
    startDate: string;
    endDate: string;
  };
  service: {
    id: number;
    title: string;
    providerId: number;
    serviceCategory: string;
    basePrice: string;
    providerName: string;
  };
}

export function useCustomerBookings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  
  // Add debug logging
  console.log("Customer ID:", user?.id);

  // Fetch all bookings
  const { 
    data: bookings = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/customer/bookings', user?.id],
    enabled: Boolean(user?.id),
    staleTime: 0, // Data is always considered stale
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/customer/bookings');
        if (!res.ok) throw new Error('Failed to fetch bookings');
        return await res.json();
      } catch (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }
    }
  });

  // Get a single booking by ID
  const { 
    data: selectedBooking,
    isLoading: isLoadingBooking
  } = useQuery({
    queryKey: ['/api/customer/bookings', selectedBookingId],
    queryFn: async () => {
      if (!selectedBookingId) return null;
      try {
        const res = await apiRequest('GET', `/api/customer/bookings/${selectedBookingId}`);
        if (!res.ok) throw new Error('Failed to fetch booking details');
        return await res.json();
      } catch (error) {
        console.error('Error fetching booking details:', error);
        return null;
      }
    },
    enabled: !!selectedBookingId
  });

  // Create a new booking
  const { 
    mutate: createBooking,
    isPending: isCreating
  } = useMutation({
    mutationFn: async (newBooking: InsertBooking) => {
      const res = await apiRequest('POST', '/api/customer/bookings', newBooking);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create booking');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Booking Created',
        description: 'Your booking has been created successfully.',
      });
      // Invalidate with user ID for cache accuracy
      queryClient.invalidateQueries({ queryKey: ['/api/customer/bookings', user?.id] });
      // Also invalidate parent queries
      queryClient.invalidateQueries({ queryKey: ['/api/customer/bookings'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Booking',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Cancel a booking
  const { 
    mutate: cancelBooking,
    isPending: isCancelling
  } = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('PATCH', `/api/customer/bookings/${id}`, { status: 'cancelled' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to cancel booking');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled successfully.',
      });
      // Invalidate with user ID for cache accuracy
      queryClient.invalidateQueries({ queryKey: ['/api/customer/bookings', user?.id] });
      // Invalidate parent queries
      queryClient.invalidateQueries({ queryKey: ['/api/customer/bookings'] });
      // Invalidate the specific booking query
      queryClient.invalidateQueries({ queryKey: ['/api/customer/bookings', selectedBookingId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Cancel Booking',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Filter bookings by status
  const pendingBookings = bookings.filter((booking: BookingWithDetails) => 
    booking.status === 'pending'
  );

  const confirmedBookings = bookings.filter((booking: BookingWithDetails) => 
    booking.status === 'confirmed'
  );

  const completedBookings = bookings.filter((booking: BookingWithDetails) => 
    booking.status === 'completed'
  );

  const cancelledBookings = bookings.filter((booking: BookingWithDetails) => 
    booking.status === 'cancelled' || booking.status === 'declined'
  );

  return {
    bookings,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    selectedBooking,
    setSelectedBookingId,
    isLoading,
    isLoadingBooking,
    error,
    createBooking,
    isCreating,
    cancelBooking,
    isCancelling,
  };
}