import { useState } from "react";
import { Bell, FileText, CheckCircle, XCircle, Calendar, DollarSign } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useNotifications, type Notification } from "@/hooks/use-notifications";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export function NotificationsDropdown() {
  const { notifications, unreadCount, isLoading, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    
    // Navigate to relevant page based on redirectUrl or entity info
    if (notification.redirectUrl) {
      // Use the redirectUrl from the database if available
      setLocation(notification.redirectUrl);
    } else if (notification.entityId && notification.entityType) {
      // Fall back to the entity-based routing if redirect_url is not available
      switch (notification.entityType) {
        case 'proposal':
          // For proposals, we need to navigate to the event detail view
          // and show the proposal dialog
          setLocation(`/dashboard?section=events&view=proposals&eventId=${notification.entityId}`);
          break;
        case 'booking':
          setLocation(`/dashboard?section=bookings&booking=${notification.entityId}`);
          break;
        case 'event':
          setLocation(`/dashboard?section=events&event=${notification.entityId}`);
          break;
        case 'payment':
          setLocation('/dashboard?section=finances');
          break;
        default:
          // Default to dashboard
          setLocation('/dashboard');
      }
    } else {
      // Default to dashboard if no navigation info
      setLocation('/dashboard');
    }
    
    setIsOpen(false);
  };

  // Helper to get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'proposal_received':
        return <FileText className="h-4 w-4 mr-2" />;
      case 'proposal_accepted':
        return <CheckCircle className="h-4 w-4 mr-2" />;
      case 'proposal_rejected':
        return <XCircle className="h-4 w-4 mr-2" />;
      case 'booking_confirmed':
        return <Calendar className="h-4 w-4 mr-2" />;
      case 'payment_received':
        return <DollarSign className="h-4 w-4 mr-2" />;
      default:
        return <Bell className="h-4 w-4 mr-2" />;
    }
  };

  // Format the date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 text-xs bg-primary text-primary-foreground rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="font-normal">
          <p className="font-medium">Notifications</p>
          <p className="text-xs text-muted-foreground">
            You have {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-80">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 flex items-start gap-4">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-3 cursor-pointer ${!notification.isRead ? 'bg-muted/50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-primary mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}