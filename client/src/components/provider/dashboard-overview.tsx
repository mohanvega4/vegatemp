import { useEffect } from 'react';
import { 
  BarChart, 
  CalendarDays, 
  Clock, 
  DollarSign, 
  Eye, 
  MessageSquare, 
  Star, 
  Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useProviderProfile } from '@/hooks/use-provider-profile';
import { useProviderBookings } from '@/hooks/use-provider-bookings';
import { useProviderReviews } from '@/hooks/use-provider-reviews';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardOverview() {
  const { user } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProviderProfile();
  const { pendingBookings, pendingCount, confirmedBookings, isLoading: isBookingsLoading } = useProviderBookings();
  const { reviews, averageRating, reviewCount, isLoading: isReviewsLoading, error } = useProviderReviews();
  
  // Add console logs for debugging
  console.log("Provider ID:", user?.id);
  console.log("Reviews data:", reviews);
  console.log("Reviews error:", error);
  console.log("Reviews loading:", isReviewsLoading);
  
  const isLoading = isProfileLoading || isBookingsLoading || isReviewsLoading;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // For the welcome greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
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
        <h1 className="text-2xl font-semibold">{getGreeting()}, {user?.name}</h1>
        <p className="text-gray-500 mt-1">Here's an overview of your provider activity</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <Eye className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Profile Views</p>
              <h3 className="text-xl font-semibold">{profile?.profile.viewCount || 0}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Pending Bookings</p>
              <h3 className="text-xl font-semibold">{pendingCount}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Revenue (Last 30 Days)</p>
              <h3 className="text-xl font-semibold">$0</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <Star className="h-6 w-6 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Average Rating</p>
              <h3 className="text-xl font-semibold">
                {averageRating ? averageRating.toFixed(1) : 'N/A'}
                {averageRating > 0 && <span className="text-sm text-gray-500 ml-1">({reviewCount})</span>}
              </h3>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upcoming Bookings */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium mb-4">Upcoming Bookings</h2>
        
        {pendingBookings.length === 0 && confirmedBookings.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <CalendarDays className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No Upcoming Bookings</h3>
            <p className="mb-4">
              You'll see your upcoming bookings here once customers start booking your services.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingBookings.length > 0 && (
              <>
                <h3 className="font-medium text-amber-600">Pending Confirmation ({pendingBookings.length})</h3>
                <div className="divide-y">
                  {pendingBookings.slice(0, 3).map((booking) => (
                    <div key={booking.booking.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{booking.event.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(booking.booking.startTime?.toString() || '')} - Customer: {booking.customer.name}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                          Decline
                        </Button>
                        <Button size="sm" className="bg-primary text-white">
                          Accept
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {confirmedBookings.length > 0 && (
              <>
                <h3 className="font-medium text-green-600 mt-6">Confirmed Bookings ({confirmedBookings.length})</h3>
                <div className="divide-y">
                  {confirmedBookings.slice(0, 3).map((booking) => (
                    <div key={booking.booking.id} className="py-3">
                      <p className="font-medium">{booking.event.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(booking.booking.startTime?.toString() || '')} - Customer: {booking.customer.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Location: {booking.event.location}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {(pendingBookings.length > 3 || confirmedBookings.length > 3) && (
              <div className="mt-4 text-center">
                <Button variant="link">View All Bookings</Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Recent Reviews */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium mb-4">Recent Reviews</h2>
        
        {isReviewsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reviews && reviews.length > 0 ? (
          <div className="space-y-4 divide-y">
            {reviews.slice(0, 3).map((reviewData) => (
              <div key={reviewData.review.id} className="pt-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {reviewData.customer.avatarUrl ? (
                        <img 
                          src={reviewData.customer.avatarUrl} 
                          alt={reviewData.customer.name}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <span className="text-gray-500 text-sm">
                          {reviewData.customer.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{reviewData.customer.name}</p>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < reviewData.review.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-xs text-gray-500">
                        {reviewData.review.createdAt && typeof reviewData.review.createdAt === 'string' 
                          ? new Date(reviewData.review.createdAt).toLocaleDateString() 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">{reviewData.review.comment}</p>
              </div>
            ))}
            
            {reviews.length > 3 && (
              <div className="mt-4 text-center pt-4">
                <Button variant="link">View All Reviews</Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No Reviews Yet</h3>
            <p>
              Reviews from your clients will appear here after they rate your services.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}