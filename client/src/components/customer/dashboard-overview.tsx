import { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  LucideCreditCard,
  Users, 
  PlusCircle, 
  CalendarDays, 
  Search,
  ChevronRight, 
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useCustomerEvents } from '@/hooks/use-customer-events';
import { useCustomerBookings } from '@/hooks/use-customer-bookings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { eventTypeEnum, eventVibeEnum } from '@shared/schema';

export default function CustomerDashboardOverview() {
  const { user } = useAuth();
  const { upcomingEvents, pastEvents, isLoading: isLoadingEvents } = useCustomerEvents();
  const { pendingBookings, confirmedBookings, isLoading: isLoadingBookings } = useCustomerBookings();
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const isLoading = isLoadingEvents || isLoadingBookings;

  // Dummy event creation (this would typically submit to the API)
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation would go here
    setCreateEventDialogOpen(false);
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
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {user?.name}</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your events</p>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Dialog open={createEventDialogOpen} onOpenChange={setCreateEventDialogOpen}>
            <DialogTrigger asChild>
              <button className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 flex flex-col items-center justify-center text-center">
                <PlusCircle className="h-8 w-8 text-primary mb-2" />
                <span className="text-sm font-medium">Create New Event</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Fill in the details to create your new event.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateEvent}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="event-name" className="text-right">
                      Event Name
                    </Label>
                    <Input id="event-name" placeholder="My Event" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="event-type" className="text-right">
                      Event Type
                    </Label>
                    <Select required>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypeEnum.enumValues.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="event-date" className="text-right">
                      Date
                    </Label>
                    <Input 
                      id="event-date" 
                      type="date" 
                      className="col-span-3"
                      required
                      min={new Date().toISOString().split('T')[0]} 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="event-location" className="text-right">
                      Location
                    </Label>
                    <Input id="event-location" placeholder="Event location" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="event-budget" className="text-right">
                      Budget
                    </Label>
                    <Input id="event-budget" type="number" placeholder="0.00" className="col-span-3" required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Event</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <button className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 flex flex-col items-center justify-center text-center">
            <Search className="h-8 w-8 text-primary mb-2" />
            <span className="text-sm font-medium">Find Providers</span>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 flex flex-col items-center justify-center text-center">
            <LucideCreditCard className="h-8 w-8 text-primary mb-2" />
            <span className="text-sm font-medium">Manage Payments</span>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 flex flex-col items-center justify-center text-center">
            <Users className="h-8 w-8 text-primary mb-2" />
            <span className="text-sm font-medium">Edit Profile</span>
          </button>
        </div>
      </div>
      

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length + pastEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingEvents.length} upcoming • {pastEvents.length} past
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBookings.length + confirmedBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingBookings.length} pending • {confirmedBookings.length} confirmed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">
              $0.00 this month
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Upcoming Events */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Upcoming Events</h2>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
        
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <CalendarDays className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No Upcoming Events</h3>
            <p className="mb-4">You don't have any upcoming events scheduled.</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Create Your First Event</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>
                    Fill in the event details below to get started.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Event Name
                    </Label>
                    <Input id="name" placeholder="My Event" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">
                      Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="location" className="text-right">
                      Location
                    </Label>
                    <Input id="location" placeholder="Location" className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Event</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="divide-y">
            {upcomingEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-base">{event.name}</h3>
                  <div className="flex space-x-4 text-sm text-gray-500 mt-1">
                    <p>{formatDate(event.startDate)}</p>
                    <p>{event.location}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Recent Bookings */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Recent Bookings</h2>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
        
        {pendingBookings.length === 0 && confirmedBookings.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No Bookings Yet</h3>
            <p className="mb-4">You haven't booked any services yet.</p>
            <Button onClick={() => window.location.hash = "marketplace"}>Browse Service Providers</Button>
          </div>
        ) : (
          <div className="divide-y">
            {[...pendingBookings, ...confirmedBookings].slice(0, 3).map((booking) => (
              <div key={booking.id} className="py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-base">{booking.service.title}</h3>
                  <div className="flex space-x-4 text-sm text-gray-500 mt-1">
                    <p>Provider: {booking.service.providerName}</p>
                    <p>Event: {booking.event.name}</p>
                  </div>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      booking.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}