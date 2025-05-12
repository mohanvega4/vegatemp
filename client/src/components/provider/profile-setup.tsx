import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useProviderProfile } from '@/hooks/use-provider-profile';
import { useAuth } from '@/hooks/use-auth';
import { insertProviderProfileSchema } from '@shared/schema';

// Extend the insert schema with additional validation
const profileSchema = insertProviderProfileSchema.extend({
  contactName: z.string().min(2, 'Contact name must be at least 2 characters'),
  contactPhone: z.string().min(5, 'Contact phone must be at least 5 characters'),
  languages: z.array(z.string()).min(1, 'Please select at least one language'),
  currentResidence: z.string().min(3, 'Please enter your current residence'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSetup() {
  const { user } = useAuth();
  const { profile, isLoading, updateProfile, isUpdating } = useProviderProfile();
  const [languages, setLanguages] = useState<string[]>(['English']);
  
  // Common languages for the form
  const commonLanguages = [
    'English', 'Spanish', 'French', 'German', 'Mandarin', 'Arabic', 'Hindi', 'Portuguese', 'Japanese'
  ];
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      userId: user?.id,
      isGroup: profile?.profile?.isGroup || false,
      groupName: profile?.profile?.groupName || '',
      teamSize: profile?.profile?.teamSize || undefined,
      contactName: profile?.profile?.contactName || user?.name || '',
      contactPhone: profile?.profile?.contactPhone || user?.phone || '',
      currentResidence: profile?.profile?.currentResidence || 
        (user?.city && user?.country ? `${user.city}, ${user.country}` : ''),
      languages: profile?.profile?.languages || ['English'],
      verified: false,
      featuredProvider: false,
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateProfile({
      ...data,
      languages: languages.length > 0 ? languages : ['English'],
    });
  };

  // Handle toggle for group/individual
  const isGroup = form.watch('isGroup');

  const toggleLanguage = (language: string) => {
    if (languages.includes(language)) {
      setLanguages(languages.filter(l => l !== language));
    } else {
      setLanguages([...languages, language]);
    }
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
        <h1 className="text-2xl font-semibold mb-6">Profile Setup</h1>
        <p className="text-gray-500 mb-6">
          Complete your profile to appear in search results and receive booking requests.
          More complete profiles have higher visibility.
        </p>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Provider Type */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Provider Type</h3>
                <FormField
                  control={form.control}
                  name="isGroup"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Group/Organization
                        </FormLabel>
                        <p className="text-sm text-gray-500">
                          Are you registering as a group, team, or organization?
                        </p>
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

              {/* Group Information (conditionally shown) */}
              {isGroup && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-medium">Group Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="groupName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group/Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter group name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="teamSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team Size</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Number of members" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Primary contact person" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Location & Languages */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium">Location & Languages</h3>
                <div className="grid grid-cols-1 gap-6">
                  <FormField
                    control={form.control}
                    name="currentResidence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Residence</FormLabel>
                        <FormControl>
                          <Input placeholder="City, Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <FormLabel>Languages Spoken</FormLabel>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {commonLanguages.map(language => (
                        <Button
                          key={language}
                          type="button"
                          variant={languages.includes(language) ? "default" : "outline"}
                          onClick={() => toggleLanguage(language)}
                          className="mb-2"
                        >
                          {language}
                        </Button>
                      ))}
                    </div>
                    {languages.length === 0 && (
                      <p className="text-sm text-red-500 mt-2">Please select at least one language</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button
                  type="submit"
                  className="bg-primary text-white"
                  disabled={isUpdating}
                >
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Profile
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}