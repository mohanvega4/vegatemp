import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { List, Grid } from "lucide-react";
import { useState } from "react";

interface RecentUsersProps {
  users: User[];
}

export default function RecentUsers({ users }: RecentUsersProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const getAvatarInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800";
      case "pending":
        return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800";
      case "rejected":
        return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800";
      case "inactive":
        return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800";
      default:
        return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle>Recent Users</CardTitle>
        <div className="inline-flex space-x-2">
          <button
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              viewMode === "list" && "bg-gray-100"
            )}
            onClick={() => setViewMode("list")}
            title="View as list"
          >
            <List className="h-4 w-4" />
            <span className="sr-only">View as list</span>
          </button>
          <button
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              viewMode === "grid" && "bg-gray-100"
            )}
            onClick={() => setViewMode("grid")}
            title="View as grid"
          >
            <Grid className="h-4 w-4" />
            <span className="sr-only">View as grid</span>
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-500">
            No users to display.
          </div>
        ) : viewMode === "list" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
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
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                          {getAvatarInitials(user.name)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">{user.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getBadgeClass(user.status)}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.status === "pending" && (
                        <a href="#users" className="text-primary hover:text-primary-dark mr-3">
                          Review
                        </a>
                      )}
                      <a href="#users" className="text-primary hover:text-primary-dark">
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col border rounded-lg overflow-hidden p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                    {getAvatarInitials(user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className="capitalize text-sm text-gray-700">{user.role}</span>
                  <span className={getBadgeClass(user.status)}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </div>
                <div className="mt-4 flex justify-end">
                  {user.status === "pending" && (
                    <a href="#users" className="text-primary hover:text-primary-dark text-sm mr-3">
                      Review
                    </a>
                  )}
                  <a href="#users" className="text-primary hover:text-primary-dark text-sm">
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <div className="bg-gray-50 px-5 py-3 rounded-b-lg">
        <div className="text-sm">
          <a href="#users" className="font-medium text-primary hover:text-primary/80">
            View all users
          </a>
        </div>
      </div>
    </Card>
  );
}
