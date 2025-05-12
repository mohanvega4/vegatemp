import { Activity } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, formatDistance } from "date-fns";
import {
  UserPlus,
  CalendarCheck,
  DollarSign,
  HelpCircle,
  Bell,
  MessageSquare,
  Star,
  FileText,
  Settings,
  ShoppingBag,
} from "lucide-react";

interface RecentActivityProps {
  activities: Activity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "registration":
        return <UserPlus className="text-primary-500" />;
      case "event_created":
      case "event_update":
        return <CalendarCheck className="text-green-500" />;
      case "payment":
        return <DollarSign className="text-yellow-500" />;
      case "support":
        return <HelpCircle className="text-red-500" />;
      case "notification":
        return <Bell className="text-blue-500" />;
      case "message":
        return <MessageSquare className="text-purple-500" />;
      case "review":
        return <Star className="text-amber-500" />;
      case "proposal":
        return <FileText className="text-indigo-500" />;
      case "settings":
        return <Settings className="text-gray-500" />;
      case "marketplace":
        return <ShoppingBag className="text-emerald-500" />;
      default:
        return <Bell className="text-primary-500" />;
    }
  };

  const getActivityTitle = (activity: Activity) => {
    if (!activity.activityType) {
      return "Unknown Activity";
    }
    
    switch (activity.activityType) {
      case "registration":
        return "New user registration";
      case "login":
        return "User login";
      case "logout":
        return "User logout";
      case "user_update":
        return "User status updated";
      case "event_created":
        return "Event created";
      case "event_update":
        return "Event updated";
      default:
        return activity.activityType
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          {activities.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500">
              No recent activity to display.
            </div>
          ) : (
            <ul className="-mb-8">
              {activities.map((activity, index) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {index < activities.length - 1 && (
                      <span
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      ></span>
                    )}
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          {getActivityIcon(activity.activityType)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getActivityTitle(activity)}
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 whitespace-nowrap text-right text-sm text-gray-500">
                        <span>
                          {activity.createdAt 
                            ? formatDistance(new Date(activity.createdAt), new Date(), { addSuffix: true })
                            : "Recently"
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
      <div className="bg-gray-50 px-5 py-3 rounded-b-lg">
        <div className="text-sm">
          <a href="#activity" className="font-medium text-primary hover:text-primary/80">
            View all activity
          </a>
        </div>
      </div>
    </Card>
  );
}
