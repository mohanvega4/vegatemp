import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, Image as ImageIcon, Video, Link2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useProviderPortfolio } from '@/hooks/use-provider-portfolio';
import { useProviderServices } from '@/hooks/use-provider-services';
import { insertPortfolioItemSchema, portfolioTypeEnum } from '@shared/schema';

// Extend the insert schema with additional validation
const portfolioSchema = insertPortfolioItemSchema.extend({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  url: z.string().url('Please enter a valid URL'),
  type: z.enum(portfolioTypeEnum.enumValues),
});

type PortfolioFormValues = z.infer<typeof portfolioSchema>;

export default function PortfolioManagement() {
  const { portfolioItems, groupedItems, isLoading, addPortfolioItem, isAdding } = useProviderPortfolio();
  const { services, isLoading: isLoadingServices } = useProviderServices();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const form = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      title: '',
      description: '',
      url: '',
      type: 'image',
      serviceId: undefined,
    },
  });
  
  const selectedType = form.watch('type');

  const onSubmit = (data: PortfolioFormValues) => {
    addPortfolioItem(data);
    setIsDialogOpen(false);
    form.reset();
  };

  const placeholderByType = {
    image: 'https://example.com/image.jpg',
    video: 'https://www.youtube.com/watch?v=example',
    link: 'https://www.example.com/portfolio',
  };

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
        <h1 className="text-2xl font-semibold">Portfolio</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add Portfolio Item</DialogTitle>
              <DialogDescription>
                Add photos, videos, or links to showcase your work. This helps customers get a better idea of your services.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="link">External Link</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Event Performance, Wedding Photography" {...field} />
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
                          placeholder="Briefly describe this portfolio item"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={placeholderByType[selectedType as keyof typeof placeholderByType]}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="serviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Service (Optional)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value && value !== "none" ? parseInt(value) : undefined)}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id.toString()}>
                              {service.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="mt-6">
                  <Button type="submit" className="bg-primary text-white" disabled={isAdding}>
                    {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add to Portfolio
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <Tabs defaultValue="images">
          <TabsList className="mb-4">
            <TabsTrigger value="images" className="flex items-center">
              <ImageIcon className="h-4 w-4 mr-2" />
              Images ({groupedItems.images.length})
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center">
              <Video className="h-4 w-4 mr-2" />
              Videos ({groupedItems.videos.length})
            </TabsTrigger>
            <TabsTrigger value="links" className="flex items-center">
              <Link2 className="h-4 w-4 mr-2" />
              Links ({groupedItems.links.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="images">
            {groupedItems.images.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Images Yet</h3>
                <p className="mb-4">Add images to showcase your work</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    form.reset({ ...form.getValues(), type: 'image' });
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Image
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {groupedItems.images.map((item) => (
                  <Card key={item.id}>
                    <div className="aspect-video w-full overflow-hidden">
                      <img 
                        src={item.url} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Image+Not+Found'}
                      />
                    </div>
                    <CardHeader className="p-4 pb-0">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="videos">
            {groupedItems.videos.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <Video className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Videos Yet</h3>
                <p className="mb-4">Add videos to showcase your performances</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    form.reset({ ...form.getValues(), type: 'video' });
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Video
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedItems.videos.map((item) => (
                  <Card key={item.id}>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        Watch Video
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="links">
            {groupedItems.links.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <Link2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Links Yet</h3>
                <p className="mb-4">Add links to external portfolios or websites</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    form.reset({ ...form.getValues(), type: 'link' });
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {groupedItems.links.map((item) => (
                  <Card key={item.id}>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm flex items-center"
                      >
                        <Link2 className="h-4 w-4 mr-1" />
                        {item.url}
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}