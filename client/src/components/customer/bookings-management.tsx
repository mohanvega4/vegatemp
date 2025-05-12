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
import { useCustomerBookings, BookingWithDetails } from '@/hooks/use-customer-bookings';
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
  DialogTrigger,
} from '@/components/ui/dialog';

export default function BookingsManagement() {
  const { 
    bookings, 
    pendingBookings, 
    confirmedBookings, 
    completedBookings, 
    cancelledBookings,
    isLoading, 
    cancelBooking,
    isCancelling,
    selectedBooking,
    setSelectedBookingId,
  } = useCustomerBookings();
  
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<BookingWithDetails | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
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
  
  const handleCancelBooking = (id: number) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      cancelBooking(id);
    }
  };
  
  const viewBookingDetails = (booking: BookingWithDetails) => {
    setSelectedBookingDetails(booking);
    setIsDetailsDialogOpen(true);
  };
  
  // Filter bookings based on search query
  const filterBookings = (bookingsList: BookingWithDetails[]) => {
    return bookingsList.filter(booking => 
      booking.service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.service.providerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlarmClock className="h-4 w-4 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
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
        <h1 className="text-2xl font-semibold">Bookings</h1>
        <p className="text-gray-500">Manage all your service provider bookings in one place</p>
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
            <DropdownMenuItem onClick={() => setActiveTab('all')}>All Bookings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveTab('pending')}>Pending</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveTab('confirmed')}>Confirmed</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveTab('completed')}>Completed</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveTab('cancelled')}>Cancelled</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="all" className="flex items-center">
            All ({bookings.length})
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
                You haven't made any bookings yet.
              </p>
              <Button>Browse Service Providers</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterBookings(bookings).map((booking) => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking} 
                  onCancel={handleCancelBooking}
                  onViewDetails={viewBookingDetails}
                  isCancelling={isCancelling}
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
              {filterBookings(pendingBookings).map((booking) => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking} 
                  onCancel={handleCancelBooking}
                  onViewDetails={viewBookingDetails}
                  isCancelling={isCancelling}
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
              {filterBookings(confirmedBookings).map((booking) => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking} 
                  onCancel={handleCancelBooking}
                  onViewDetails={viewBookingDetails}
                  isCancelling={isCancelling}
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
              {filterBookings(completedBookings).map((booking) => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking} 
                  onCancel={handleCancelBooking}
                  onViewDetails={viewBookingDetails}
                  isCancelling={isCancelling}
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
                You don't have any cancelled bookings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterBookings(cancelledBookings).map((booking) => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking} 
                  onCancel={handleCancelBooking}
                  onViewDetails={viewBookingDetails}
                  isCancelling={isCancelling}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Booking Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          
          {selectedBookingDetails && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{selectedBookingDetails.service.title}</h3>
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="text-gray-600">Provider: {selectedBookingDetails.service.providerName}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Event</p>
                  <p className="font-medium">{selectedBookingDetails.event.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <div className="flex items-center">
                    {getStatusIcon(selectedBookingDetails.status)}
                    <span className={`ml-1 ${
                      selectedBookingDetails.status === 'pending' 
                        ? 'text-yellow-600' 
                        : selectedBookingDetails.status === 'confirmed'
                        ? 'text-green-600'
                        : selectedBookingDetails.status === 'completed'
                        ? 'text-blue-600'
                        : 'text-red-600'
                    }`}>
                      {selectedBookingDetails.status.charAt(0).toUpperCase() + selectedBookingDetails.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date</p>
                  <p className="font-medium">{formatDate(selectedBookingDetails.startTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Time</p>
                  <p className="font-medium">{formatTime(selectedBookingDetails.startTime)}</p>
                </div>
                
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="font-medium">{selectedBookingDetails.event.location}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Price</p>
                  <p className="font-medium">${selectedBookingDetails.totalPrice ? Number(selectedBookingDetails.totalPrice).toFixed(2) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Service Category</p>
                  <p className="font-medium">{selectedBookingDetails.service.serviceCategory}</p>
                </div>
              </div>
              
              {selectedBookingDetails.notes && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-500 mb-1">Notes</p>
                  <p className="text-sm">{selectedBookingDetails.notes}</p>
                </div>
              )}
              
              <DialogFooter className="flex justify-end space-x-2 pt-4 border-t">
                {selectedBookingDetails.status === 'pending' && (
                  <Button 
                    variant="destructive" 
                    onClick={() => handleCancelBooking(selectedBookingDetails.id)}
                    disabled={isCancelling}
                  >
                    {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cancel Booking
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setIsDetailsDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface BookingCardProps {
  booking: BookingWithDetails;
  onCancel: (id: number) => void;
  onViewDetails: (booking: BookingWithDetails) => void;
  isCancelling: boolean;
}

function BookingCard({ booking, onCancel, onViewDetails, isCancelling }: BookingCardProps) {
  const formatDate = (dateString: Date | string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base">{booking.service.title}</CardTitle>
          <CardDescription>
            {booking.event.name}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(booking)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {booking.status === 'pending' && (
              <DropdownMenuItem
                onClick={() => onCancel(booking.id)}
                disabled={isCancelling}
                className="text-red-600"
              >
                Cancel Booking
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-gray-700 truncate">{booking.event.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-gray-700">{formatDate(booking.startTime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-gray-700">{booking.service.providerName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-gray-700">${booking.totalPrice ? Number(booking.totalPrice).toFixed(2) : 'N/A'}</span>
          </div>
        </div>
        <div className="mt-2">
          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClasses(booking.status)}`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={() => onViewDetails(booking)}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}