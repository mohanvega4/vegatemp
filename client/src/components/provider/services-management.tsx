import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useProviderServices } from '@/hooks/use-provider-services';
import { useAuth } from '@/hooks/use-auth';
import { insertServiceSchema, serviceTypeEnum } from '@shared/schema';

// Extend the insert schema with additional validation
const serviceSchema = insertServiceSchema.extend({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  serviceType: z.enum(serviceTypeEnum.enumValues),
  serviceCategory: z.string().min(2, 'Category is required'),
  basePrice: z.string().min(1, 'Base price is required'), // Keep as string
  priceExclusions: z.string().optional().nullable().transform(val => val || ''),
  isAvailable: z.boolean().default(true),
  // Make providerId optional as it will be set by the server
  providerId: z.number().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function ServicesManagement() {
  const { user } = useAuth();
  // Use the authenticated user's ID for the services
  const { services, isLoading, addService, updateService, isUpdating } = useProviderServices(user?.id);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: '',
      description: '',
      serviceType: 'entertainment',
      serviceCategory: '',
      basePrice: '', // Changed from number to string to match schema
      priceExclusions: '',
      isAvailable: true,
    },
  });

  // Show form validation errors in the console for debugging
  console.log("Form validation errors:", form.formState.errors);

  const onSubmit = async (data: ServiceFormValues) => {
    console.log('Form submitted with data:', data);
    
    if (!user || !user.id) {
      console.error('User is not authenticated or missing ID');
      return;
    }
    
    // Get the current provider ID from the authenticated user
    const providerIdFromUser = user.id;
    
    // Ensure fields are properly formatted
    const serviceData = {
      ...data,
      basePrice: data.basePrice.toString(), // Ensure basePrice is a string
      priceExclusions: data.priceExclusions || '', // Ensure not null
      providerId: providerIdFromUser, // Use the authenticated user's ID
    };
    
    console.log('Formatted service data with providerId:', serviceData);
    
    try {
      if (editingServiceId) {
        console.log('Updating service with ID:', editingServiceId);
        await updateService({
          ...serviceData,
          id: editingServiceId,
        });
      } else {
        console.log('Adding new service with user ID:', providerIdFromUser);
        await addService(serviceData);
      }
      console.log('Service operation completed');
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error submitting service form:', error);
      // Keep the form open when there's an error
    }
  };

  const editService = (serviceId: number) => {
    const serviceToEdit = services.find(s => s.id === serviceId);
    if (serviceToEdit) {
      form.reset({
        title: serviceToEdit.title,
        description: serviceToEdit.description || '',
        serviceType: serviceToEdit.serviceType,
        serviceCategory: serviceToEdit.serviceCategory,
        basePrice: serviceToEdit.basePrice || '', // Keep as string
        priceExclusions: serviceToEdit.priceExclusions || '',
        isAvailable: serviceToEdit.isAvailable,
      });
      setEditingServiceId(serviceId);
      setIsDialogOpen(true);
    }
  };

  const resetForm = () => {
    form.reset({
      title: '',
      description: '',
      serviceType: 'entertainment',
      serviceCategory: '',
      basePrice: '', // Change from number to string to match schema
      priceExclusions: '',
      isAvailable: true,
    });
    setEditingServiceId(null);
  };

  // Define service type options from enum
  const serviceTypeOptions = serviceTypeEnum.enumValues;

  // Define common service categories
  const serviceCategoryOptions = {
    'entertainment': ['DJ', 'Live Band', 'Performance', 'Musician', 'Comedy', 'Magic', 'Emcee'],
    'media': ['Photography', 'Videography', 'Animation', 'Design', 'Streaming'],
    'stage': ['Performance', 'Dance', 'Theater', 'Lights', 'Sound', 'Multimedia'],
    'activity': ['Workshop', 'Team Building', 'Interactive', 'Games'],
    'host': ['Emcee', 'Moderator', 'Host', 'Speaker'],
    'food': ['Catering', 'Chef', 'Bartending', 'Food Truck', 'Beverage'],
    'digital': ['Audio Services', 'Production', 'Editing', 'Visual Effects'],
  };

  // Get appropriate category options based on selected service type
  const selectedServiceType = form.watch('serviceType') as keyof typeof serviceCategoryOptions;
  const categoryOptions = serviceCategoryOptions[selectedServiceType] || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Services</h1>
        <Button 
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="bg-primary text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{editingServiceId ? 'Edit Service' : 'Add New Service'}</DialogTitle>
              <DialogDescription>
                {editingServiceId 
                  ? 'Update your service details below.'
                  : 'Create a new service to offer to your customers.'
                }
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., DJ Services, Photography Package" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a service type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {serviceTypeOptions.map(type => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="serviceCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoryOptions.map(category => (
                              <SelectItem key={category} value={category.toLowerCase()}>
                                {category}
                              </SelectItem>
                            ))}
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your service in detail, including what's included"
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Price ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value)}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isAvailable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Available for Booking</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="priceExclusions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Exclusions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List what's not included in the base price (e.g., travel expenses, equipment rentals)"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="mt-6">
                  <Button type="submit" className="bg-primary text-white" disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingServiceId ? 'Update Service' : 'Add Service'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium mb-4">Your Services</h2>
        
        {services.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p className="text-lg font-medium mb-2">No Services Yet</p>
            <p className="mb-4">Add your first service to start receiving booking requests.</p>
            <Button 
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="bg-primary text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Service
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{service.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{service.serviceType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{service.serviceCategory}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${Number(service.basePrice).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        service.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {service.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editService(service.id)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}