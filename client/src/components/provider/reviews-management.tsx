import { Loader2, Star as StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProviderReviews } from "@/hooks/use-provider-reviews";

export default function ReviewsManagement() {
  const { reviews, averageRating, reviewCount, isLoading: isReviewsLoading } = useProviderReviews();
  
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Reviews & Ratings</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-xl font-medium">Customer Reviews</h2>
            <p className="text-gray-500">See what customers are saying about your services</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center">
            <div className="flex items-center mr-3">
              {[...Array(5)].map((_, i) => (
                <StarIcon 
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.round(averageRating || 0)
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-gray-300'
                  }`} 
                />
              ))}
            </div>
            <span className="font-medium">{averageRating ? averageRating.toFixed(1) : '0.0'}</span>
            <span className="text-gray-500 ml-1">({reviewCount} reviews)</span>
          </div>
        </div>
        
        {isReviewsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <StarIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No Reviews Yet</h3>
            <p>
              You haven't received any reviews yet. They will appear here once customers leave feedback.
            </p>
          </div>
        ) : (
          <div className="space-y-4 divide-y">
            {reviews.map((reviewData) => (
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
                        <StarIcon
                          key={i}
                          className={`h-4 w-4 ${
                            i < reviewData.review.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-xs text-gray-500">
                        {typeof reviewData.review.createdAt === 'string' 
                          ? new Date(reviewData.review.createdAt).toLocaleDateString() 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">{reviewData.review.comment}</p>
                
                {reviewData.review.providerResponse && (
                  <div className="mt-3 ml-12 p-3 bg-gray-50 rounded-md">
                    <p className="text-xs font-medium text-gray-500">Your Response:</p>
                    <p className="text-sm">{reviewData.review.providerResponse}</p>
                  </div>
                )}
                
                {!reviewData.review.providerResponse && (
                  <div className="mt-3 ml-12">
                    <Button size="sm" variant="outline">Reply</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}