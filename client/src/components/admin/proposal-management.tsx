import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Proposal, Event } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  Trash,
  Edit,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define proposal form schema
const proposalFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  totalPrice: z.coerce.number().positive("Price must be a positive number"),
  validUntil: z.union([
    z.coerce.date().refine(
      date => !isNaN(date.getTime()) && date > new Date(), 
      "Date must be valid and in the future"
    ),
    z.string().transform(val => {
      try {
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          // Default to 30 days from now if invalid
          return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        return date;
      } catch {
        // Default to 30 days from now on error
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    })
  ]),
  items: z.string().transform((val) => {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }),
});

type ProposalFormValues = z.infer<typeof proposalFormSchema>;

interface ProposalItemType {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
}

interface ProposalManagementProps {
  eventId: number;
  eventName: string;
  hideTitle?: boolean;
}

export default function ProposalManagement({
  eventId,
  eventName,
  hideTitle = false,
}: ProposalManagementProps) {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<Proposal | null>(null);
  const [proposalItems, setProposalItems] = useState<ProposalItemType[]>([]);
  
  // Form for creating proposal items
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");

  // Get proposals for this event
  const { data: proposals, isLoading, refetch } = useQuery<Proposal[]>({
    queryKey: [`/api/events/${eventId}/proposals`],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/proposals`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch proposals");
      return response.json();
    },
  });

  // Create proposal mutation
  const createProposal = useMutation({
    mutationFn: async (data: ProposalFormValues) => {
      // Format the validUntil field as ISO string and ensure it's properly formatted
      let validUntilDate;
      
      try {
        if (data.validUntil instanceof Date) {
          validUntilDate = data.validUntil.toISOString();
        } else if (typeof data.validUntil === 'string') {
          // If it's already a string, try to parse it as a Date and convert to ISO string
          const date = new Date(data.validUntil);
          // Check if date is valid
          if (isNaN(date.getTime())) {
            // If invalid, use current date + 30 days
            validUntilDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          } else {
            validUntilDate = date.toISOString();
          }
        } else {
          // Fallback - use current date + 30 days
          validUntilDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }
      } catch (e) {
        console.error("Error processing date:", e);
        // Safe fallback - use current date + 30 days
        validUntilDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
      
      // Make sure all items are properly formatted
      let processedItems = [];
      try {
        if (typeof data.items === "string") {
          processedItems = JSON.parse(data.items);
        } else if (Array.isArray(data.items)) {
          processedItems = data.items;
        }
      } catch (e) {
        console.error("Error processing items:", e);
        processedItems = [];
      }
      
      const formattedData = {
        ...data,
        validUntil: validUntilDate,
        items: processedItems,
      };
      
      console.log("Sending proposal data:", formattedData);
      
      const res = await apiRequest("POST", `/api/events/${eventId}/proposals`, formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/proposals`] });
      toast({
        title: "Proposal created",
        description: "Proposal has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      form.reset();
      setProposalItems([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update proposal mutation
  const updateProposal = useMutation({
    mutationFn: async ({ proposalId, data }: { proposalId: number; data: Partial<Proposal> }) => {
      const res = await apiRequest("PATCH", `/api/proposals/${proposalId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/proposals`] });
      toast({
        title: "Proposal updated",
        description: "Proposal has been updated successfully.",
      });
      setIsViewDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send proposal mutation (change status from draft to pending)
  const sendProposal = useMutation({
    mutationFn: async (proposalId: number) => {
      const res = await apiRequest("PATCH", `/api/proposals/${proposalId}`, {
        status: "pending",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/proposals`] });
      toast({
        title: "Proposal sent",
        description: "Proposal has been sent to the customer for review.",
      });
      setIsViewDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Send failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Setup form
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      title: "",
      description: "",
      totalPrice: 0,
      validUntil: addDays(new Date(), 14),
      items: "[]",
    },
  });

  // Add an item to the proposal
  const addProposalItem = () => {
    if (!itemName || !itemPrice) {
      toast({
        title: "Missing information",
        description: "Please provide at least a name and price for the item.",
        variant: "destructive",
      });
      return;
    }

    const newItem: ProposalItemType = {
      id: `item-${Date.now()}`,
      name: itemName,
      description: itemDesc,
      price: parseFloat(itemPrice),
      quantity: parseInt(itemQuantity) || 1,
    };

    const updatedItems = [...proposalItems, newItem];
    setProposalItems(updatedItems);

    // Update total price
    const totalPrice = updatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    form.setValue("totalPrice", totalPrice);
    form.setValue("items", JSON.stringify(updatedItems));

    // Clear item form
    setItemName("");
    setItemDesc("");
    setItemPrice("");
    setItemQuantity("1");
  };

  // Remove an item from the proposal
  const removeProposalItem = (id: string) => {
    const updatedItems = proposalItems.filter((item) => item.id !== id);
    setProposalItems(updatedItems);

    // Update total price
    const totalPrice = updatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    form.setValue("totalPrice", totalPrice);
    form.setValue("items", JSON.stringify(updatedItems));
  };

  // Handle form submission
  const onSubmit = (data: ProposalFormValues) => {
    if (proposalItems.length === 0) {
      toast({
        title: "No items added",
        description: "Please add at least one item to the proposal.",
        variant: "destructive",
      });
      return;
    }

    createProposal.mutate(data);
  };

  // Handle opening the view dialog
  const handleViewProposal = (proposal: Proposal) => {
    setCurrentProposal(proposal);
    setIsViewDialogOpen(true);
  };

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

  return (
    <div className="space-y-4">
      {!hideTitle && (
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold tracking-tight">
            Proposals for: {eventName}
          </h2>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Proposal
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>{hideTitle ? "Proposals" : "Event Proposals"}</CardTitle>
            <CardDescription>
              Manage proposals for this event
            </CardDescription>
          </div>
          {hideTitle && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-gray-500">Loading proposals...</span>
            </div>
          ) : !proposals || proposals.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No proposals found for this event.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Create New Proposal
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal) => (
                    <TableRow key={proposal.id}>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {proposal.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {proposal.description.length > 70 
                              ? `${proposal.description.substring(0, 70)}...` 
                              : proposal.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          ${Number(proposal.totalPrice).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(proposal.status || 'draft')}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {proposal.validUntil
                            ? format(new Date(proposal.validUntil), "MMM d, yyyy")
                            : "No expiration"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewProposal(proposal)}
                          className="mr-1"
                        >
                          View
                        </Button>
                        {proposal.status === "draft" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendProposal.mutate(proposal.id)}
                          >
                            <Send className="mr-1 h-3 w-3" /> Send
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Proposal Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Proposal</DialogTitle>
            <DialogDescription>
              Create a proposal for {eventName}. Add items, services, or products to include in the proposal.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proposal Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Event Services Package" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed description of the proposal..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid Until</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          onChange={(e) => {
                            const newDate = e.target.value ? new Date(e.target.value) : null;
                            field.onChange(newDate);
                          }}
                          value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-2">Proposal Items</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      placeholder="e.g., DJ Services"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      placeholder="e.g., 4-hour professional DJ service"
                      value={itemDesc}
                      onChange={(e) => setItemDesc(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Price ($)</label>
                    <Input
                      type="number"
                      placeholder="e.g., 500"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <Input
                      type="number"
                      placeholder="e.g., 1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addProposalItem}
                  className="mb-4"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>

                {proposalItems.length > 0 && (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {proposalItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-gray-500">
                                  {item.description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>${item.price.toFixed(2)}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              ${(item.price * item.quantity).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeProposalItem(item.id)}
                              >
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div className="text-lg font-semibold">
                  Total: ${form.watch("totalPrice").toFixed(2)}
                </div>
                <DialogFooter className="sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createProposal.isPending}>
                    {createProposal.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Proposal
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Proposal Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Proposal Details</DialogTitle>
            <DialogDescription>
              Review the details of this proposal
            </DialogDescription>
          </DialogHeader>

          {currentProposal && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{currentProposal.title}</h2>
                  <p className="text-gray-500">
                    Created on {currentProposal.createdAt ? format(new Date(currentProposal.createdAt), "MMM d, yyyy") : "-"}
                  </p>
                </div>
                <div>{getStatusBadge(currentProposal.status || 'draft')}</div>
              </div>

              <p className="text-gray-700">{currentProposal.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Valid Until</h3>
                  <p className="mt-1">
                    {currentProposal.validUntil
                      ? format(new Date(currentProposal.validUntil), "MMM d, yyyy")
                      : "No expiration"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Price</h3>
                  <p className="mt-1 text-lg font-semibold">
                    ${Number(currentProposal.totalPrice).toLocaleString()}
                  </p>
                </div>
              </div>

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
                      {(currentProposal.items as ProposalItemType[]).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-gray-500">
                                {item.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>${item.price.toFixed(2)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            ${(item.price * item.quantity).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {currentProposal.status === "rejected" && currentProposal.feedback && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Customer Feedback</AlertTitle>
                  <AlertDescription>
                    {currentProposal.feedback}
                  </AlertDescription>
                </Alert>
              )}

              <DialogFooter className="flex justify-between items-center">
                <div>
                  {currentProposal.status === "draft" && (
                    <Button
                      variant="outline"
                      onClick={() => sendProposal.mutate(currentProposal.id)}
                      disabled={updateProposal.isPending}
                    >
                      {updateProposal.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Send to Customer
                    </Button>
                  )}
                </div>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}