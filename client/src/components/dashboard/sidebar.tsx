import { User } from "@shared/schema";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  DollarSign,
  Store,
  MessageSquare,
  Image,
  Star,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  Share2,
  Calendar,
} from "lucide-react";

interface SidebarProps {
  currentSection: string;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  user: User;
}

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  isActive: boolean;
  children: React.ReactNode;
}

const SidebarLink = ({ href, icon, isActive, children }: SidebarLinkProps) => (
  <a
    href={href}
    className={cn(
      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150",
      isActive
        ? "bg-primary/10 text-primary"
        : "text-gray-700 hover:bg-gray-50 hover:text-primary"
    )}
  >
    <span className={cn("mr-3 text-lg", isActive ? "text-primary" : "text-gray-500")}>
      {icon}
    </span>
    {children}
  </a>
);

export default function Sidebar({ currentSection, isMobileMenuOpen, toggleMobileMenu, user }: SidebarProps) {
  const { logoutMutation } = useAuth();

  const getAvatarInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden"
          onClick={toggleMobileMenu}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "lg:flex lg:flex-shrink-0 lg:flex-col w-64 border-r border-gray-200 bg-white fixed inset-y-0 z-50 lg:relative lg:z-auto transition-all duration-300 ease-in-out transform",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo section */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200 bg-gradient-to-r from-primary to-secondary text-white">
          <div className="flex items-center justify-center w-full">
            <Logo className="h-10 w-auto" variant="full" showText={false} />
            <span className="ml-2 text-white font-bold text-lg">Vega Show</span>
          </div>
          <button
            className="lg:hidden p-2 rounded-md hover:bg-white/10 focus:outline-none"
            onClick={toggleMobileMenu}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <div className="px-2 py-4 space-y-1">
            {/* Dashboard Link (common for all users) */}
            <SidebarLink
              href="#dashboard"
              icon={<LayoutDashboard />}
              isActive={currentSection === "dashboard"}
            >
              Dashboard
            </SidebarLink>
            
            {/* Admin and Employee Links */}
            {(user.role === "admin" || user.role === "employee") && (
              <>
                <SidebarLink
                  href="#users"
                  icon={<Users />}
                  isActive={currentSection === "users"}
                >
                  User Management
                </SidebarLink>
                <SidebarLink
                  href="#events"
                  icon={<CalendarDays />}
                  isActive={currentSection === "events"}
                >
                  Event Oversight
                </SidebarLink>
                <SidebarLink
                  href="#proposals"
                  icon={<FileText />}
                  isActive={currentSection === "proposals"}
                >
                  Proposals
                </SidebarLink>
                <SidebarLink
                  href="#finances"
                  icon={<DollarSign />}
                  isActive={currentSection === "finances"}
                >
                  Financial Control
                </SidebarLink>
                <SidebarLink
                  href="#marketplace"
                  icon={<Store />}
                  isActive={currentSection === "marketplace"}
                >
                  Marketplace
                </SidebarLink>
                <SidebarLink
                  href="#communications"
                  icon={<MessageSquare />}
                  isActive={currentSection === "communications"}
                >
                  Communications
                </SidebarLink>
                <SidebarLink
                  href="#media"
                  icon={<Image />}
                  isActive={currentSection === "media"}
                >
                  Media Library
                </SidebarLink>
                <SidebarLink
                  href="#reviews"
                  icon={<Star />}
                  isActive={currentSection === "reviews"}
                >
                  Reviews
                </SidebarLink>
                <SidebarLink
                  href="#reports"
                  icon={<BarChart2 />}
                  isActive={currentSection === "reports"}
                >
                  Reports
                </SidebarLink>
                <SidebarLink
                  href="#settings"
                  icon={<Settings />}
                  isActive={currentSection === "settings"}
                >
                  Settings
                </SidebarLink>
              </>
            )}
            
            {/* Customer Links */}
            {user.role === "customer" && (
              <>
                <SidebarLink
                  href="#profile"
                  icon={<Users />}
                  isActive={currentSection === "profile"}
                >
                  My Profile
                </SidebarLink>
                <SidebarLink
                  href="#events"
                  icon={<CalendarDays />}
                  isActive={currentSection === "events"}
                >
                  My Events
                </SidebarLink>
                <SidebarLink
                  href="#bookings"
                  icon={<Calendar />}
                  isActive={currentSection === "bookings"}
                >
                  My Bookings
                </SidebarLink>
                <SidebarLink
                  href="#marketplace"
                  icon={<Store />}
                  isActive={currentSection === "marketplace"}
                >
                  Marketplace
                </SidebarLink>
                <SidebarLink
                  href="#communication"
                  icon={<MessageSquare />}
                  isActive={currentSection === "communication"}
                >
                  Communication
                </SidebarLink>
                <SidebarLink
                  href="#payments"
                  icon={<DollarSign />}
                  isActive={currentSection === "payments"}
                >
                  Payments
                </SidebarLink>
                <SidebarLink
                  href="#reviews"
                  icon={<Star />}
                  isActive={currentSection === "reviews"}
                >
                  Feedback & Reviews
                </SidebarLink>
                <SidebarLink
                  href="#settings"
                  icon={<Settings />}
                  isActive={currentSection === "settings"}
                >
                  Settings
                </SidebarLink>
              </>
            )}
            
            {/* Provider/Talent Links */}
            {user.role === "provider" && (
              <>
                <SidebarLink
                  href="#profile"
                  icon={<Users />}
                  isActive={currentSection === "profile"}
                >
                  Profile Setup
                </SidebarLink>
                <SidebarLink
                  href="#portfolio"
                  icon={<Image />}
                  isActive={currentSection === "portfolio"}
                >
                  Portfolio
                </SidebarLink>
                <SidebarLink
                  href="#services"
                  icon={<FileText />}
                  isActive={currentSection === "services"}
                >
                  Services
                </SidebarLink>
                <SidebarLink
                  href="#bookings"
                  icon={<CalendarDays />}
                  isActive={currentSection === "bookings"}
                >
                  Bookings
                </SidebarLink>
                <SidebarLink
                  href="#calendar"
                  icon={<Calendar />}
                  isActive={currentSection === "calendar"}
                >
                  Availability
                </SidebarLink>
                <SidebarLink
                  href="#messages"
                  icon={<MessageSquare />}
                  isActive={currentSection === "messages"}
                >
                  Messages
                </SidebarLink>
                <SidebarLink
                  href="#earnings"
                  icon={<DollarSign />}
                  isActive={currentSection === "earnings"}
                >
                  Earnings
                </SidebarLink>
                <SidebarLink
                  href="#reviews"
                  icon={<Star />}
                  isActive={currentSection === "reviews"}
                >
                  Reviews
                </SidebarLink>
                <SidebarLink
                  href="#promotion"
                  icon={<Share2 />}
                  isActive={currentSection === "promotion"}
                >
                  Promotion
                </SidebarLink>
                <SidebarLink
                  href="#settings"
                  icon={<Settings />}
                  isActive={currentSection === "settings"}
                >
                  Settings
                </SidebarLink>
              </>
            )}
          </div>
        </nav>

        {/* User profile section */}
        <div className="flex items-center px-4 py-3 border-t border-gray-200">
          <div className="flex-shrink-0">
            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center text-primary font-semibold">
              {getAvatarInitials(user.name)}
            </div>
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-700 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logoutMutation.mutate()}
            title="Sign out"
          >
            <LogOut className="h-5 w-5 text-primary hover:text-primary/80" />
          </Button>
        </div>
      </div>
    </>
  );
}
