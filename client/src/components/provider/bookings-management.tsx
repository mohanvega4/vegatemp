import { useState } from 'react';
import { 
  Search,
  Filter,
  ChevronDown,
  Loader2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlarmClock,
  MapPin,
  User,
  DollarSign,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProviderBookings } from '@/hooks/use-provider-bookings';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Booking } from '@shared/schema';

// Provider booking card component
function BookingCard({ 
  bookingDetails, 
  onAccept, 
  onDecline,
  onViewDetails,
  isUpdating
}: { 
  bookingDetails: any, 
  onAccept: (id: number) => void, 
  onDecline: (id: number) => void,
  onViewDetails: (details: any) => void,
  isUpdating: boolean
}) {
  const { booking, event, customer, service } = bookingDetails;
  
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  const formatTime = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'confirmed':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Confirmed</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Cancelled</span>;
      case 'declined':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Declined</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <CardTitle className="text-lg">{event.name}</CardTitle>
            {service && (
              <span className="text-sm text-primary-500 font-medium mt-0.5">
                Service: {service.title}
              </span>
            )}
          </div>
          {getStatusBadge(booking.status)}
        </div>
        <CardDescription>
          <div className="flex items-center mt-1">
            <MapPin className="h-4 w-4 mr-1 text-gray-500" />
            <span>{event.location || 'Location not specified'}</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-3">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-500" />
            <span className="font-medium">Customer:</span>
            <span className="ml-2">{customer.name}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span className="font-medium">Date:</span>
            <span className="ml-2">{formatDate(booking.startTime)}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span className="font-medium">Time:</span>
            <span className="ml-2">{formatTime(booking.startTime)}</span>
          </div>
          {booking.agreePrice && (
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
              <span className="font-medium">Price:</span>
              <span className="ml-2">${booking.agreePrice}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        {booking.status === 'pending' ? (
          <>
            <Button 
              variant="outline" 
              className="text-red-600 border-red-200 hover:bg-red-50" 
              onClick={() => onDecline(booking.id)}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Decline
            </Button>
            <Button 
              onClick={() => onAccept(booking.id)}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Accept
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={() => onViewDetails(bookingDetails)}>
              View Details
            </Button>
            {booking.status === 'confirmed' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Actions <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Mark as Completed</DropdownMenuItem>
                  <DropdownMenuItem>Contact Customer</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}

// Provider bookings management component
export default function BookingsManagement() {
  const { user } = useAuth();
  
  // Add debug logging for current user
  console.log("BookingsManagement - Current user:", user?.id, user?.username);
  
  const { 
    bookings, 
    pendingBookings, 
    confirmedBookings, 
    completedBookings, 
    cancelledBookings,
    isLoading, 
    updateBookingStatus,
    isUpdating,
    error
  } = useProviderBookings();
  
  // Debug logging for bookings data
  console.log("BookingsManagement - Provider bookings data:", { 
    bookingsCount: bookings.length,
    pendingCount: pendingBookings.length,
    isLoading,
    error
  });
  
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<any | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  const handleAcceptBooking = (id: number) => {
    updateBookingStatus({ bookingId: id, status: 'confirmed' });
  };
  
  const handleDeclineBooking = (id: number) => {
    if (confirm('Are you sure you want to decline this booking?')) {
      updateBookingStatus({ bookingId: id, status: 'declined' });
    }
  };
  
  const viewBookingDetails = (bookingDetails: any) => {
    setSelectedBookingDetails(bookingDetails);
    setIsDetailsDialogOpen(true);
  };
  
  // Filter bookings based on search query
  const filterBookings = (bookingsList: any[]) => {
    return bookingsList.filter(item => 
      item.event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.service?.title && item.service.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customer.email.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div>
        <h1 className="text-2xl font-semibold">Manage Bookings</h1>
        <p className="text-gray-500">View and manage all your service bookings from customers</p>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search bookings..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all" className="flex items-center">
            All Bookings ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center">
            Pending ({pendingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="flex items-center">
            Confirmed ({confirmedBookings.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center">
            Completed ({completedBookings.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex items-center">
            Cancelled ({cancelledBookings.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {bookings.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Bookings Found</h3>
              <p className="mb-4">
                You don't have any bookings yet. Bookings will appear here when customers book your services.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterBookings(bookings).map((bookingItem) => (
                <BookingCard 
                  key={bookingItem.booking.id} 
                  bookingDetails={bookingItem} 
                  onAccept={handleAcceptBooking}
                  onDecline={handleDeclineBooking}
                  onViewDetails={viewBookingDetails}
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending">
          {pendingBookings.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <AlarmClock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Pending Bookings</h3>
              <p>
                You don't have any bookings awaiting confirmation.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterBookings(pendingBookings).map((bookingItem) => (
                <BookingCard 
                  key={bookingItem.booking.id} 
                  bookingDetails={bookingItem} 
                  onAccept={handleAcceptBooking}
                  onDecline={handleDeclineBooking}
                  onViewDetails={viewBookingDetails}
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="confirmed">
          {confirmedBookings.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Confirmed Bookings</h3>
              <p>
                You don't have any confirmed bookings yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterBookings(confirmedBookings).map((bookingItem) => (
                <BookingCard 
                  key={bookingItem.booking.id} 
                  bookingDetails={bookingItem} 
                  onAccept={handleAcceptBooking}
                  onDecline={handleDeclineBooking}
                  onViewDetails={viewBookingDetails}
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {completedBookings.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Completed Bookings</h3>
              <p>
                You don't have any completed bookings yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterBookings(completedBookings).map((bookingItem) => (
                <BookingCard 
                  key={bookingItem.booking.id} 
                  bookingDetails={bookingItem} 
                  onAccept={handleAcceptBooking}
                  onDecline={handleDeclineBooking}
                  onViewDetails={viewBookingDetails}
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="cancelled">
          {cancelledBookings.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <XCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Cancelled Bookings</h3>
              <p>
                You don't have any cancelled or declined bookings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterBookings(cancelledBookings).map((bookingItem) => (
                <BookingCard 
                  key={bookingItem.booking.id} 
                  bookingDetails={bookingItem} 
                  onAccept={handleAcceptBooking}
                  onDecline={handleDeclineBooking}
                  onViewDetails={viewBookingDetails}
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Booking Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              View the complete details for this booking.
            </DialogDescription>
          </DialogHeader>
          {selectedBookingDetails && (
            <div className="space-y-4 py-2">
              <div>
                <h3 className="font-medium text-base">Event Information</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-sm">
                    <p className="text-gray-500">Event Name</p>
                    <p className="font-medium">{selectedBookingDetails.event.name}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-500">Location</p>
                    <p className="font-medium">{selectedBookingDetails.event.location}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-base">Service Information</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-sm">
                    <p className="text-gray-500">Service Title</p>
                    <p className="font-medium">{selectedBookingDetails.service?.title || 'Not specified'}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-500">Category</p>
                    <p className="font-medium capitalize">{selectedBookingDetails.service?.serviceCategory || 'Not specified'}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-500">Base Price</p>
                    <p className="font-medium">${selectedBookingDetails.service?.basePrice || 'Not available'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-base">Customer Information</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-sm">
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium">{selectedBookingDetails.customer.name}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">{selectedBookingDetails.customer.email}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-base">Booking Details</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-sm">
                    <p className="text-gray-500">Status</p>
                    <p className="font-medium capitalize">{selectedBookingDetails.booking.status}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-500">Price</p>
                    <p className="font-medium">${selectedBookingDetails.booking.agreePrice}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-500">Booking ID</p>
                    <p className="font-medium">{selectedBookingDetails.booking.id}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-500">Booked On</p>
                    <p className="font-medium">
                      {new Date(selectedBookingDetails.booking.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              {selectedBookingDetails.booking.specialInstructions && (
                <div>
                  <h3 className="font-medium text-base">Special Instructions</h3>
                  <p className="text-sm mt-1">
                    {selectedBookingDetails.booking.specialInstructions}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}