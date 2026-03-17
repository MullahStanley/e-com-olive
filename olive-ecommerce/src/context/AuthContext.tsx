'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import type { User } from '@/types';

// 1. Define the shape of our Context
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

// 2. Create the Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Create the Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  // Start as true so we don't flash "logged out" UI while checking the cookie
  const [isLoading, setIsLoading] = useState(true); 
  
  const router = useRouter();
  const pathname = usePathname();

  // Function to verify the user against the backend
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to verify session:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run the auth check when the app first mounts
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Global logout function
  const logout = async () => {
    try {
      // Show loading toast for better UX
      const loadingToast = toast.loading('Logging out...');
      
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      
      toast.dismiss(loadingToast);

      if (!res.ok) throw new Error('Logout failed');
      
      setUser(null);
      toast.success('Logged out successfully');
      
      // If they are on a protected route, boot them to the homepage
      if (pathname.startsWith('/admin') || pathname.startsWith('/checkout') || pathname.startsWith('/orders')) {
        router.push('/');
      }
      
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, checkAuth, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. Create a custom hook for easy consumption
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}