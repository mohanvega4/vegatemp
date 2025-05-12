import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Booking } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';

interface BookingWithDetails {
  booking: Booking;
  event: {
    name: string;
    location: string;
  };
  customer: {
    name: string;
    email: string;
  };
}

export function useProviderBookings() {
  const { user } = useAuth();
  
  // Add logging to track user changes
  console.log("Provider ID:", user?.id);
  
  const bookingsQuery = useQuery<BookingWithDetails[]>({
    queryKey: ['/api/providers/bookings', user?.id], // Add user ID to query key for cache differentiation
    enabled: Boolean(user?.id) && user?.role === 'provider', // Only run query when user is available AND role is provider
    queryFn: async () => {
      try {
        const res = await fetch('/api/providers/bookings', {
          credentials: 'include'
        });
        
        // Handle 401 silently for provider bookings
        if (res.status === 401) {
          console.log("User not authorized for provider bookings, skipping fetch");
          return [];
        }
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || 'Failed to load bookings');
        }
        
        return await res.json();
      } catch (error) {
        console.error("Error fetching bookings:", error);
        return []; // Return empty array to prevent UI errors
      }
    },
    // Critical options to ensure data is always fresh
    staleTime: 0, // Data is always considered stale
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: 'confirmed' | 'declined' }) => {
      const res = await apiRequest('PATCH', `/api/providers/bookings/${bookingId}/status`, { status });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to update booking status');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Booking updated',
        description: 'Booking status has been updated successfully',
      });
      // Invalidate bookings query to refresh data, include all related queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/providers/bookings', user?.id] 
      });
      // Also invalidate any potential parent queries
      queryClient.invalidateQueries({
        queryKey: ['/api/providers/bookings']
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating booking',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Group bookings by status
  const pendingBookings = bookingsQuery.data?.filter(b => b.booking.status === 'pending') || [];
  const confirmedBookings = bookingsQuery.data?.filter(b => b.booking.status === 'confirmed') || [];
  const completedBookings = bookingsQuery.data?.filter(b => b.booking.status === 'completed') || [];
  const cancelledBookings = bookingsQuery.data?.filter(b => 
    b.booking.status === 'cancelled' || b.booking.status === 'declined'
  ) || [];

  return {
    bookings: bookingsQuery.data || [],
    pendingBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    pendingCount: pendingBookings.length,
    isLoading: bookingsQuery.isLoading,
    error: bookingsQuery.error,
    updateBookingStatus: updateBookingStatusMutation.mutate,
    isUpdating: updateBookingStatusMutation.isPending,
  };
}