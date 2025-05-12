import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { LoginData } from "@shared/new-schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: number;
  userId: number;
  [key: string]: any;
}

type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'employee' | 'customer' | 'provider';
  status: 'active' | 'pending' | 'rejected' | 'inactive';
  emailVerification: 'verified' | 'pending' | 'failed';
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  profileId?: number;
};

type AuthContextType = {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  error: Error | null;
  profileError: Error | null;
  loginMutation: UseMutationResult<AuthUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<AuthUser, Error, RegisterData>;
};

type RegisterData = {
  username: string;
  email: string;
  password: string;
  role: 'customer' | 'provider';
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Fetch current user
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<AuthUser | null, Error>({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Fetch user profile if user is authenticated
  const {
    data: profile,
    error: profileError,
    isLoading: isProfileLoading,
  } = useQuery<Profile | null, Error>({
    queryKey: ['/api/profile'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });
  
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to login');
      }
      return await res.json();
    },
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData(['/api/user'], user);
      // Trigger profile query after successful login
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
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
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to register');
      }
      return await res.json();
    },
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData(['/api/user'], user);
      // Trigger profile query after successful registration
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });
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
      const res = await apiRequest("POST", "/api/logout");
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to logout');
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
      queryClient.setQueryData(['/api/profile'], null);
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
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
        user,
        profile,
        isLoading,
        isProfileLoading,
        error,
        profileError,
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