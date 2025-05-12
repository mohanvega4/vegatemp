import { useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Star, 
  MapPin, 
  Tag, 
  Info, 
  Calendar, 
  CheckCircle,
  Loader2,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMarketplace, MarketplaceService } from '@/hooks/use-marketplace';
import { useCustomerEvents } from '@/hooks/use-customer-events';
import { useCustomerBookings } from '@/hooks/use-customer-bookings';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function Marketplace() {
  const { 
    services, 
    servicesByType, 
    isLoading, 
    filters, 
    setFilters, 
    availableTypes, 
    availableCategories 
  } = useMarketplace();
  
  const { upcomingEvents } = useCustomerEvents();
  const { createBooking, isCreating } = useCustomerBookings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<MarketplaceService | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  
  // Form state for booking
  const [bookingData, setBookingData] = useState({
    eventId: '',
    startTime: '',
    date: '',
    notes: ''
  });
  
  // Filter services based on search query
  const filteredServices = services.filter(service => {
    const matchesQuery = 
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.provider.name.toLowerCase().includes(searchQuery.toLowerCase());
      
    // Apply other filters
    const matchesType = !filters.type || filters.type === "all" || service.serviceType === filters.type;
    const matchesCategory = !filters.category || filters.category === "all" || service.serviceCategory === filters.category;
    const matchesPrice = 
      (!filters.minPrice || parseFloat(service.basePrice) >= filters.minPrice) &&
      (!filters.maxPrice || parseFloat(service.basePrice) <= filters.maxPrice);
    const matchesRating = !filters.rating || (typeof filters.rating === 'string' && filters.rating === "any") || service.provider.rating >= filters.rating;
    const matchesVerified = !filters.verified || service.provider.verified;
    
    return matchesQuery && matchesType && matchesCategory && matchesPrice && matchesRating && matchesVerified;
  });
  
  // Dummy values for demo
  const priceRange = [0, 1000];
  
  const resetFilters = () => {
    setFilters({});
  };
  
  const openBookingModal = (service: MarketplaceService) => {
    setSelectedService(service);
    // Reset booking form
    setBookingData({
      eventId: '',
      startTime: '',
      date: '',
      notes: ''
    });
    setIsBookingModalOpen(true);
  };
  
  const handleBookingSubmit = () => {
    if (!selectedService || !bookingData.eventId || !bookingData.date || !bookingData.startTime) {
      return;
    }
    
    // Combine date and time into ISO format for startTime
    const startTimeISO = new Date(`${bookingData.date}T${bookingData.startTime}`).toISOString();
    
    const bookingRequest = {
      eventId: parseInt(bookingData.eventId),
      serviceId: selectedService.id,
      providerId: selectedService.provider.id,
      startTime: startTimeISO,
      status: 'pending',
      notes: bookingData.notes || '',
      totalPrice: selectedService.basePrice
    };
    
    createBooking(bookingRequest, {
      onSuccess: () => {
        setIsBookingModalOpen(false);
      }
    });
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
        <h1 className="text-2xl font-semibold">Service Marketplace</h1>
        <p className="text-gray-500">Find and book the perfect service providers for your events</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search services, providers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1 sm:w-auto w-full">
              <Filter className="h-4 w-4 mr-1" />
              Filters
              {Object.keys(filters).length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {Object.keys(filters).length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Filter Services</SheetTitle>
              <SheetDescription>
                Narrow down your search with specific filters
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-4 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Service Type</Label>
                <Select 
                  value={filters.type || ''} 
                  onValueChange={(value) => setFilters({ ...filters, type: value === "all" ? "all" : (value || undefined) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {availableTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Category</Label>
                <Select 
                  value={filters.category || ''} 
                  onValueChange={(value) => setFilters({ ...filters, category: value === "all" ? "all" : (value || undefined) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {availableCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">Price Range</Label>
                <div className="flex items-center space-x-4">
                  <Input 
                    type="number" 
                    placeholder="Min" 
                    value={filters.minPrice || ''} 
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      minPrice: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                  />
                  <span>to</span>
                  <Input 
                    type="number" 
                    placeholder="Max" 
                    value={filters.maxPrice || ''} 
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      maxPrice: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">Provider Rating</Label>
                <RadioGroup 
                  value={filters.rating?.toString() || ''} 
                  onValueChange={(value) => setFilters({ 
                    ...filters, 
                    rating: value === "any" ? "any" : (value ? parseInt(value) : undefined)
                  })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="any" id="rating-any" />
                    <Label htmlFor="rating-any">Any rating</Label>
                  </div>
                  {[4, 3, 2].map(rating => (
                    <div key={rating} className="flex items-center space-x-2">
                      <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                      <Label htmlFor={`rating-${rating}`} className="flex items-center">
                        {rating}+ Stars
                        <div className="ml-2 flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="verified" 
                    checked={!!filters.verified} 
                    onChange={(e) => setFilters({ ...filters, verified: e.target.checked || undefined })}
                  />
                  <Label htmlFor="verified" className="flex items-center">
                    Verified providers only
                    <CheckCircle className="ml-1 h-4 w-4 text-blue-500" />
                  </Label>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
                <Button onClick={() => setIsFilterSheetOpen(false)}>Apply Filters</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1 sm:w-auto w-full">
              <Sliders className="h-4 w-4 mr-1" />
              Sort
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Price: Low to High</DropdownMenuItem>
            <DropdownMenuItem>Price: High to Low</DropdownMenuItem>
            <DropdownMenuItem>Rating: High to Low</DropdownMenuItem>
            <DropdownMenuItem>Most Popular</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Filters sidebar on desktop - hidden on mobile */}
        <div className="hidden md:block col-span-1 bg-white p-5 rounded-lg shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-medium mb-4">Filters</h2>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Service Type</h3>
              <Select 
                value={filters.type || ''} 
                onValueChange={(value) => setFilters({ ...filters, type: value === "all" ? "all" : (value || undefined) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {availableTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Category</h3>
              <Select 
                value={filters.category || ''} 
                onValueChange={(value) => setFilters({ ...filters, category: value === "all" ? "all" : (value || undefined) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {availableCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Price Range</h3>
              <div className="pt-2">
                <Slider 
                  defaultValue={[priceRange[0], priceRange[1]]} 
                  max={priceRange[1]} 
                  step={10}
                  onValueChange={(value) => {
                    setFilters({ 
                      ...filters, 
                      minPrice: value[0], 
                      maxPrice: value[1] 
                    });
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>${filters.minPrice || priceRange[0]}</span>
                  <span>${filters.maxPrice || priceRange[1]}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Provider Rating</h3>
              <RadioGroup 
                value={filters.rating?.toString() || ''} 
                onValueChange={(value) => setFilters({ 
                  ...filters, 
                  rating: value === "any" ? "any" : (value ? parseInt(value) : undefined)
                })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="any" id="d-rating-any" />
                  <Label htmlFor="d-rating-any">Any rating</Label>
                </div>
                {[4, 3, 2].map(rating => (
                  <div key={rating} className="flex items-center space-x-2">
                    <RadioGroupItem value={rating.toString()} id={`d-rating-${rating}`} />
                    <Label htmlFor={`d-rating-${rating}`} className="flex items-center">
                      {rating}+ Stars
                      <div className="ml-2 flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="d-verified" 
                  checked={!!filters.verified} 
                  onChange={(e) => setFilters({ ...filters, verified: e.target.checked || undefined })}
                />
                <Label htmlFor="d-verified" className="flex items-center">
                  Verified providers only
                  <CheckCircle className="ml-1 h-4 w-4 text-blue-500" />
                </Label>
              </div>
            </div>
            
            <Separator />
            
            <Button variant="outline" onClick={resetFilters} className="w-full">Reset Filters</Button>
          </div>
        </div>
        
        {/* Service Listings */}
        <div className="col-span-1 md:col-span-2">
          {filteredServices.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
              <Info className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Services Found</h3>
              <p className="text-gray-500 mb-4">
                We couldn't find any services matching your criteria. Try adjusting your filters or search query.
              </p>
              <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(servicesByType).map(([type, typeServices]) => {
                // Skip if no services of this type match the filters
                const matchingServices = typeServices.filter(service => filteredServices.some(fs => fs.id === service.id));
                if (matchingServices.length === 0) return null;
                
                return (
                  <div key={type} className="space-y-4">
                    <h2 className="text-lg font-medium">
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')} 
                      <span className="text-gray-500 text-sm ml-2">({matchingServices.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {matchingServices.map(service => (
                        <ServiceCard 
                          key={service.id} 
                          service={service} 
                          onBookNow={() => openBookingModal(service)} 
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Booking Dialog */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Book Service</DialogTitle>
            <DialogDescription>
              Complete the form below to book this service.
            </DialogDescription>
          </DialogHeader>
          
          {selectedService && (
            <div className="space-y-4 py-4">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center">
                  <Tag className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedService.title}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedService.provider.name} • ${selectedService.basePrice}
                  </p>
                  <div className="flex items-center mt-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${
                            i < selectedService.provider.rating 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 ml-1">
                      ({selectedService.provider.reviewCount})
                    </span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="event">Select Event</Label>
                  <Select 
                    value={bookingData.eventId} 
                    onValueChange={(value) => setBookingData({ ...bookingData, eventId: value })}
                    required
                  >
                    <SelectTrigger id="event">
                      <SelectValue placeholder="Choose an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {upcomingEvents.length === 0 ? (
                        <SelectItem value="no-events" disabled>No upcoming events</SelectItem>
                      ) : (
                        upcomingEvents.map(event => (
                          <SelectItem key={event.id} value={event.id.toString()}>
                            {event.name} - {new Date(event.startDate).toLocaleDateString()}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {upcomingEvents.length === 0 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      You need to create an event before booking a service
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date">Preferred Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={bookingData.date}
                    onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">Preferred Time</Label>
                  <Input 
                    id="time" 
                    type="time" 
                    value={bookingData.startTime}
                    onChange={(e) => setBookingData({ ...bookingData, startTime: e.target.value })}
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="note">Special Requests</Label>
                  <textarea 
                    id="note" 
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                    placeholder="Add any special requirements or notes for the provider"
                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  />
                </div>
              </div>
              
              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => setIsBookingModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleBookingSubmit}
                  disabled={isCreating || !bookingData.eventId || !bookingData.date || !bookingData.startTime}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ServiceCardProps {
  service: MarketplaceService;
  onBookNow: () => void;
}

function ServiceCard({ service, onBookNow }: ServiceCardProps) {
  const [showMore, setShowMore] = useState(false);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{service.title}</CardTitle>
        <CardDescription className="flex items-center">
          <span className="mr-2">{service.provider.name}</span>
          {service.provider.verified && (
            <CheckCircle className="h-4 w-4 text-blue-500" />
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-2">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i} 
                className={`h-4 w-4 ${
                  i < service.provider.rating 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-gray-300'
                }`} 
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-1">
            ({service.provider.reviewCount})
          </span>
        </div>
        
        <div className="mb-2 text-sm flex items-center text-gray-500">
          <Tag className="h-4 w-4 mr-1" />
          <span className="capitalize">
            {service.serviceCategory}
          </span>
        </div>
        
        <p className="text-sm text-gray-700 mb-4">
          {showMore
            ? service.description
            : `${service.description.substring(0, 100)}${service.description.length > 100 ? '...' : ''}`
          }
          {service.description.length > 100 && (
            <button
              className="text-primary hover:text-primary/80 ml-1 underline"
              onClick={(e) => {
                e.preventDefault();
                setShowMore(!showMore);
              }}
            >
              {showMore ? 'Show less' : 'Show more'}
            </button>
          )}
        </p>
        
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-lg">${service.basePrice}</span>
          <Badge variant="outline" className="text-xs">
            {service.serviceType.replace('_', ' ')}
          </Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onBookNow}>
          Book Now
        </Button>
      </CardFooter>
    </Card>
  );
}