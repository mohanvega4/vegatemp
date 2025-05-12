import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define the notification types
export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  entityId?: number | null;
  entityType?: string | null;
  redirectUrl?: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export function useNotifications() {
  const { toast } = useToast();

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch
  } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 30000, // 30 seconds
  });

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to mark notification as read: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Get unread notifications count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    refetch
  };
}