import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Event, InsertEvent } from '@shared/schema';

export interface EventWithDetails {
  id: number;
  name: string;
  description?: string;
  customerId?: number;
  customer_id?: number; // Include snake_case version from database
  eventDate?: string | Date;  // Could be either a string or Date object
  event_date?: string | Date; // Include snake_case version from database
  endDate?: string | Date;    // Could be either a string or Date object
  end_date?: string | Date;   // Include snake_case version from database
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  location?: string;
  eventType?: string;
  event_type?: string;
  vibe?: string;
  locationType?: string;
  location_type?: string;
  audienceSize?: number;
  audience_size?: number;
  budget?: string;
  status: string;
  createdAt?: string | Date;
  created_at?: string | Date;
  updatedAt?: string | Date;
  updated_at?: string | Date;
  services?: {
    id: number;
    name: string;
    type: string;
  }[];
}

export function useCustomerEvents() {
  const { toast } = useToast();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  // Fetch all events
  const { 
    data: events = [],
    isLoading,
    error,
    refetch: refetchEvents
  } = useQuery({
    queryKey: ['/api/customer/events'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/customer/events');
        if (!res.ok) throw new Error('Failed to fetch events');
        const data = await res.json();
        
        // Process dates for each event
        const processedEvents = data.map((event: any) => {
          console.log('Raw event data:', event);
          
          return {
            ...event,
            // Ensure eventDate is properly formatted
            eventDate: event.eventDate ? event.eventDate : null,
            // Ensure endDate is properly formatted
            endDate: event.endDate ? event.endDate : null,
          };
        });
        
        console.log('Processed events:', processedEvents);
        return processedEvents;
      } catch (error) {
        console.error('Error fetching events:', error);
        return [];
      }
    },
    staleTime: 0, // Always consider the data stale to ensure fresh data on user change
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true // Refetch when window regains focus
  });

  // Get a single event by ID
  const { 
    data: selectedEvent,
    isLoading: isLoadingEvent
  } = useQuery({
    queryKey: ['/api/customer/events', selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return null;
      try {
        const res = await apiRequest('GET', `/api/customer/events/${selectedEventId}`);
        if (!res.ok) throw new Error('Failed to fetch event details');
        return await res.json();
      } catch (error) {
        console.error('Error fetching event details:', error);
        return null;
      }
    },
    enabled: !!selectedEventId
  });
  
  // Get proposals for a specific event
  const {
    data: eventProposals = [],
    isLoading: isLoadingProposals
  } = useQuery({
    queryKey: ['/api/events', selectedEventId, 'proposals'],
    queryFn: async () => {
      if (!selectedEventId) return [];
      try {
        const res = await apiRequest('GET', `/api/events/${selectedEventId}/proposals`);
        if (!res.ok) throw new Error('Failed to fetch event proposals');
        const data = await res.json();
        console.log('Fetched proposals for event:', data);
        return data;
      } catch (error) {
        console.error('Error fetching event proposals:', error);
        return [];
      }
    },
    enabled: !!selectedEventId
  });
  
  // Accept a proposal
  const {
    mutate: acceptProposal,
    isPending: isAcceptingProposal
  } = useMutation({
    mutationFn: async ({ proposalId, feedback }: { proposalId: number, feedback?: string }) => {
      const res = await apiRequest('PATCH', `/api/proposals/${proposalId}`, {
        status: 'accepted',
        feedback: feedback || ''
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to accept proposal');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Proposal Accepted',
        description: 'The proposal has been accepted successfully.',
      });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/events', selectedEventId, 'proposals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/events'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Accept Proposal',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Reject a proposal
  const {
    mutate: rejectProposal,
    isPending: isRejectingProposal
  } = useMutation({
    mutationFn: async ({ proposalId, feedback }: { proposalId: number, feedback: string }) => {
      const res = await apiRequest('PATCH', `/api/proposals/${proposalId}`, {
        status: 'rejected',
        feedback
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reject proposal');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Proposal Rejected',
        description: 'The proposal has been rejected.',
      });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/events', selectedEventId, 'proposals'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Reject Proposal',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create a new event
  const { 
    mutate: createEvent,
    isPending: isCreating
  } = useMutation({
    mutationFn: async (newEvent: InsertEvent) => {
      const res = await apiRequest('POST', '/api/customer/events', newEvent);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create event');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Event Created',
        description: 'Your event has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/events'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Event',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update an existing event
  const { 
    mutate: updateEvent,
    isPending: isUpdating
  } = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertEvent> }) => {
      const res = await apiRequest('PATCH', `/api/customer/events/${id}`, data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update event');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Event Updated',
        description: 'Your event has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/events', selectedEventId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Event',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Cancel an event
  const { 
    mutate: cancelEvent,
    isPending: isCancelling
  } = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('PATCH', `/api/customer/events/${id}`, { status: 'cancelled' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to cancel event');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Event Cancelled',
        description: 'Your event has been cancelled successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/events', selectedEventId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Cancel Event',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Filter events by status
  const upcomingEvents = events.filter((event: EventWithDetails) => {
    try {
      // Get the date from either eventDate or event_date (snake_case from API)
      let eventDateValue = event.eventDate;
      if (!eventDateValue && event.event_date) {
        eventDateValue = event.event_date;
      }
      
      // Safely parse date
      const eventStartDate = eventDateValue instanceof Date 
        ? eventDateValue 
        : eventDateValue ? new Date(String(eventDateValue)) : null;
      
      const now = new Date();
      
      // Add logging to help debug any issues
      console.log('Upcoming filter - Event:', event.name, 
                  'Date raw:', eventDateValue, 
                  'Date parsed:', eventStartDate, 
                  'Now:', now, 
                  'Is Upcoming:', eventStartDate && eventStartDate >= now && event.status !== 'cancelled');
                  
      return eventStartDate && eventStartDate >= now && event.status !== 'cancelled';
    } catch (e) {
      console.error('Error filtering upcoming event:', event, e);
      return false;
    }
  }).sort((a: EventWithDetails, b: EventWithDetails) => {
    try {
      // Get dates from either camelCase or snake_case 
      const dateAValue = a.eventDate || a.event_date;
      const dateBValue = b.eventDate || b.event_date; 
      
      const dateA = dateAValue instanceof Date ? dateAValue : new Date(String(dateAValue));
      const dateB = dateBValue instanceof Date ? dateBValue : new Date(String(dateBValue));
      
      return dateA.getTime() - dateB.getTime();
    } catch (e) {
      console.error('Error sorting events:', a, b, e);
      return 0;
    }
  });

  const pastEvents = events.filter((event: EventWithDetails) => {
    try {
      // Get the date from either eventDate or event_date (snake_case from API)
      let eventDateValue = event.eventDate;
      if (!eventDateValue && event.event_date) {
        eventDateValue = event.event_date;
      }
      
      // Safely parse date
      const eventStartDate = eventDateValue instanceof Date 
        ? eventDateValue 
        : eventDateValue ? new Date(String(eventDateValue)) : null;
      
      const now = new Date();
      
      // Add logging to help debug any issues
      console.log('Past filter - Event:', event.name, 
                  'Date raw:', eventDateValue, 
                  'Date parsed:', eventStartDate, 
                  'Now:', now, 
                  'Is Past:', (eventStartDate && eventStartDate < now) || event.status === 'cancelled');
                  
      return (eventStartDate && eventStartDate < now) || event.status === 'cancelled';
    } catch (e) {
      console.error('Error filtering past event:', event, e);
      return false;
    }
  }).sort((a: EventWithDetails, b: EventWithDetails) => {
    try {
      // Get dates from either camelCase or snake_case 
      const dateAValue = a.eventDate || a.event_date;
      const dateBValue = b.eventDate || b.event_date; 
      
      const dateA = dateAValue instanceof Date ? dateAValue : new Date(String(dateAValue));
      const dateB = dateBValue instanceof Date ? dateBValue : new Date(String(dateBValue));
      
      return dateB.getTime() - dateA.getTime();
    } catch (e) {
      console.error('Error sorting events:', a, b, e);
      return 0;
    }
  });

  return {
    events,
    upcomingEvents,
    pastEvents,
    selectedEvent,
    setSelectedEventId,
    eventProposals,
    isLoading,
    isLoadingEvent,
    isLoadingProposals,
    error,
    createEvent,
    isCreating,
    updateEvent,
    isUpdating,
    cancelEvent,
    isCancelling,
    acceptProposal,
    isAcceptingProposal,
    rejectProposal,
    isRejectingProposal,
    refetchEvents, // Add refetch function to explicitly refresh data
  };
}