'use client';

import { createContext, useContext, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { User } from 'firebase/auth';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (error) {
      toast.error('Authentication error: ' + error.message);
    }
  }, [error]);

  useEffect(() => {
    if (!loading) {
      // If not authenticated and trying to access protected routes
      if (!user && !pathname.startsWith('/auth')) {
        router.push('/auth');
      }
      // If authenticated and trying to access auth pages
      if (user && pathname.startsWith('/auth')) {
        router.push('/feed');
      }
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user: user || null, loading }}>
      {children}
    </AuthContext.Provider>
  );
}