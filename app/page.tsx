'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/feed');
      } else {
        router.push('/auth');
      }
    }
  }, [user, loading, router]);

  // Return null or a loading state while redirecting
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return null;
}
