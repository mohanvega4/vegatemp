import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { 
  Plus, 
  Calendar as CalendarIcon,
  Search, 
  MoreHorizontal, 
  Filter, 
  ChevronDown,
  Loader2,
  ClipboardIcon,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomerEvents, EventWithDetails } from '@/hooks/use-customer-events';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { insertEventSchema, eventTypeEnum, eventVibeEnum, locationTypeEnum } from '@shared/schema';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Extend the event schema with additional validation
const eventSchema = insertEventSchema.extend({
  name: z.string().min(2, 'Event name must be at least 2 characters'),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  budget: z.coerce.number().positive('Budget must be a positive number'),
  eventDate: z.date({
    required_error: "Event date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function EventsManagement() {
  const { 
    events, 
    upcomingEvents, 
    pastEvents, 
    isLoading, 
    createEvent, 
    isCreating,
    cancelEvent,
    isCancelling,
    eventProposals,
    setSelectedEventId,
    acceptProposal,
    isAcceptingProposal,
    rejectProposal,
    isRejectingProposal,
    isLoadingProposals
  } = useCustomerEvents();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { toast } = useToast();
  
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      location: '',
      description: '',
      budget: "0", // must be string for the schema
      eventType: eventTypeEnum.enumValues[0],
      vibe: eventVibeEnum.enumValues[0],
      locationType: 'indoor',
      audienceSize: 0,
      eventDate: new Date(),
      endDate: new Date(),
      customerId: 0, // This will be set on the server
      status: 'pending',
    },
  });
  
  const onSubmit = (data: EventFormValues) => {
    // Ensure dates are properly formatted
    const eventDate = data.eventDate instanceof Date ? data.eventDate : new Date(data.eventDate);
    const endDate = data.endDate instanceof Date ? data.endDate : new Date(data.endDate);
    
    // Convert form data to match the API expectations
    createEvent({
      name: data.name,
      description: data.description,
      customerId: 0, // This will be overridden by the server
      status: 'pending',
      eventDate, // Send as Date object
      endDate, // Send as Date object
      location: data.location,
      eventType: data.eventType,
      vibe: data.vibe,
      locationType: data.locationType,
      audienceSize: data.audienceSize || 0,
      budget: data.budget ? data.budget.toString() : "0", // Ensure budget is a string
    });
    setIsCreateDialogOpen(false);
    form.reset();
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  // Filter events based on search query
  const filteredUpcomingEvents = upcomingEvents.filter(event => 
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredPastEvents = pastEvents.filter(event => 
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Function to render event status badge
  const renderStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-semibold">Events</h1>
          <p className="text-gray-500">Manage all your events in one place</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Fill in the details to create your new event.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Annual Company Retreat" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {eventTypeEnum.enumValues.map(type => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="vibe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Vibe</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vibe" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {eventVibeEnum.enumValues.map(vibe => (
                              <SelectItem key={vibe} value={vibe}>
                                {vibe.charAt(0).toUpperCase() + vibe.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Grand Hyatt Hotel, Dubai" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="locationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locationTypeEnum.enumValues.map(type => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="audienceSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Attendees</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Event Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget (USD)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your event..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Event
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search events..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <Filter className="h-4 w-4 mr-1" />
              Filter
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Filter By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>All Events</DropdownMenuItem>
            <DropdownMenuItem>Wedding</DropdownMenuItem>
            <DropdownMenuItem>Corporate</DropdownMenuItem>
            <DropdownMenuItem>Concert</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Past Events</DropdownMenuItem>
            <DropdownMenuItem>Upcoming Events</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming" className="flex items-center">
            Upcoming ({filteredUpcomingEvents.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center">
            Past ({filteredPastEvents.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center">
            All ({events.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          {filteredUpcomingEvents.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Upcoming Events</h3>
              <p className="mb-4">
                You don't have any upcoming events scheduled.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Event
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUpcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past">
          {filteredPastEvents.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Past Events</h3>
              <p>
                Your past events will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPastEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all">
          {events.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Events Found</h3>
              <p className="mb-4">
                You haven't created any events yet.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Event
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events
                .filter(event => 
                  event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  event.location.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              }
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface EventCardProps {
  event: EventWithDetails;
}

function EventCard({ event }: EventCardProps) {
  const { 
    cancelEvent, 
    isCancelling, 
    updateEvent, 
    isUpdating,
    setSelectedEventId,
    eventProposals,
    isLoadingProposals,
    acceptProposal,
    isAcceptingProposal,
    rejectProposal,
    isRejectingProposal
  } = useCustomerEvents();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [feedbackText, setFeedbackText] = useState('');
  
  // Set the selected event ID when opening the details dialog
  useEffect(() => {
    if (isViewDetailsOpen) {
      setSelectedEventId(event.id);
    }
  }, [isViewDetailsOpen, event.id, setSelectedEventId]);
  
  // Create a form for editing
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: event.name,
      location: event.location || '',
      description: event.description || '',
      budget: event.budget ? String(event.budget) : "0",
      eventType: event.eventType || eventTypeEnum.enumValues[0],
      vibe: event.vibe || eventVibeEnum.enumValues[0],
      locationType: event.locationType || 'indoor',
      audienceSize: event.audienceSize || 0,
      eventDate: event.eventDate ? new Date(event.eventDate) : new Date(),
      endDate: event.endDate ? new Date(event.endDate) : new Date(),
      customerId: event.customerId || 0,
      status: event.status,
    },
  });
  
  // Update the form values when the event changes
  useEffect(() => {
    if (event) {
      // Try to get date values safely
      let eventDateValue = event.eventDate || event.event_date;
      let endDateValue = event.endDate || event.end_date;
      
      form.reset({
        name: event.name,
        location: event.location || '',
        description: event.description || '',
        budget: event.budget ? String(event.budget) : "0",
        eventType: event.eventType || eventTypeEnum.enumValues[0],
        vibe: event.vibe || eventVibeEnum.enumValues[0],
        locationType: event.locationType || 'indoor',
        audienceSize: event.audienceSize || 0,
        eventDate: eventDateValue ? new Date(eventDateValue) : new Date(),
        endDate: endDateValue ? new Date(endDateValue) : new Date(),
        customerId: event.customerId || event.customer_id || 0,
        status: event.status,
      });
    }
  }, [event, form]);
  
  const onSubmit = (data: EventFormValues) => {
    // Convert form data to match the API expectations
    updateEvent({
      id: event.id,
      data: {
        name: data.name,
        description: data.description,
        customerId: event.customerId || event.customer_id || 0,
        status: data.status || 'pending',
        eventDate: data.eventDate instanceof Date ? data.eventDate.toISOString() : data.eventDate,
        endDate: data.endDate instanceof Date ? data.endDate.toISOString() : data.endDate,
        location: data.location,
        eventType: data.eventType,
        vibe: data.vibe,
        locationType: data.locationType,
        audienceSize: data.audienceSize || 0,
        budget: data.budget,
      }
    });
    
    setIsEditDialogOpen(false);
  };
  
  const formatDate = (dateValue: string | Date) => {
    if (!dateValue) return 'N/A';
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  const formatDateTime = (dateValue: string | Date) => {
    if (!dateValue) return 'N/A';
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  const handleCancelEvent = (id: number) => {
    if (confirm('Are you sure you want to cancel this event?')) {
      cancelEvent(id);
    }
  };

  // Function to render proposal items in a user-friendly table format
  const renderProposalItems = (items: any) => {
    // Parse items if it's a string
    let parsedItems;
    try {
      parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    } catch (e) {
      // If parsing fails, display the raw string
      return <pre className="text-xs p-3 whitespace-pre-wrap break-all">{items}</pre>;
    }
    
    // Check if parsedItems is an array
    if (!Array.isArray(parsedItems)) {
      return <pre className="text-xs p-3 whitespace-pre-wrap break-all">{JSON.stringify(parsedItems, null, 2)}</pre>;
    }
    
    // Render as a table if it's an array of items
    return (
      <div className="w-full">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {parsedItems.map((item: any, index: number) => (
              <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3">
                  <div className="font-medium">{item.name}</div>
                  {item.description && <div className="text-xs text-gray-500 mt-1">{item.description}</div>}
                </td>
                <td className="px-4 py-3 text-right">${Number(item.price).toFixed(2)}</td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right font-medium">
                  ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Get date values, trying to handle both camelCase and snake_case
  const displayDate = event.eventDate || event.event_date;
  const eventType = event.eventType || event.event_type;
  const audienceSize = event.audienceSize || event.audience_size;
  
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div className="space-y-1">
          <CardTitle>{event.name}</CardTitle>
          <div className="text-sm text-gray-500">{formatDate(displayDate)}</div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setIsViewDetailsOpen(true)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
              Edit Event
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => handleCancelEvent(event.id)}
              disabled={isCancelling || event.status === 'cancelled'}
              className="text-red-600"
            >
              Cancel Event
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div>
            <span className="text-gray-500">Type:</span>
            <p className="font-medium">{eventType || 'N/A'}</p>
          </div>
          <div>
            <span className="text-gray-500">Budget:</span>
            <p className="font-medium">${Number(event.budget || 0).toFixed(2)}</p>
          </div>
          <div>
            <span className="text-gray-500">Attendees:</span>
            <p className="font-medium">{audienceSize || 'N/A'}</p>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>
            <p className="font-medium">
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                event.status === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : event.status === 'confirmed'
                  ? 'bg-green-100 text-green-800'
                  : event.status === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1).replace('_', ' ')}
              </span>
            </p>
          </div>
        </div>
        <div className="flex justify-between items-end">
          <div className="text-sm">
            <p className="text-gray-500 font-medium mb-1">Location:</p>
            <p className="text-gray-700">{event.location || 'N/A'}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="text-primary border-primary/30 hover:bg-primary/10"
            onClick={() => {
              setSelectedEventId(event.id);
              setIsViewDetailsOpen(true);
              setActiveTab('proposals');
            }}
          >
            <FileText className="h-4 w-4 mr-1" />
            Proposals
          </Button>
        </div>
      </CardContent>
      
      {/* View Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              View the full details of your event.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="py-4">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="proposals">Proposals</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">{event.name}</h3>
                <p className="text-sm text-gray-500">ID: {event.id}</p>
              </div>
  
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Start Date</h4>
                  <p className="mt-1">{formatDateTime(event.eventDate || event.event_date)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">End Date</h4>
                  <p className="mt-1">{formatDateTime(event.endDate || event.end_date)}</p>
                </div>
              </div>
  
              <div>
                <h4 className="text-sm font-medium text-gray-500">Location</h4>
                <p className="mt-1">{event.location || 'Not specified'}</p>
                {event.locationType && (
                  <p className="text-sm text-gray-500 mt-1">
                    Type: {event.locationType.charAt(0).toUpperCase() + event.locationType.slice(1)}
                  </p>
                )}
              </div>
  
              {event.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Description</h4>
                  <p className="mt-1">{event.description}</p>
                </div>
              )}
  
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Type</h4>
                  <p className="mt-1">
                    {eventType ? eventType.charAt(0).toUpperCase() + eventType.slice(1).replace('_', ' ') : 'Not specified'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Vibe</h4>
                  <p className="mt-1">
                    {event.vibe ? event.vibe.charAt(0).toUpperCase() + event.vibe.slice(1).replace('_', ' ') : 'Not specified'}
                  </p>
                </div>
              </div>
  
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Budget</h4>
                  <p className="mt-1">${Number(event.budget || 0).toFixed(2)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <p className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      event.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : event.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : event.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1).replace('_', ' ')}
                    </span>
                  </p>
                </div>
              </div>
  
              <div>
                <h4 className="text-sm font-medium text-gray-500">Audience Size</h4>
                <p className="mt-1">{audienceSize || 'Not specified'}</p>
              </div>
  
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Created</h4>
                  <p className="mt-1">{formatDate(event.createdAt || event.created_at)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
                  <p className="mt-1">{formatDate(event.updatedAt || event.updated_at)}</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="proposals">
              <div>
                <h3 className="text-lg font-semibold mb-4">Event Proposals</h3>
                
                {isLoadingProposals ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : eventProposals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ClipboardIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">No Proposals Yet</h3>
                    <p className="max-w-md mx-auto">
                      There are no proposals for this event yet. Our team will create proposals based on your event details.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {eventProposals.map((proposal: any) => (
                      <Card key={proposal.id} className="overflow-hidden">
                        <CardHeader className="pb-2 bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div>
                              <CardTitle className="text-lg">{proposal.title}</CardTitle>
                              <p className="text-sm text-gray-500">ID: {proposal.id}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              proposal.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : proposal.status === 'accepted'
                                ? 'bg-green-100 text-green-800'
                                : proposal.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-4">
                            <p className="text-sm">{proposal.description}</p>
                            
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-2">Proposal Items</h4>
                              <div className="bg-white border border-gray-100 rounded-md overflow-hidden">
                                {proposal.items && renderProposalItems(proposal.items)}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Total Price</h4>
                                <p className="text-lg font-semibold">${Number(proposal.totalPrice).toFixed(2)}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Valid Until</h4>
                                <p>{proposal.validUntil ? formatDate(proposal.validUntil) : 'N/A'}</p>
                              </div>
                            </div>
                            
                            {proposal.feedback && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Your Feedback</h4>
                                <p className="text-sm italic bg-gray-50 p-2 rounded-md">{proposal.feedback}</p>
                              </div>
                            )}
                            
                            {proposal.status === 'pending' && (
                              <div className="flex gap-3 mt-4 justify-end">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                      Reject
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                      <DialogTitle>Reject Proposal</DialogTitle>
                                      <DialogDescription>
                                        Please provide feedback about why you're rejecting this proposal.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                      <div className="grid gap-2">
                                        <Label htmlFor="feedback">Feedback (required)</Label>
                                        <Textarea 
                                          id="feedback" 
                                          placeholder="Please explain why this proposal doesn't meet your needs..."
                                          className="min-h-[100px]"
                                          value={feedbackText}
                                          onChange={(e) => setFeedbackText(e.target.value)}
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button
                                        type="submit"
                                        variant="destructive"
                                        onClick={() => {
                                          if (feedbackText.trim().length > 0) {
                                            rejectProposal({ 
                                              proposalId: proposal.id, 
                                              feedback: feedbackText 
                                            });
                                            setFeedbackText(''); // Clear feedback after submitting
                                          } else {
                                            toast({
                                              title: "Feedback Required",
                                              description: "Please provide feedback before rejecting the proposal.",
                                              variant: "destructive"
                                            });
                                          }
                                        }}
                                      >
                                        Reject Proposal
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                                
                                <Button 
                                  size="sm"
                                  className="bg-primary text-white"
                                  onClick={() => acceptProposal({ proposalId: proposal.id })}
                                  disabled={isAcceptingProposal}
                                >
                                  {isAcceptingProposal ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Processing
                                    </>
                                  ) : (
                                    'Accept'
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button onClick={() => setIsViewDetailsOpen(false)}>
              Close
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsViewDetailsOpen(false);
                setIsEditDialogOpen(true);
              }}
            >
              Edit Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update the details of your event. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eventTypeEnum.enumValues.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter budget"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vibe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Vibe</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event vibe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eventVibeEnum.enumValues.map((vibe) => (
                            <SelectItem key={vibe} value={vibe}>
                              {vibe.replace('_', ' ').charAt(0).toUpperCase() + vibe.replace('_', ' ').slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="locationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="indoor">Indoor</SelectItem>
                          <SelectItem value="outdoor">Outdoor</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="audienceSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Audience Size</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Number of attendees"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your event" 
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}