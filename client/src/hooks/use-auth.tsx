import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser, LoginData } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      // Update user data in cache
      queryClient.setQueryData(["/api/user"], user);
      
      // Invalidate all caches to ensure they're refetched with the new user's data
      // This ensures cached data from previous users isn't shown
      
      // Invalidate all customer-specific caches
      queryClient.invalidateQueries({ queryKey: ['/api/customer/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/profile'] });
      
      // Invalidate all provider-specific caches
      queryClient.invalidateQueries({ queryKey: ['/api/providers/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/providers/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/providers/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/providers/reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/providers/portfolio'] });
      
      // Invalidate admin-specific caches
      queryClient.invalidateQueries({ queryKey: ['/api/admin'] });
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (data) => {
      // If registration returned a user object with no message, they were automatically logged in
      if (data && !data.message) {
        queryClient.setQueryData(["/api/user"], data);
        
        // Invalidate all caches to ensure clean state for new user
        // Invalidate all customer-specific caches
        queryClient.invalidateQueries({ queryKey: ['/api/customer/events'] });
        queryClient.invalidateQueries({ queryKey: ['/api/customer/bookings'] });
        queryClient.invalidateQueries({ queryKey: ['/api/customer/profile'] });
        
        // Invalidate all provider-specific caches
        queryClient.invalidateQueries({ queryKey: ['/api/providers/services'] });
        queryClient.invalidateQueries({ queryKey: ['/api/providers/bookings'] });
        queryClient.invalidateQueries({ queryKey: ['/api/providers/profile'] });
        queryClient.invalidateQueries({ queryKey: ['/api/providers/reviews'] });
        queryClient.invalidateQueries({ queryKey: ['/api/providers/portfolio'] });
        
        // Invalidate admin-specific caches
        queryClient.invalidateQueries({ queryKey: ['/api/admin'] });
        
        toast({
          title: "Registration successful",
          description: `Welcome to Vega Show, ${data.name}!`,
        });
      } else {
        // Registration successful but awaiting approval
        toast({
          title: "Registration successful",
          description: data.message || "Your account is pending approval.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Clear user data
      queryClient.setQueryData(["/api/user"], null);
      
      // Invalidate all customer-specific caches
      queryClient.invalidateQueries({ queryKey: ['/api/customer/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/profile'] });
      
      // Invalidate all provider-specific caches
      queryClient.invalidateQueries({ queryKey: ['/api/providers/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/providers/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/providers/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/providers/reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/providers/portfolio'] });
      
      // Invalidate admin-specific caches
      queryClient.invalidateQueries({ queryKey: ['/api/admin'] });
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}