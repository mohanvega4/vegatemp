import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Event } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, RefreshCw, Calendar, Clock, FileText, Eye, MapPin, Users, DollarSign, Info } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ProposalManagement from "@/components/admin/proposal-management";

export default function EventOversight() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const [isEventDetailsDialogOpen, setIsEventDetailsDialogOpen] = useState(false);

  // Fetch events with filters
  const { data: events, isLoading, refetch } = useQuery<Event[]>({
    queryKey: ["/api/events", statusFilter],
    queryFn: async () => {
      let url = "/api/events";
      if (statusFilter) url += `?status=${statusFilter}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
  });
  
  // Fetch customer profile when an event is selected
  const { data: customerProfile, isLoading: isCustomerLoading } = useQuery({
    queryKey: ["/api/customers/profile", selectedEvent?.customerId],
    queryFn: async () => {
      if (!selectedEvent?.customerId) throw new Error("No customer ID");
      const response = await fetch(`/api/customers/profile/${selectedEvent.customerId}`, { 
        credentials: "include" 
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!selectedEvent?.customerId,
  });

  // Update event status mutation
  const updateEventStatus = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/events/${eventId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event updated",
        description: "Event status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter events based on search query
  const filteredEvents = events
    ? events.filter(
        (event) =>
          event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Handle status change
  const handleStatusChange = (eventId: number, newStatus: string) => {
    updateEventStatus.mutate({ eventId, status: newStatus });
  };

  const getBadgeClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return "px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800";
      case "pending":
        return "px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800";
      case "in_progress":
        return "px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800";
      case "completed":
        return "px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800";
      case "cancelled":
        return "px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800";
      default:
        return "px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 pb-4">
          <CardTitle>Event Oversight</CardTitle>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search events..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2">
            <span className="text-sm font-medium">Filter Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-gray-500">Loading events...</span>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No events found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{event.name}</div>
                            <div className="text-sm text-gray-500">{event.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center text-sm text-gray-900">
                              <Calendar className="mr-1 h-3 w-3" />
                              {format(new Date(event.eventDate), "MMM d, yyyy")}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="mr-1 h-3 w-3" />
                              {format(new Date(event.eventDate), "h:mm a")} - 
                              {format(new Date(event.endDate), "h:mm a")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">
                            ${event.value?.toLocaleString() ?? "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={getBadgeClass(event.status)}>
                            {formatStatus(event.status)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setIsEventDetailsDialogOpen(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(event.id, "confirmed")}
                                disabled={event.status === "confirmed"}
                              >
                                Confirm
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(event.id, "in_progress")}
                                disabled={event.status === "in_progress"}
                              >
                                Mark In-Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(event.id, "completed")}
                                disabled={event.status === "completed"}
                              >
                                Mark Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(event.id, "cancelled")}
                                disabled={event.status === "cancelled"}
                              >
                                Cancel Event
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setIsProposalDialogOpen(true);
                                }}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Manage Proposals
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Proposals Dialog */}
      <Dialog open={isProposalDialogOpen} onOpenChange={setIsProposalDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Manage Proposals</DialogTitle>
            <DialogDescription>
              Create and manage proposals for this event
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <ProposalManagement 
              eventId={selectedEvent.id} 
              eventName={selectedEvent.name}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={isEventDetailsDialogOpen} onOpenChange={setIsEventDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              Comprehensive information about the event
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-6 py-4">
              {/* Event summary */}
              <div>
                <h3 className="text-xl font-semibold tracking-tight mb-2">{selectedEvent.name}</h3>
                <p className="text-gray-600">{selectedEvent.description}</p>
              </div>
              
              <Separator />
              
              {/* Event info cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-primary" />
                      Date Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-500 text-sm">Start Date:</span>
                        <p className="font-medium">{format(new Date(selectedEvent.eventDate), "PPP")}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm">End Date:</span>
                        <p className="font-medium">{format(new Date(selectedEvent.endDate), "PPP")}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm">Time:</span>
                        <p className="font-medium">
                          {format(new Date(selectedEvent.eventDate), "p")} - 
                          {format(new Date(selectedEvent.endDate), "p")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-primary" />
                      Location Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-500 text-sm">Location:</span>
                        <p className="font-medium">{selectedEvent.location}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm">Type:</span>
                        <p className="font-medium">
                          {selectedEvent.locationType 
                            ? selectedEvent.locationType.charAt(0).toUpperCase() + 
                              selectedEvent.locationType.slice(1).replace(/_/g, ' ')
                            : 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Users className="mr-2 h-4 w-4 text-primary" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isCustomerLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm">Loading customer...</span>
                      </div>
                    ) : customerProfile ? (
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-500 text-sm">Name:</span>
                          <p className="font-medium">{customerProfile.name || 'No name'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-sm">Email:</span>
                          <p className="font-medium">{customerProfile.email || customerProfile.authUser?.email || 'No email'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-sm">Customer ID:</span>
                          <p className="font-medium">{selectedEvent.customerId}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        No customer information available
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Users className="mr-2 h-4 w-4 text-primary" />
                      Audience & Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-500 text-sm">Audience Size:</span>
                        <p className="font-medium">{selectedEvent.audienceSize} people</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm">Event Type:</span>
                        <p className="font-medium">
                          {selectedEvent.eventType
                            ? selectedEvent.eventType.charAt(0).toUpperCase() + 
                              selectedEvent.eventType.slice(1).replace(/_/g, ' ')
                            : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm">Vibe:</span>
                        <p className="font-medium">
                          {selectedEvent.vibe
                            ? selectedEvent.vibe.charAt(0).toUpperCase() + 
                              selectedEvent.vibe.slice(1).replace(/_/g, ' ')
                            : 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <DollarSign className="mr-2 h-4 w-4 text-primary" />
                      Budget & Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-500 text-sm">Budget:</span>
                        <p className="font-medium">${parseFloat(selectedEvent.budget).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm">Status:</span>
                        <p className="font-medium">
                          <span className={getBadgeClass(selectedEvent.status)}>
                            {formatStatus(selectedEvent.status)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Info className="mr-2 h-4 w-4 text-primary" />
                      Additional Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-500 text-sm">Created:</span>
                        <p className="font-medium">{format(new Date(selectedEvent.createdAt), "PPP")}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm">Last Updated:</span>
                        <p className="font-medium">{format(new Date(selectedEvent.updatedAt), "PPP 'at' p")}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm">Customer ID:</span>
                        <p className="font-medium">{selectedEvent.customerId}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Separator />
              
              <DialogFooter>
                <Button
                  onClick={() => {
                    setIsEventDetailsDialogOpen(false);
                    setIsProposalDialogOpen(true);
                  }}
                  className="gap-1 items-center"
                >
                  <FileText className="h-4 w-4" />
                  Manage Proposals
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
