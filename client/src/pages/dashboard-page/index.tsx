import { useState, useEffect, Suspense } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import Overview from "./overview";
import UserManagement from "./user-management";
import EventOversight from "./event-oversight";
import ProposalsManagement from "./proposals-management";
import { Button } from "@/components/ui/button";
import ReviewsManagement from "@/components/provider/reviews-management";
import { 
  Loader2, 
  CalendarPlus as CalendarPlusIcon, 
  Store as StoreIcon, 
  MessageSquare as MessageSquareIcon, 
  Users as UsersIcon, 
  Calendar as CalendarIcon,
  MessageCircle as MessageCircleIcon,
  Eye as EyeIcon,
  Clock as ClockIcon,
  DollarSign as DollarSignIcon,
  Bell as BellIcon,
  Upload as UploadIcon,
  Video as VideoIcon,
  Trash as TrashIcon,
  Plus as PlusIcon,
  Star as StarIcon,
  Search as SearchIcon,
  CreditCard as CreditCardIcon,
  QrCode as QrCodeIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Share2 as Share2Icon,
  Settings as SettingsIcon,
  Hourglass,
  Pencil as PencilIcon,
  Clipboard as ClipboardIcon
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

// Import provider dashboard components
import DashboardOverview from '@/components/provider/dashboard-overview';
import ProfileSetup from '@/components/provider/profile-setup';
import ServicesManagement from '@/components/provider/services-management';
import PortfolioManagement from '@/components/provider/portfolio-management';
import ProviderBookingsManagement from '@/components/provider/bookings-management';

// Import customer dashboard components
import CustomerDashboardOverview from '@/components/customer/dashboard-overview';
import EventsManagement from '@/components/customer/events-management';
import BookingsManagement from '@/components/customer/bookings-management';
import MarketplaceComponent from '@/components/customer/marketplace';
import ProfileSettings from '@/components/customer/profile-settings';
import { NotificationTest } from '@/components/notification-test';

export default function DashboardPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [currentSection, setCurrentSection] = useState<string>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Parse the hash from the URL to set the correct section
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      setCurrentSection(hash);
    } else {
      setCurrentSection("dashboard");
    }
  }, [location]);

  // Handle hash change events
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        setCurrentSection(hash);
      } else {
        setCurrentSection("dashboard");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);
  
  // Update document title based on user role and current section
  useEffect(() => {
    if (!user) return;
    
    const rolePrefix = user.role === "admin" 
      ? "Admin" 
      : user.role === "employee" 
        ? "Employee" 
        : user.role === "customer" 
          ? "Customer" 
          : "Provider";
          
    let sectionTitle = "Dashboard";
    
    if (currentSection === "dashboard") {
      sectionTitle = `${rolePrefix} Dashboard Overview`;
    } else {
      // Map section names to their display titles
      const sectionTitles: Record<string, string> = {
        users: "User Management",
        events: user.role === "admin" || user.role === "employee" ? "Event Oversight" : "My Events",
        proposals: "Proposals",
        profile: "My Profile",
        portfolio: "Portfolio",
        services: "Services",
        bookings: "Bookings",
        marketplace: "Marketplace",
        // Add more sections as needed
      };
      
      sectionTitle = sectionTitles[currentSection] || `${rolePrefix} Dashboard`;
    }
    
    document.title = `Vega Show | ${sectionTitle}`;
  }, [user, currentSection]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to render the current section content for admin/employee
  const renderAdminContent = () => {
    switch (currentSection) {
      case "dashboard":
        return <Overview />;
      case "users":
        return <UserManagement />;
      case "events":
        return <EventOversight />;
      case "proposals":
        return <ProposalsManagement />;
      default:
        return <Overview />;
    }
  };

  // Function to render the current section content for customer
  const renderCustomerContent = () => {
    switch (currentSection) {
      case "dashboard":
        return <CustomerDashboardOverview />;
      case "events":
        return <EventsManagement />;
      case "profile":
        return <ProfileSettings />;
      case "marketplace":
        return <MarketplaceComponent />;
      case "bookings":
        return <BookingsManagement />;
      case "communication":
        return (
          <div>
            <h1 className="text-2xl font-semibold mb-6">Communication</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-medium mb-4">Contacts</h2>
                <div className="text-center py-10 text-gray-500">
                  <UsersIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Contacts Yet</h3>
                  <p className="mb-4">
                    Your service provider contacts will appear here.
                  </p>
                </div>
              </div>
              <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-medium mb-4">Messages</h2>
                <div className="text-center py-20 text-gray-500">
                  <MessageCircleIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Messages Yet</h3>
                  <p>
                    Your conversation history will appear here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Customer Dashboard Overview</h1>
            <p>Select an option from the sidebar to get started.</p>
          </div>
        );
    }
  };

  // Function to render talent dashboard content based on section
  const renderTalentContent = () => {
    switch (currentSection) {
      case "dashboard":
        return <DashboardOverview />;
      case "profile":
        return <ProfileSetup />;
      case "portfolio":
        return <PortfolioManagement />;
      case "services":
        return <ServicesManagement />;
      case "bookings":
        // Use the dedicated provider bookings management component
        return <ProviderBookingsManagement />;
      case "calendar":
        return (
          <div>
            <h1 className="text-2xl font-semibold mb-6">Availability Calendar</h1>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium">Set Your Availability</h2>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <CalendarPlusIcon className="h-4 w-4 mr-2" />
                    Block Date
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <div className="border rounded-lg p-4 h-96 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-500">Calendar will display here</p>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Legend</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-200 rounded-sm mr-2"></div>
                        <span className="text-sm">Available</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-red-200 rounded-sm mr-2"></div>
                        <span className="text-sm">Unavailable</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-yellow-200 rounded-sm mr-2"></div>
                        <span className="text-sm">Pending Booking</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-200 rounded-sm mr-2"></div>
                        <span className="text-sm">Confirmed Booking</span>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-md font-medium mb-3">Set Default Hours</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="time" 
                            className="p-2 border border-gray-300 rounded-md"
                            value="09:00"
                          />
                          <input 
                            type="time" 
                            className="p-2 border border-gray-300 rounded-md"
                            value="17:00"
                          />
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          Apply to All Days
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "messages":
        return (
          <div>
            <h1 className="text-2xl font-semibold mb-6">Messages</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-[calc(80vh-10rem)]">
                <div className="mb-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full p-2 pl-10 border border-gray-300 rounded-md"
                      placeholder="Search conversations..."
                    />
                    <SearchIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>
                
                <div className="overflow-y-auto h-[calc(100%-3rem)] text-center">
                  <div className="py-16">
                    <MessageSquareIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500">No conversations yet</p>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-[calc(80vh-10rem)] flex flex-col">
                <div className="text-center py-16 my-auto">
                  <MessageCircleIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Your Messages</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Select a conversation from the list or start a new one. Your messages with customers will appear here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case "earnings":
        return (
          <div>
            <h1 className="text-2xl font-semibold mb-6">Earnings</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSignIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Total Earnings</p>
                    <h3 className="text-xl font-semibold">$0.00</h3>
                  </div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Hourglass className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Pending</p>
                    <h3 className="text-xl font-semibold">$0.00</h3>
                  </div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <CreditCardIcon className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Available</p>
                    <h3 className="text-xl font-semibold">$0.00</h3>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium">Transaction History</h2>
                <Button variant="outline">Export CSV</Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-8 whitespace-nowrap text-center text-gray-500" colSpan={4}>
                        No transactions yet
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-medium mb-6">Payment Methods</h2>
              <div className="text-center py-8">
                <CreditCardIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500 mb-4">No payment methods added yet</p>
                <Button className="bg-primary text-white">Add Payment Method</Button>
              </div>
            </div>
          </div>
        );
      case "reviews":
        return <ReviewsManagement />;
      case "promotion":
        return (
          <div>
            <h1 className="text-2xl font-semibold mb-6">Promotion</h1>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
              <h2 className="text-xl font-medium mb-6">Social Media Integration</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="border rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <InstagramIcon className="h-8 w-8 text-pink-500 mr-3" />
                    <div>
                      <h3 className="font-medium">Instagram</h3>
                      <p className="text-sm text-gray-500">Connect to share updates</p>
                    </div>
                  </div>
                  <Button className="w-full">Connect Account</Button>
                </div>
                
                <div className="border rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <FacebookIcon className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <h3 className="font-medium">Facebook</h3>
                      <p className="text-sm text-gray-500">Connect to share updates</p>
                    </div>
                  </div>
                  <Button className="w-full">Connect Account</Button>
                </div>
                
                <div className="border rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <TwitterIcon className="h-8 w-8 text-blue-400 mr-3" />
                    <div>
                      <h3 className="font-medium">Twitter</h3>
                      <p className="text-sm text-gray-500">Connect to share updates</p>
                    </div>
                  </div>
                  <Button className="w-full">Connect Account</Button>
                </div>
                
                <div className="border rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-8 w-8 flex items-center justify-center mr-3">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-black">
                        <path d="M19.321 5.562a5.124 5.124 0 0 0-3.575-3.716 43.6 43.6 0 0 0-7.492 0A5.124 5.124 0 0 0 4.68 5.562a39.711 39.711 0 0 0 0 12.876 5.124 5.124 0 0 0 3.575 3.716c2.487.461 5.004.461 7.492 0a5.124 5.124 0 0 0 3.575-3.716 39.711 39.711 0 0 0 0-12.876zm-7.32 10.075a4.375 4.375 0 1 1 0-8.75 4.375 4.375 0 0 1 0 8.75zm4.501-7.314a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/>
                        <path d="M12 9.562A2.188 2.188 0 1 0 12 13.938a2.188 2.188 0 0 0 0-4.376z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">TikTok</h3>
                      <p className="text-sm text-gray-500">Connect to share updates</p>
                    </div>
                  </div>
                  <Button className="w-full">Connect Account</Button>
                </div>
              </div>
              
              <div className="mb-8">
                <h2 className="text-xl font-medium mb-4">Share Your Profile</h2>
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <div className="mb-4">
                    <QrCodeIcon className="h-24 w-24 mx-auto text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4">Your profile QR code will appear here once your profile is approved.</p>
                  <Button variant="outline" disabled>Download QR Code</Button>
                </div>
              </div>
            </div>
          </div>
        );
      case "settings":
        return (
          <div>
            <h1 className="text-2xl font-semibold mb-6">Settings</h1>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="mb-8 border-b pb-6">
                <h2 className="text-xl font-medium mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive booking and message alerts via email</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">SMS Notifications</h3>
                      <p className="text-sm text-gray-500">Receive alerts via text message</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Marketing Communications</h3>
                      <p className="text-sm text-gray-500">Receive promotions and updates</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
              
              <div className="mb-8 border-b pb-6">
                <h2 className="text-xl font-medium mb-6">Account Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Change Password</label>
                    <div className="space-y-2">
                      <input 
                        type="password" 
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Current password"
                      />
                      <input 
                        type="password" 
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="New password"
                      />
                      <input 
                        type="password" 
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Confirm new password"
                      />
                      <Button className="mt-2">Update Password</Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-medium mb-6 text-red-600">Danger Zone</h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-600 mb-2">Deactivate Account</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Temporarily hide your profile from the marketplace. You can reactivate anytime.
                  </p>
                  <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-100">
                    Deactivate Account
                  </Button>
                  
                  <div className="border-t border-red-200 my-4 pt-4">
                    <h3 className="font-medium text-red-600 mb-2">Delete Account</h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Permanently delete your account and all data. This action cannot be undone.
                    </p>
                    <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-100">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Provider Dashboard Overview</h1>
            <p>Select an option from the sidebar to get started.</p>
          </div>
        );
    }
  };
  
  // Function to render the current section content based on user role
  const renderSectionContent = () => {
    if (!user) return null;

    // Force users to stay in their role-appropriate views
    if (user.role === "admin" || user.role === "employee") {
      // Admin and employee can access all sections
      return renderAdminContent();
    } else if (user.role === "customer") {
      // Customers should only see customer content, never leak into admin views
      if (currentSection === "users" || currentSection === "proposals") {
        // Force back to dashboard if they try to access restricted sections
        window.location.hash = "dashboard";
        return <CustomerDashboardOverview />;
      }
      return renderCustomerContent();
    } else if (user.role === "provider") {
      return renderTalentContent();
    }

    // Fallback to customer view if role is unknown
    console.warn('Unknown user role:', user.role);
    return <CustomerDashboardOverview />;
  };

  // This ensures we don't show the dashboard if there's no authenticated user
  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        currentSection={currentSection} 
        isMobileMenuOpen={isMobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        user={user}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          toggleMobileMenu={toggleMobileMenu} 
          currentSection={currentSection}
          user={user}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }>
            {renderSectionContent()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
