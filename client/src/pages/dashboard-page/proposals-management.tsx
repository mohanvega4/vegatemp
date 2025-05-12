import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Proposal, Event } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  CalendarDays,
  Search,
  Filter,
  RefreshCw,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import ProposalManagement from "@/components/admin/proposal-management";
import { useToast } from "@/hooks/use-toast";

export default function ProposalsManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isViewingProposals, setIsViewingProposals] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isViewProposalOpen, setIsViewProposalOpen] = useState(false);

  // Fetch all events
  const {
    data: events,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await fetch("/api/events", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
  });

  // Fetch all proposals
  const {
    data: allProposals,
    isLoading: proposalsLoading,
    refetch: refetchProposals,
  } = useQuery<Proposal[]>({
    queryKey: ["/api/proposals"],
    queryFn: async () => {
      const response = await fetch("/api/proposals", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch proposals");
      return response.json();
    },
  });

  // Get badge for proposal status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="flex items-center"><Edit className="mr-1 h-3 w-3" /> Draft</Badge>;
      case "pending":
        return <Badge variant="secondary" className="flex items-center"><Clock className="mr-1 h-3 w-3" /> Pending Review</Badge>;
      case "accepted":
        return <Badge className="flex items-center bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" /> Accepted</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="flex items-center"><XCircle className="mr-1 h-3 w-3" /> Rejected</Badge>;
      case "expired":
        return <Badge variant="outline" className="flex items-center bg-orange-100 text-orange-800"><AlertCircle className="mr-1 h-3 w-3" /> Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Find event details for a given eventId
  const getEventForProposal = (eventId: number) => {
    return events?.find(event => event.id === eventId);
  };

  // Filter proposals based on search and status filter
  const filteredProposals = allProposals?.filter(proposal => {
    // Filter by status
    if (statusFilter !== "all" && proposal.status !== statusFilter) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const event = getEventForProposal(proposal.eventId);
      const searchLower = searchQuery.toLowerCase();
      return (
        proposal.title?.toLowerCase().includes(searchLower) ||
        proposal.description?.toLowerCase().includes(searchLower) ||
        event?.name?.toLowerCase().includes(searchLower) ||
        event?.description?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <CardTitle>Proposal Management</CardTitle>
              <CardDescription>
                Manage and track all client proposals across events
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                refetchProposals();
                refetchEvents();
                toast({
                  title: "Refreshed",
                  description: "Proposal data has been updated",
                });
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters and search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center relative flex-1">
                <Search className="absolute left-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search proposals..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-44">
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Proposals table */}
            {proposalsLoading || eventsLoading ? (
              <div className="flex justify-center py-10">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredProposals?.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-medium">No proposals found</h3>
                <p>Try adjusting your filters or create new proposals for events.</p>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProposals?.map(proposal => {
                      const event = getEventForProposal(proposal.eventId);
                      return (
                        <TableRow key={proposal.id}>
                          <TableCell className="font-medium">{proposal.title}</TableCell>
                          <TableCell>{event?.name || "Unknown Event"}</TableCell>
                          <TableCell>
                            {proposal.createdAt
                              ? format(new Date(proposal.createdAt), "MMM d, yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {proposal.validUntil
                              ? format(new Date(proposal.validUntil), "MMM d, yyyy")
                              : "No expiration"}
                          </TableCell>
                          <TableCell>${Number(proposal.totalPrice).toLocaleString()}</TableCell>
                          <TableCell>{getStatusBadge(proposal.status || "draft")}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedProposal(proposal);
                                setIsViewProposalOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const event = getEventForProposal(proposal.eventId);
                                if (event) {
                                  setSelectedEvent(event);
                                  setIsViewingProposals(true);
                                } else {
                                  toast({
                                    title: "Error",
                                    description: "Could not find associated event",
                                    variant: "destructive"
                                  });
                                }
                              }}
                            >
                              <CalendarDays className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Proposals Dialog */}
      <Dialog open={isViewingProposals} onOpenChange={setIsViewingProposals}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Event Proposals</DialogTitle>
            <DialogDescription>
              Manage proposals for selected event
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <ProposalManagement 
              eventId={selectedEvent.id} 
              eventName={selectedEvent.name}
              hideTitle={false}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Proposal Dialog */}
      <Dialog open={isViewProposalOpen} onOpenChange={setIsViewProposalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Proposal Details</DialogTitle>
          </DialogHeader>
          
          {selectedProposal && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{selectedProposal.title}</h2>
                  <p className="text-gray-500">
                    {getEventForProposal(selectedProposal.eventId)?.name || "Unknown Event"}
                  </p>
                  <p className="text-gray-500">
                    Created on {selectedProposal.createdAt ? format(new Date(selectedProposal.createdAt), "MMM d, yyyy") : "-"}
                  </p>
                </div>
                <div>{getStatusBadge(selectedProposal.status || 'draft')}</div>
              </div>

              <p className="text-gray-700">{selectedProposal.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Valid Until</h3>
                  <p className="mt-1">
                    {selectedProposal.validUntil
                      ? format(new Date(selectedProposal.validUntil), "MMM d, yyyy")
                      : "No expiration"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Price</h3>
                  <p className="mt-1 text-lg font-semibold">
                    ${Number(selectedProposal.totalPrice).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedProposal.feedback && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Customer Feedback</h3>
                  <p className="mt-1 p-3 bg-gray-50 rounded-md">
                    {selectedProposal.feedback}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-medium mb-2">Proposal Items</h3>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedProposal.items as any[]).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-gray-500">
                                {item.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>${Number(item.price).toFixed(2)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}