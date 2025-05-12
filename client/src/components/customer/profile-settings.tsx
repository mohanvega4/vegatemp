import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Loader2, 
  Save, 
  Upload,
  User,
  Bell,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomerProfile, UpdateProfileData } from '@/hooks/use-customer-profile';
import { useAuth } from '@/hooks/use-auth';

// Define profile schema for validation
const profileSchema = z.object({
  customerType: z.enum(['individual', 'corporate', 'planner']),
  companyName: z.string().optional(),
  phoneNumber: z.string().min(5, 'Phone number must be at least 5 characters').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  notificationEmail: z.boolean(),
  notificationSms: z.boolean(),
  notificationApp: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettings() {
  const { user } = useAuth();
  const { profile, isLoading, updateProfile, isUpdating } = useCustomerProfile();
  const [activeTab, setActiveTab] = useState('general');
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      customerType: profile?.customerType || 'individual',
      companyName: profile?.companyName || '',
      phoneNumber: profile?.phoneNumber || '',
      address: profile?.address || '',
      city: profile?.city || '',
      country: profile?.country || '',
      timezone: profile?.timezone || '',
      notificationEmail: profile?.notificationPreferences?.email || true,
      notificationSms: profile?.notificationPreferences?.sms || false,
      notificationApp: profile?.notificationPreferences?.app || true,
    },
  });
  
  const onSubmit = (data: ProfileFormValues) => {
    const updateData: UpdateProfileData = {
      customerType: data.customerType,
      companyName: data.companyName,
      phoneNumber: data.phoneNumber,
      address: data.address,
      city: data.city,
      country: data.country,
      timezone: data.timezone,
      notificationPreferences: {
        email: data.notificationEmail,
        sms: data.notificationSms,
        app: data.notificationApp,
      },
    };
    
    updateProfile(updateData);
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
      <div>
        <h1 className="text-2xl font-semibold">Account Settings</h1>
        <p className="text-gray-500">Manage your profile and preferences</p>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
      >
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                      {user?.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.name} 
                          className="w-32 h-32 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="mb-2">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                    <p className="text-xs text-gray-500">
                      JPG, GIF or PNG. Max size 1MB.
                    </p>
                  </div>
                </div>
                
                <div className="md:w-2/3 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <Input 
                        type="text" 
                        value={user?.name || ""}
                        readOnly
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Contact admin to change your name
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input 
                        type="email" 
                        value={user?.email || ""}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="customerType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="individual">Individual</SelectItem>
                            <SelectItem value="corporate">Corporate</SelectItem>
                            <SelectItem value="planner">Event Planner</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch('customerType') !== 'individual' && (
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company/Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Your city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="UK">United Kingdom</SelectItem>
                              <SelectItem value="CA">Canada</SelectItem>
                              <SelectItem value="AU">Australia</SelectItem>
                              <SelectItem value="FR">France</SelectItem>
                              <SelectItem value="DE">Germany</SelectItem>
                              <SelectItem value="JP">Japan</SelectItem>
                              <SelectItem value="AE">United Arab Emirates</SelectItem>
                              <SelectItem value="SA">Saudi Arabia</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Your address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                            <SelectItem value="EST">EST (Eastern Standard Time)</SelectItem>
                            <SelectItem value="CST">CST (Central Standard Time)</SelectItem>
                            <SelectItem value="MST">MST (Mountain Standard Time)</SelectItem>
                            <SelectItem value="PST">PST (Pacific Standard Time)</SelectItem>
                            <SelectItem value="GMT">GMT (Greenwich Mean Time)</SelectItem>
                            <SelectItem value="IST">IST (India Standard Time)</SelectItem>
                            <SelectItem value="JST">JST (Japan Standard Time)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Settings</h3>
                <p className="text-gray-500">
                  Manage how and when you'd like to be notified
                </p>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Email Notifications</CardTitle>
                    <CardDescription>Receive updates via email</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="notificationEmail"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-primary" />
                              <FormLabel>Email Notifications</FormLabel>
                            </div>
                            <FormDescription>
                              Receive booking updates, reminders, and other important alerts
                            </FormDescription>
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
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SMS Notifications</CardTitle>
                    <CardDescription>Receive updates via text message</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="notificationSms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <div className="flex items-center">
                              <Bell className="h-4 w-4 mr-2 text-primary" />
                              <FormLabel>SMS Notifications</FormLabel>
                            </div>
                            <FormDescription>
                              Receive time-sensitive notifications via SMS
                            </FormDescription>
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
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">In-App Notifications</CardTitle>
                    <CardDescription>Receive notifications within the app</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="notificationApp"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <div className="flex items-center">
                              <Bell className="h-4 w-4 mr-2 text-primary" />
                              <FormLabel>In-App Notifications</FormLabel>
                            </div>
                            <FormDescription>
                              Receive all updates and alerts within the application
                            </FormDescription>
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
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Notification Settings
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="password">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Change Password</h3>
            <p className="text-gray-500">
              Update your password to keep your account secure
            </p>
            
            <form className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <Input type="password" placeholder="Enter current password" />
                </div>
                
                <Separator />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <Input type="password" placeholder="Enter new password" />
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 8 characters and include a mix of letters, numbers, and symbols
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <Input type="password" placeholder="Confirm new password" />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button type="submit" disabled={false}>
                  Update Password
                </Button>
              </div>
            </form>
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
              <p className="text-gray-500">
                Delete your account and all your data permanently
              </p>
              
              <Button variant="outline" className="border-red-200 text-red-600">
                Delete Account
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}