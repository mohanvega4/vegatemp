import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useAuth } from '@/hooks/use-auth';
import {
  CalendarCheck,
  Users,
  Clock,
  Music,
  Camera,
  Map,
  Star,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Redirect to dashboard if already logged in
  if (user) {
    setLocation('/dashboard');
    // Return a placeholder while redirecting instead of null
    return <div className="h-screen flex items-center justify-center">Redirecting...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 fixed top-0 w-full z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Logo className="h-10 w-auto" variant="full" showText={true} />
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                className="p-2 text-gray-600 hover:text-primary"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
            
            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-primary font-medium">
                Features
              </a>
              <a href="#talent" className="text-gray-600 hover:text-primary font-medium">
                Talent
              </a>
              <a href="#customers" className="text-gray-600 hover:text-primary font-medium">
                Customers
              </a>
              <Link href="/auth">
                <Button className="bg-primary hover:bg-primary/90">
                  Log In
                </Button>
              </Link>
            </nav>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 py-2">
            <div className="container mx-auto px-4 space-y-2">
              <a 
                href="#features" 
                className="block py-2 text-gray-600 hover:text-primary font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#talent" 
                className="block py-2 text-gray-600 hover:text-primary font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Talent
              </a>
              <a 
                href="#customers" 
                className="block py-2 text-gray-600 hover:text-primary font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Customers
              </a>
              <div className="py-2">
                <Link href="/auth">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Log In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero section */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 bg-gradient-to-br from-[#a0c228] via-[#4bb99d] to-[#e69a28]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Make Your Event Extraordinary
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                Connect with top talent for your events, or showcase your services
                to customers looking for the perfect match.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="bg-white p-6 rounded-lg shadow-xl">
                  <div className="mb-4 text-center">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
                      <Calendar className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold">Upcoming Event</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex">
                      <div className="w-1/3 font-medium text-gray-500">Event</div>
                      <div className="w-2/3 font-medium">Summer Festival 2025</div>
                    </div>
                    <div className="flex">
                      <div className="w-1/3 font-medium text-gray-500">Date</div>
                      <div className="w-2/3">June 15, 2025</div>
                    </div>
                    <div className="flex">
                      <div className="w-1/3 font-medium text-gray-500">Location</div>
                      <div className="w-2/3">Central Park, New York</div>
                    </div>
                    <div className="flex">
                      <div className="w-1/3 font-medium text-gray-500">Services</div>
                      <div className="w-2/3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                          Music
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                          Photography
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Dance
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-100">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="ml-2 font-medium">5.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section id="features" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simplify Your Event Planning</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Vega Show provides all the tools you need to organize successful events 
              and connect with the right talent.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mb-4">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Event Management</h3>
              <p className="text-gray-600">
                Create and manage events with ease. Track all details in one place, from scheduling to budget.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Talent Marketplace</h3>
              <p className="text-gray-600">
                Browse a diverse range of performers, photographers, DJs, and more for your event needs.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mb-4">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Booking</h3>
              <p className="text-gray-600">
                Book talent instantly and manage your schedule with our real-time availability system.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mb-4">
                <Music className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Diverse Services</h3>
              <p className="text-gray-600">
                Find everything from music and entertainment to catering and event planning services.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mb-4">
                <Camera className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Portfolio Showcase</h3>
              <p className="text-gray-600">
                Talent can showcase their work with impressive portfolios and gather reviews from customers.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mb-4">
                <Map className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Location Based</h3>
              <p className="text-gray-600">
                Find local talent or discover opportunities in your area with our location-based search.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Talent section */}
      <section id="talent" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">For Talent & Service Providers</h2>
              <p className="text-xl text-gray-600 mb-6">
                Showcase your skills and services to a wide audience of event organizers and customers.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-600 mr-3 mt-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Create a stunning portfolio to showcase your work and attract clients</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-600 mr-3 mt-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Manage bookings and availability through an intuitive dashboard</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-600 mr-3 mt-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Collect reviews and build your reputation to stand out from competitors</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-600 mr-3 mt-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Track earnings and payments all in one convenient location</p>
                </li>
              </ul>
              
              <div className="mt-8">
                <Link href="/auth">
                  <Button className="bg-primary hover:bg-primary/90">
                    Join as Talent
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="rounded-xl overflow-hidden shadow-xl">
              <div className="bg-white p-6 rounded-t-xl border-b border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Provider Dashboard</h3>
                  <div className="bg-green-100 px-3 py-1 rounded-full text-sm font-medium text-green-800">
                    Online
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <CalendarCheck className="h-5 w-5 text-blue-700" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium">Upcoming Booking</h4>
                        <p className="text-sm text-gray-500">Wedding Ceremony • June 12</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-yellow-100 p-2 rounded-lg">
                        <Star className="h-5 w-5 text-yellow-700" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium">New Review</h4>
                        <p className="text-sm text-gray-500">5 stars from Michael C.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Read</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-700" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium">Recent Payment</h4>
                        <p className="text-sm text-gray-500">$750.00 • Corporate Event</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Details</Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 text-white p-6 rounded-b-xl">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">This Month's Performance</h4>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">5</div>
                    <div className="text-sm text-gray-400">Bookings</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">4.9</div>
                    <div className="text-sm text-gray-400">Rating</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">$2.4k</div>
                    <div className="text-sm text-gray-400">Revenue</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Customers section */}
      <section id="customers" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-gradient-to-br from-[#a0c228] via-[#4bb99d] to-[#e69a28] p-1 rounded-xl shadow-xl">
                <div className="bg-white p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Event Planning Made Simple</h3>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Music className="h-5 w-5 text-purple-700" />
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">DJ Beats</div>
                          <div className="text-xs flex items-center">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <span className="ml-1">5.0</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-sm font-medium mr-3">$350</div>
                        <Button size="sm" className="bg-primary hover:bg-primary/90">Book</Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Camera className="h-5 w-5 text-blue-700" />
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">Photo Pro</div>
                          <div className="text-xs flex items-center">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <span className="ml-1">4.9</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-sm font-medium mr-3">$500</div>
                        <Button size="sm" className="bg-primary hover:bg-primary/90">Book</Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <div className="font-semibold text-green-700">DC</div>
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">Dance Crew</div>
                          <div className="text-xs flex items-center">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <span className="ml-1">4.8</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-sm font-medium mr-3">$800</div>
                        <Button size="sm" className="bg-primary hover:bg-primary/90">Book</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <span className="inline-flex rounded-md shadow-sm">
                      <button 
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        View More Options
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </button>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">For Customers & Event Planners</h2>
              <p className="text-xl text-gray-600 mb-6">
                Find the perfect talent and services for your events with our comprehensive marketplace.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-600 mr-3 mt-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Browse and discover a wide range of talent based on your event needs</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-600 mr-3 mt-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Manage all your events in one centralized, easy-to-use dashboard</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-600 mr-3 mt-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Book services with confidence using our secure payment system</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-600 mr-3 mt-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Leave reviews and feedback to help the community thrive</p>
                </li>
              </ul>
              
              <div className="mt-8">
                <Link href="/auth">
                  <Button className="bg-primary hover:bg-primary/90">
                    Plan Your Event
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#a0c228] via-[#4bb99d] to-[#e69a28]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Join Vega Show today and transform the way you plan events or showcase your talent.
          </p>
          <Link href="/auth">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              Create Your Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <Logo className="h-10 w-auto mb-4" variant="full" showText={true} />
              <p className="text-gray-400 mb-4">
                Connecting talent with opportunity for extraordinary events.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">For Talent</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">How It Works</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Create Profile</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">For Customers</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Browse Talent</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Event Planning</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Security</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Reviews</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; 2025 Vega Show. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper components
function Calendar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function DollarSign(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}