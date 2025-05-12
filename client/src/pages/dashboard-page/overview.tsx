import { useQuery } from "@tanstack/react-query";
import StatsCard from "@/components/dashboard/stats-card";
import RecentActivity from "@/components/dashboard/recent-activity";
import RecentUsers from "@/components/dashboard/recent-users";
import UpcomingEvents from "@/components/dashboard/upcoming-events";
import { Loader2 } from "lucide-react";
import { Activity } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export default function Overview() {
  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Fetch recent activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activities?limit=5"],
  });

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users?limit=4"],
  });

  // Fetch upcoming events (uses customer endpoint for customers, general endpoint for admins)
  const { user } = useAuth();
  
  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: [
      user?.role === 'customer' 
        ? "/api/customer/events" 
        : "/api/events?status=confirmed&status=pending"
    ],
  });

  const isLoading = isLoadingStats || isLoadingActivities || isLoadingUsers || isLoadingEvents;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-500">Loading dashboard data...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Dashboard metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon="users"
          iconBgClass="bg-primary-100"
          iconTextClass="text-primary"
          linkText="View all users"
          linkHref="#users"
        />
        <StatsCard
          title="Active Events"
          value={stats?.activeEvents ?? 0}
          icon="calendar"
          iconBgClass="bg-amber-100"
          iconTextClass="text-amber-500"
          linkText="View all events"
          linkHref="#events"
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${stats?.monthlyRevenue?.toLocaleString() ?? 0}`}
          icon="dollar-sign"
          iconBgClass="bg-green-100"
          iconTextClass="text-green-500"
          linkText="View financial details"
          linkHref="#finances"
        />
        <StatsCard
          title="Pending Approvals"
          value={stats?.pendingApprovals ?? 0}
          icon="clock"
          iconBgClass="bg-amber-100"
          iconTextClass="text-amber-500"
          linkText="View pending items"
          linkHref="#approvals"
        />
      </div>

      {/* Recent Activity & Users sections */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentActivity activities={activities || []} />
        <RecentUsers users={users || []} />
      </div>

      {/* Upcoming Events Section */}
      <div className="mt-6">
        <UpcomingEvents events={events || []} />
      </div>
    </div>
  );
}
