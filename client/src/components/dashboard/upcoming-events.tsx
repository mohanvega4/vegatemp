import { Event } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface UpcomingEventsProps {
  events: Event[];
}

export default function UpcomingEvents({ events }: UpcomingEventsProps) {
  const getBadgeClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800";
      case "pending":
        return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800";
      case "completed":
        return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800";
      case "cancelled":
        return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800";
      default:
        return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Sort events by date (nearest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  // Take only upcoming events (limit to 5)
  const upcomingEvents = sortedEvents
    .filter((event) => new Date(event.eventDate) >= new Date())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-500">
            No upcoming events to display.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Event
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Customer
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Value
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingEvents.map((event) => (
                  <tr key={event.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{event.name}</div>
                      <div className="text-sm text-gray-500">{event.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Customer #{event.customerId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(event.eventDate), "MMM d, yyyy")}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(event.eventDate), "h:mm a")} - 
                        {format(new Date(event.endDate), "h:mm a")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${event.value?.toLocaleString() ?? "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getBadgeClass(event.status)}>
                        {formatStatus(event.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {event.status === "pending" && (
                        <a href="#events" className="text-primary hover:text-primary-dark mr-3">
                          Review
                        </a>
                      )}
                      <a href="#events" className="text-primary hover:text-primary-dark">
                        Details
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      <div className="bg-gray-50 px-5 py-3 rounded-b-lg">
        <div className="text-sm">
          <a href="#events" className="font-medium text-primary hover:text-primary/80">
            View all events
          </a>
        </div>
      </div>
    </Card>
  );
}
