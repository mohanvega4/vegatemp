import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Menu, MessageSquare, MoreVertical, User as UserIcon, Settings, HelpCircle } from "lucide-react";
import { NotificationsDropdown } from "@/components/layout/notifications-dropdown";

interface HeaderProps {
  toggleMobileMenu: () => void;
  currentSection: string;
  user: User;
}

export default function Header({ toggleMobileMenu, currentSection, user }: HeaderProps) {
  const { logoutMutation } = useAuth();
  const [messagesOpen, setMessagesOpen] = useState(false);

  const getSectionTitle = () => {
    // First part of the title based on user role
    const rolePrefix = user.role === "admin" 
      ? "Admin" 
      : user.role === "employee" 
        ? "Employee" 
        : user.role === "customer" 
          ? "Customer" 
          : "Provider";
          
    switch (currentSection) {
      case "dashboard":
        return `${rolePrefix} Dashboard Overview`;
      case "users":
        return "User Management";
      case "events":
        return user.role === "admin" || user.role === "employee" 
          ? "Event Oversight" 
          : "My Events";
      case "proposals":
        return "Proposals";
      case "finances":
        return "Financial Control";
      case "marketplace":
        return "Provider Marketplace";
      case "communications":
        return "Communications";
      case "media":
        return "Media Library";
      case "reviews":
        return user.role === "admin" || user.role === "employee"
          ? "Review & Rating Oversight"
          : "Reviews";
      case "reports":
        return "Reports & Analytics";
      case "settings":
        return "System Configuration";
      case "profile":
        return "My Profile";
      case "portfolio":
        return "Portfolio Management";
      case "services":
        return "Services Management";
      case "calendar":
        return "Availability Calendar";
      case "bookings":
        return "Bookings Management";
      case "messages":
        return "Messages";
      case "earnings":
        return "Earnings & Payments";
      case "promotion":
        return "Promotion Tools";
      default:
        return `${rolePrefix} Dashboard Overview`;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="lg:hidden text-primary hover:text-primary/80 hover:bg-primary/5 focus:outline-none"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-800 ml-2 lg:ml-0">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              {getSectionTitle()}
            </span>
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <NotificationsDropdown />

          <DropdownMenu open={messagesOpen} onOpenChange={setMessagesOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-secondary hover:text-secondary/80 hover:bg-secondary/5 focus:outline-none"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-destructive"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-2 font-medium text-sm bg-gradient-to-r from-primary/10 to-secondary/10 text-secondary">Messages</div>
              <div className="p-4 text-sm text-center text-gray-500">
                No new messages at this time.
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-accent hover:text-accent/80 hover:bg-accent/5 focus:outline-none"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Your Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => logoutMutation.mutate()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
